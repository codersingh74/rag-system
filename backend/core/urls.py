from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/rag/', include('apps.rag.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
