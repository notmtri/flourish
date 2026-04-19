from django.contrib import admin

from .models import Order, OrderItem, Product, Review


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "is_best_seller", "is_active", "created_at")
    list_filter = ("category", "is_best_seller", "is_active")
    search_fields = ("name", "description")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("customer_name", "product_name", "rating", "is_visible", "created_at")
    list_filter = ("rating", "is_visible")
    search_fields = ("customer_name", "product_name", "feedback")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer_name",
        "payment_method",
        "status",
        "payment_status",
        "total_amount",
        "created_at",
    )
    list_filter = ("payment_method", "status", "payment_status")
    search_fields = ("order_number", "customer_name", "phone")
    inlines = [OrderItemInline]
