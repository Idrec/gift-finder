from django.contrib import admin

from .models import Category, Gift, Favorite, Order


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'category',
        'recipient',
        'price',
        'min_age',
        'max_age',
        'created_at',
    )
    search_fields = ('name', 'description')
    list_filter = ('category', 'recipient')


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'gift', 'session_key', 'created_at')
    list_filter = ('created_at',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'gift',
        'quantity',
        'total_price_display',
        'customer_name',
        'phone',
        'status',
        'created_at',
    )
    list_editable = ('status',)
    list_filter = ('status', 'created_at')
    search_fields = ('customer_name', 'phone', 'address', 'gift__name')
    list_select_related = ('gift',)
    readonly_fields = ('unit_price', 'session_key', 'created_at')

    @admin.display(description="Jami (so'm)")
    def total_price_display(self, obj):
        return f"{obj.total_price:,.0f}".replace(",", " ")
