"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from store import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', views.health),
    path('api/auth/login/', views.admin_login),
    path('api/auth/logout/', views.admin_logout),
    path('api/auth/me/', views.admin_me),
    path('api/payments/vietqr/preview/', views.vietqr_preview),
    path('api/products/', views.products_collection),
    path('api/products/<int:pk>/', views.product_detail),
    path('api/reviews/', views.reviews_collection),
    path('api/reviews/<int:pk>/', views.review_detail),
    path('api/orders/', views.orders_collection),
    path('api/orders/<int:pk>/', views.order_detail),
    path('api/orders/<int:pk>/payment/', views.order_payment),
]
