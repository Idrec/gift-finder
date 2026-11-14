from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [

    # ADMIN
    path('admin/', admin.site.urls),

    # REACT ADMIN PANEL API
    path('api/admin/', include('api.admin_urls')),

    # GIFT FINDER API
    path('api/', include('api.urls')),

]

# DEBUG rejimida yuklangan rasmlarni ko'rsatish
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
