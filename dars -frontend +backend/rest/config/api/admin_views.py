"""React admin panel uchun API (/api/admin/...).

Faqat is_staff foydalanuvchilar uchun. Kirish: /api/admin/login/ -> token,
keyingi so'rovlarda "Authorization: Token <token>" sarlavhasi yuboriladi.
"""

from django.contrib.auth import authenticate
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum
from django.db.models.deletion import ProtectedError
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.generics import (
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .admin_serializers import (
    AdminCategorySerializer,
    AdminGiftSerializer,
    AdminLoginSerializer,
    AdminOrderSerializer,
    AdminUserSerializer,
)
from .models import Category, Favorite, Gift, Order, OrderStatus


class AdminAPIMixin:
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAdminUser]


# =========================
# AUTH
# =========================

class AdminLoginAPIView(APIView):

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'admin_login'

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )

        if user is None:
            return Response(
                {'detail': "Login yoki parol noto'g'ri."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_staff:
            return Response(
                {'detail': "Bu foydalanuvchida admin huquqi yo'q."},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': AdminUserSerializer(user).data,
        })


class AdminMeAPIView(AdminAPIMixin, APIView):

    def get(self, request):
        return Response(AdminUserSerializer(request.user).data)


class AdminLogoutAPIView(AdminAPIMixin, APIView):

    def post(self, request):
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================
# DASHBOARD
# =========================

class AdminStatsAPIView(AdminAPIMixin, APIView):

    def get(self, request):
        order_total = ExpressionWrapper(
            F('unit_price') * F('quantity'),
            output_field=DecimalField(max_digits=14, decimal_places=2),
        )

        counts = dict(
            Order.objects.values_list('status').annotate(n=Count('id'))
        )
        by_status = [
            {'value': value, 'label': label, 'count': counts.get(value, 0)}
            for value, label in OrderStatus.choices
        ]

        revenue = (
            Order.objects
            .exclude(status=OrderStatus.CANCELLED)
            .aggregate(total=Sum(order_total))['total']
        ) or 0

        top_gifts = (
            Gift.objects
            .annotate(favorites_count=Count('favorites'))
            .filter(favorites_count__gt=0)
            .order_by('-favorites_count', 'name')[:5]
        )

        return Response({
            'gifts': Gift.objects.count(),
            'categories': Category.objects.count(),
            'favorites': Favorite.objects.count(),
            'orders': sum(item['count'] for item in by_status),
            'orders_by_status': by_status,
            'revenue': revenue,
            'top_gifts': [
                {'id': gift.id, 'name': gift.name, 'favorites_count': gift.favorites_count}
                for gift in top_gifts
            ],
        })


# =========================
# ORDERS
# =========================

class AdminOrderListAPIView(AdminAPIMixin, ListAPIView):
    """?status=new|confirmed|delivered|cancelled  ?search=ism/telefon/manzil/sovg'a/#id"""

    serializer_class = AdminOrderSerializer

    def get_queryset(self):
        queryset = Order.objects.select_related('gift__category')
        params = self.request.query_params

        status_value = params.get('status')
        if status_value in OrderStatus.values:
            queryset = queryset.filter(status=status_value)

        search = params.get('search', '').strip()
        if search.startswith('#') and search[1:].isdigit():
            # "#12" — aynan buyurtma raqami bo'yicha
            queryset = queryset.filter(pk=int(search[1:]))
        elif search:
            condition = (
                Q(customer_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(address__icontains=search)
                | Q(gift__name__icontains=search)
            )
            if search.isdigit():
                condition |= Q(pk=int(search))
            queryset = queryset.filter(condition)

        return queryset


class AdminOrderDetailAPIView(AdminAPIMixin, RetrieveUpdateDestroyAPIView):

    queryset = Order.objects.select_related('gift__category')
    serializer_class = AdminOrderSerializer
    http_method_names = ['get', 'patch', 'delete', 'options', 'head']


# =========================
# GIFTS
# =========================

def annotated_gifts():
    return Gift.objects.select_related('category').annotate(
        favorites_count=Count('favorites', distinct=True),
        orders_count=Count('orders', distinct=True),
    )


class AdminGiftListCreateAPIView(AdminAPIMixin, ListCreateAPIView):
    """?search=nom  ?category=<id>"""

    serializer_class = AdminGiftSerializer

    def get_queryset(self):
        queryset = annotated_gifts()
        params = self.request.query_params

        search = params.get('search', '').strip()
        if search:
            queryset = queryset.filter(name__icontains=search)

        category = params.get('category', '')
        if category.isdigit():
            queryset = queryset.filter(category_id=int(category))

        return queryset


class AdminGiftDetailAPIView(AdminAPIMixin, RetrieveUpdateDestroyAPIView):

    serializer_class = AdminGiftSerializer

    def get_queryset(self):
        return annotated_gifts()

    def destroy(self, request, *args, **kwargs):
        gift = self.get_object()

        try:
            gift.delete()
        except ProtectedError:
            return Response(
                {'detail': f"Bu sovg'aga {gift.orders_count} ta buyurtma bog'langan — o'chirib bo'lmaydi."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================
# CATEGORIES
# =========================

class AdminCategoryListCreateAPIView(AdminAPIMixin, ListCreateAPIView):

    queryset = Category.objects.annotate(gift_count=Count('gifts'))
    serializer_class = AdminCategorySerializer


class AdminCategoryDetailAPIView(AdminAPIMixin, RetrieveUpdateDestroyAPIView):

    queryset = Category.objects.annotate(gift_count=Count('gifts'))
    serializer_class = AdminCategorySerializer
    http_method_names = ['get', 'patch', 'delete', 'options', 'head']

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()

        try:
            category.delete()
        except ProtectedError:
            return Response(
                {'detail': (
                    f"Bu kategoriyada {category.gift_count} ta sovg'a bor — "
                    "avval ularni boshqa kategoriyaga o'tkazing yoki o'chiring."
                )},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
