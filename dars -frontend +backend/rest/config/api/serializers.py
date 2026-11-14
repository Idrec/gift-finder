import re

from rest_framework import serializers

from .models import Category, Gift, Favorite, Order, Recipient


REQUIRED = "Bu maydon to'ldirilishi shart."

AGE_ERRORS = {
    'required': REQUIRED,
    'null': REQUIRED,
    'invalid': "Yosh butun son bo'lishi kerak.",
    'min_value': "Yosh manfiy bo'lmasligi kerak.",
    'max_value': "Yosh 120 dan oshmasligi kerak.",
}


# CATEGORY SERIALIZER

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ['id', 'name']


# GIFT SERIALIZER

class GiftSerializer(serializers.ModelSerializer):

    category_name = serializers.ReadOnlyField(source='category.name')
    recipient_label = serializers.CharField(
        source='get_recipient_display',
        read_only=True
    )

    price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0,
        coerce_to_string=False,
        error_messages={
            'required': REQUIRED,
            'null': REQUIRED,
            'invalid': "Narx raqam bo'lishi kerak.",
            'min_value': "Narx manfiy bo'lmasligi kerak.",
            'max_digits': "Narx juda katta.",
            'max_whole_digits': "Narx juda katta.",
            'max_decimal_places': "Narxda ko'pi bilan 2 ta kasr xona bo'lishi mumkin.",
        },
    )

    class Meta:
        model = Gift
        fields = [
            'id',
            'name',
            'description',
            'price',
            'image_url',
            'image',
            'category',
            'category_name',
            'min_age',
            'max_age',
            'recipient',
            'recipient_label',
            'created_at',
        ]
        read_only_fields = ['created_at']
        extra_kwargs = {
            'name': {'error_messages': {
                'required': REQUIRED,
                'blank': "Sovg'a nomini kiriting.",
                'max_length': "Nom 200 belgidan oshmasligi kerak.",
            }},
            'image_url': {'error_messages': {
                'invalid': "To'g'ri URL kiriting (https://...).",
                'max_length': "URL juda uzun.",
            }},
            'image': {'error_messages': {
                'invalid_image': "Yuklangan fayl rasm emas yoki buzilgan.",
                'invalid': "Rasm faylini yuklang.",
            }},
            'category': {'error_messages': {
                'required': "Kategoriyani tanlang.",
                'null': "Kategoriyani tanlang.",
                'does_not_exist': "Bunday kategoriya mavjud emas.",
                'incorrect_type': "Kategoriyani tanlang.",
            }},
            'recipient': {'error_messages': {
                'required': "Kimga ekanini tanlang.",
                'blank': "Kimga ekanini tanlang.",
                'invalid_choice': "Noto'g'ri tanlov.",
            }},
            'min_age': {'error_messages': AGE_ERRORS},
            'max_age': {'error_messages': AGE_ERRORS},
        }

    def validate(self, data):
        # Qisman tahrirlashda (PATCH) yuborilmagan qiymat bazadagisidan olinadi
        min_age = data.get('min_age', getattr(self.instance, 'min_age', 0))
        max_age = data.get('max_age', getattr(self.instance, 'max_age', 100))

        if min_age > max_age:
            raise serializers.ValidationError({
                'max_age': "Maksimal yosh minimal yoshdan kichik bo'lmasligi kerak."
            })

        return data


# GIFT FILTER (query parametrlar)

class GiftFilterSerializer(serializers.Serializer):

    category = serializers.IntegerField(required=False, min_value=1)
    min_price = serializers.DecimalField(
        required=False, max_digits=12, decimal_places=2, min_value=0
    )
    max_price = serializers.DecimalField(
        required=False, max_digits=12, decimal_places=2, min_value=0
    )

    # Gift Finder
    recipient = serializers.ChoiceField(required=False, choices=Recipient.choices)
    age = serializers.IntegerField(required=False, min_value=0, max_value=120)
    budget = serializers.DecimalField(
        required=False, max_digits=12, decimal_places=2, min_value=0
    )

    def validate(self, data):
        min_price = data.get('min_price')
        max_price = data.get('max_price')

        if min_price is not None and max_price is not None and min_price > max_price:
            raise serializers.ValidationError({
                'max_price': "Maksimal narx minimal narxdan kichik bo'lmasligi kerak."
            })

        return data


# FAVORITE SERIALIZER

class FavoriteSerializer(serializers.ModelSerializer):

    gift = GiftSerializer(read_only=True)
    gift_id = serializers.PrimaryKeyRelatedField(
        source='gift',
        queryset=Gift.objects.all(),
        write_only=True,
        error_messages={
            'required': REQUIRED,
            'does_not_exist': "Bunday sovg'a mavjud emas.",
            'incorrect_type': "Noto'g'ri sovg'a ID.",
        },
    )

    class Meta:
        model = Favorite
        fields = ['id', 'gift', 'gift_id', 'created_at']


# ORDER SERIALIZER

PHONE_RE = re.compile(r'^\+?[\d\s\-()]+$')


class OrderSerializer(serializers.ModelSerializer):

    gift = GiftSerializer(read_only=True)
    gift_id = serializers.PrimaryKeyRelatedField(
        source='gift',
        queryset=Gift.objects.all(),
        write_only=True,
        error_messages={
            'required': REQUIRED,
            'does_not_exist': "Bunday sovg'a mavjud emas.",
            'incorrect_type': "Noto'g'ri sovg'a ID.",
        },
    )
    unit_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, coerce_to_string=False
    )
    total_price = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True, coerce_to_string=False
    )
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'gift',
            'gift_id',
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
        read_only_fields = ['status', 'created_at']
        extra_kwargs = {
            'customer_name': {'min_length': 2, 'error_messages': {
                'required': "Ismingizni kiriting.",
                'blank': "Ismingizni kiriting.",
                'min_length': "Ism kamida 2 ta harfdan iborat bo'lsin.",
                'max_length': "Ism 100 belgidan oshmasligi kerak.",
            }},
            'phone': {'error_messages': {
                'required': "Telefon raqamini kiriting.",
                'blank': "Telefon raqamini kiriting.",
                'max_length': "Telefon raqami juda uzun.",
            }},
            'address': {'min_length': 5, 'error_messages': {
                'required': "Yetkazib berish manzilini kiriting.",
                'blank': "Yetkazib berish manzilini kiriting.",
                'min_length': "Manzilni to'liqroq yozing.",
                'max_length': "Manzil 255 belgidan oshmasligi kerak.",
            }},
            'quantity': {'error_messages': {
                'invalid': "Miqdor butun son bo'lishi kerak.",
                'min_value': "Miqdor kamida 1 ta bo'lishi kerak.",
                'max_value': "Bir buyurtmada ko'pi bilan 20 ta.",
            }},
            'note': {'max_length': 500, 'error_messages': {
                'max_length': "Izoh 500 belgidan oshmasligi kerak.",
            }},
        }

    def validate_phone(self, value):
        digits = re.sub(r'\D', '', value)

        if not PHONE_RE.match(value) or not 9 <= len(digits) <= 15:
            raise serializers.ValidationError(
                "Telefon raqamini to'g'ri kiriting, masalan: +998 90 123 45 67."
            )

        return value
