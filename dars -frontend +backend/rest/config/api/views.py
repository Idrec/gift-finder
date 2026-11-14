import re

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView, ListCreateAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Gift, Favorite, Order, Recipient
from .serializers import (
    CategorySerializer,
    GiftSerializer,
    GiftFilterSerializer,
    FavoriteSerializer,
    OrderSerializer,
)


# CATEGORY LIST

class CategoryListAPIView(ListAPIView):

    queryset = Category.objects.all()
    serializer_class = CategorySerializer


# RECIPIENT ("Kimga?") VARIANTLARI

class RecipientListAPIView(APIView):

    def get(self, request):
        return Response([
            {'value': value, 'label': label}
            for value, label in Recipient.choices
        ])


# GIFT LIST + CREATE
#
# Filtrlar (hammasi ixtiyoriy):
#   ?category=<id>              kategoriya bo'yicha
#   ?min_price=..&max_price=..  narx oralig'i
#   ?recipient=..&age=..&budget=..   Gift Finder

class GiftListCreateAPIView(ListCreateAPIView):

    serializer_class = GiftSerializer

    def get_queryset(self):
        queryset = Gift.objects.select_related('category')

        if self.request.method != 'GET':
            return queryset

        params = GiftFilterSerializer(data=self.request.query_params)
        params.is_valid(raise_exception=True)
        f = params.validated_data

        if 'category' in f:
            queryset = queryset.filter(category_id=f['category'])

        if 'min_price' in f:
            queryset = queryset.filter(price__gte=f['min_price'])

        if 'max_price' in f:
            queryset = queryset.filter(price__lte=f['max_price'])

        if 'recipient' in f:
            queryset = queryset.filter(recipient=f['recipient'])

        if 'age' in f:
            queryset = queryset.filter(
                min_age__lte=f['age'],
                max_age__gte=f['age'],
            )

        if 'budget' in f:
            queryset = queryset.filter(price__lte=f['budget'])

        return queryset


# FAVORITES
#
# Login yo'q: frontend localStorage'da anonim kalit saqlaydi va uni
# har bir so'rovda "X-Session-Key" sarlavhasida yuboradi.

SESSION_KEY_RE = re.compile(r'^[A-Za-z0-9-]{8,64}$')


class SessionKeyMixin:

    def get_session_key(self):
        key = self.request.headers.get('X-Session-Key', '')

        if not SESSION_KEY_RE.match(key):
            raise ValidationError({
                'detail': "X-Session-Key sarlavhasi yo'q yoki noto'g'ri."
            })

        return key


class FavoriteListCreateAPIView(SessionKeyMixin, ListCreateAPIView):

    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return (
            Favorite.objects
            .filter(session_key=self.get_session_key())
            .select_related('gift__category')
        )

    def create(self, request, *args, **kwargs):
        session_key = self.get_session_key()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        favorite, created = Favorite.objects.get_or_create(
            session_key=session_key,
            gift=serializer.validated_data['gift'],
        )

        return Response(
            self.get_serializer(favorite).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class FavoriteDestroyAPIView(SessionKeyMixin, APIView):

    def delete(self, request, gift_id):
        deleted, _ = Favorite.objects.filter(
            session_key=self.get_session_key(),
            gift_id=gift_id,
        ).delete()

        if not deleted:
            return Response(
                {'detail': "Bu sovg'a sevimlilarda yo'q."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


# ORDERS (to'lovsiz, savatsiz: bitta sovg'aga buyurtma)

class OrderListCreateAPIView(SessionKeyMixin, ListCreateAPIView):

    serializer_class = OrderSerializer

    def get_queryset(self):
        return (
            Order.objects
            .filter(session_key=self.get_session_key())
            .select_related('gift__category')
        )

    def create(self, request, *args, **kwargs):
        self.get_session_key()  # sarlavha bo'lmasa — 400
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(
            session_key=self.get_session_key(),
            unit_price=serializer.validated_data['gift'].price,
        )
