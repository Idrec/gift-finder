from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import Category, Order, OrderStatus
from .serializers import GiftSerializer


class AdminLoginSerializer(serializers.Serializer):

    username = serializers.CharField(error_messages={
        'required': "Loginni kiriting.",
        'blank': "Loginni kiriting.",
    })
    password = serializers.CharField(
        trim_whitespace=False,
        error_messages={
            'required': "Parolni kiriting.",
            'blank': "Parolni kiriting.",
        },
    )


class AdminUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'is_superuser']


class AdminCategorySerializer(serializers.ModelSerializer):

    gift_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'gift_count']
        extra_kwargs = {
            'name': {
                'validators': [UniqueValidator(
                    queryset=Category.objects.all(),
                    message="Bunday kategoriya allaqachon bor.",
                )],
                'error_messages': {
                    'required': "Kategoriya nomini kiriting.",
                    'blank': "Kategoriya nomini kiriting.",
                    'max_length': "Nom 100 belgidan oshmasligi kerak.",
                },
            },
        }

    def get_gift_count(self, obj):
        count = getattr(obj, 'gift_count', None)  # ro'yxatda annotate qilingan
        return obj.gifts.count() if count is None else count


class AdminGiftSerializer(GiftSerializer):

    favorites_count = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()

    class Meta(GiftSerializer.Meta):
        fields = GiftSerializer.Meta.fields + ['favorites_count', 'orders_count']

    def get_favorites_count(self, obj):
        return getattr(obj, 'favorites_count', 0)

    def get_orders_count(self, obj):
        return getattr(obj, 'orders_count', 0)


class AdminOrderSerializer(serializers.ModelSerializer):
    """Admin faqat holatni o'zgartiradi; qolgan maydonlar faqat o'qish uchun."""

    gift = GiftSerializer(read_only=True)
    unit_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, coerce_to_string=False
    )
    total_price = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True, coerce_to_string=False
    )
    status = serializers.ChoiceField(
        choices=OrderStatus.choices,
        error_messages={
            'required': "Holatni tanlang.",
            'invalid_choice': "Noto'g'ri holat.",
        },
    )
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'gift',
            'customer_name',
            'phone',
            'address',
            'quantity',
            'note',
            'unit_price',
            'total_price',
            'status',
            'status_label',
            'created_at',
        ]
        read_only_fields = [
            'customer_name',
            'phone',
            'address',
            'quantity',
            'note',
            'created_at',
        ]
