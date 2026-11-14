from django.urls import path

from .admin_views import (
    AdminCategoryDetailAPIView,
    AdminCategoryListCreateAPIView,
    AdminGiftDetailAPIView,
    AdminGiftListCreateAPIView,
    AdminLoginAPIView,
    AdminLogoutAPIView,
    AdminMeAPIView,
    AdminOrderDetailAPIView,
    AdminOrderListAPIView,
    AdminStatsAPIView,
)


urlpatterns = [

    # AUTH
    path('login/', AdminLoginAPIView.as_view(), name='admin-login'),
    path('logout/', AdminLogoutAPIView.as_view(), name='admin-logout'),
    path('me/', AdminMeAPIView.as_view(), name='admin-me'),

    # DASHBOARD
    path('stats/', AdminStatsAPIView.as_view(), name='admin-stats'),

    # ORDERS
    path('orders/', AdminOrderListAPIView.as_view(), name='admin-order-list'),
    path('orders/<int:pk>/', AdminOrderDetailAPIView.as_view(), name='admin-order-detail'),

    # GIFTS
    path('gifts/', AdminGiftListCreateAPIView.as_view(), name='admin-gift-list'),
    path('gifts/<int:pk>/', AdminGiftDetailAPIView.as_view(), name='admin-gift-detail'),

    # CATEGORIES
    path('categories/', AdminCategoryListCreateAPIView.as_view(), name='admin-category-list'),
    path('categories/<int:pk>/', AdminCategoryDetailAPIView.as_view(), name='admin-category-detail'),

]
