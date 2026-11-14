from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


# =========================
# CATEGORY MODEL
# =========================

class Category(models.Model):

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Kategoriya nomi"
    )

    class Meta:
        ordering = ['name']
        verbose_name = "Kategoriya"
        verbose_name_plural = "Kategoriyalar"

    def __str__(self):
        return self.name


# =========================
# GIFT MODEL
# =========================

class Recipient(models.TextChoices):
    ONA = 'ona', "Ona"
    OTA = 'ota', "Ota"
    DOST = 'dost', "Do'st"
    BOLA = 'bola', "Bola"
    SEVGILIM = 'sevgilim', "Sevgilim"


class Gift(models.Model):

    name = models.CharField(
        max_length=200,
        verbose_name="Sovg'a nomi"
    )

    description = models.TextField(
        blank=True,
        verbose_name="Tavsif"
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Narx (so'm)"
    )

    # Rasm: yo URL, yo yuklangan fayl
    image_url = models.URLField(
        max_length=500,
        blank=True,
        verbose_name="Rasm URL"
    )

    image = models.ImageField(
        upload_to='gifts/',
        blank=True,
        null=True,
        verbose_name="Rasm fayli"
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='gifts',
        verbose_name="Kategoriya"
    )

    min_age = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(120)],
        verbose_name="Minimal yosh"
    )

    max_age = models.PositiveSmallIntegerField(
        default=100,
        validators=[MaxValueValidator(120)],
        verbose_name="Maksimal yosh"
    )

    recipient = models.CharField(
        max_length=20,
        choices=Recipient.choices,
        verbose_name="Kimga"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        verbose_name = "Sovg'a"
        verbose_name_plural = "Sovg'alar"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(min_age__lte=models.F('max_age')),
                name='gift_min_age_lte_max_age',
            ),
        ]

    def __str__(self):
        return self.name


# =========================
# FAVORITE MODEL
# =========================

class Favorite(models.Model):

    gift = models.ForeignKey(
        Gift,
        on_delete=models.CASCADE,
        related_name='favorites',
        verbose_name="Sovg'a"
    )

    # Login o'rniga: brauzer localStorage'da saqlanadigan anonim ID
    session_key = models.CharField(
        max_length=64,
        db_index=True,
        verbose_name="Sessiya kaliti"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        verbose_name = "Sevimli"
        verbose_name_plural = "Sevimlilar"
        constraints = [
            models.UniqueConstraint(
                fields=['gift', 'session_key'],
                name='unique_favorite_per_session',
            ),
        ]

    def __str__(self):
        return f"{self.gift.name} ({self.session_key[:8]})"


# =========================
# ORDER MODEL
# =========================

class OrderStatus(models.TextChoices):
    NEW = 'new', "Yangi"
    CONFIRMED = 'confirmed', "Tasdiqlangan"
    DELIVERED = 'delivered', "Yetkazildi"
    CANCELLED = 'cancelled', "Bekor qilingan"


class Order(models.Model):

    gift = models.ForeignKey(
        Gift,
        on_delete=models.PROTECT,
        related_name='orders',
        verbose_name="Sovg'a"
    )

    # Sevimlilar kabi: brauzerdagi anonim kalit
    session_key = models.CharField(
        max_length=64,
        db_index=True,
        verbose_name="Sessiya kaliti"
    )

    customer_name = models.CharField(
        max_length=100,
        verbose_name="Ism"
    )

    phone = models.CharField(
        max_length=20,
        verbose_name="Telefon"
    )

    address = models.CharField(
        max_length=255,
        verbose_name="Manzil"
    )

    quantity = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(20)],
        verbose_name="Miqdor"
    )

    note = models.TextField(
        blank=True,
        verbose_name="Izoh"
    )

    # Buyurtma paytidagi narx: keyin sovg'a narxi o'zgarsa ham saqlanib qoladi
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Narx (so'm)"
    )

    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.NEW,
        verbose_name="Holat"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Sana")

    class Meta:
        ordering = ['-created_at', '-id']
        verbose_name = "Buyurtma"
        verbose_name_plural = "Buyurtmalar"

    @property
    def total_price(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"#{self.pk} — {self.gift.name} × {self.quantity}"
