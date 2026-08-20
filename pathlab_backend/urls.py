"""
URL configuration for pathlab_backend project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('api.urls')), 
    path("superadmin/", include("superadmin.urls")),
]