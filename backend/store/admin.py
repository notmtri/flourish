from django.contrib import admin

from .models import Order, OrderAuditLog, OrderItem, Product, Review


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class OrderAuditLogInline(admin.TabularInline):
    model = OrderAuditLog
    extra = 0
    readonly_fields = ("actor", "action", "details", "created_at")
    can_delete = False


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
        "is_archived",
        "created_at",
    )
    list_filter = ("payment_method", "status", "payment_status", "is_archived")
    search_fields = ("order_number", "customer_name", "phone")
    readonly_fields = (
        "verified_at",
        "processing_started_at",
        "shipped_at",
        "delivered_at",
        "archived_at",
    )
    inlines = [OrderItemInline, OrderAuditLogInline]
