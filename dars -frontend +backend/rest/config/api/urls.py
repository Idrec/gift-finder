from django.urls import path

from .views import (
    CategoryListAPIView,
    RecipientListAPIView,
    GiftListCreateAPIView,
    FavoriteListCreateAPIView,
    FavoriteDestroyAPIView,
    OrderListCreateAPIView,
)


urlpatterns = [

    path('categories/', CategoryListAPIView.as_view(), name='category-list'),

    path('recipients/', RecipientListAPIView.as_view(), name='recipient-list'),

    path('gifts/', GiftListCreateAPIView.as_view(), name='gift-list'),

    path('favorites/', FavoriteListCreateAPIView.as_view(), name='favorite-list'),

    path(
        'favorites/<int:gift_id>/',
        FavoriteDestroyAPIView.as_view(),
        name='favorite-delete'
    ),

    path('orders/', OrderListCreateAPIView.as_view(), name='order-list'),

]
