from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Product(TimestampedModel):
    class Category(models.TextChoices):
        BOUQUET = "Bouquet", "Bouquet"
        SINGLE_STEM = "Single Stem", "Single Stem"
        GIFT_SET = "Gift Set", "Gift Set"
        CUSTOM = "Custom", "Custom"

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=0)
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.BOUQUET,
        db_index=True,
    )
    is_best_seller = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    images = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-is_best_seller", "-created_at"]

    def __str__(self):
        return self.name


class Review(TimestampedModel):
    product = models.ForeignKey(
        Product,
        related_name="reviews",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    customer_name = models.CharField(max_length=255)
    product_name = models.CharField(max_length=255, blank=True)
    rating = models.PositiveSmallIntegerField(default=5)
    feedback = models.TextField()
    avatar = models.URLField(blank=True)
    is_visible = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.customer_name} ({self.rating}/5)"

    def save(self, *args, **kwargs):
        if self.product and not self.product_name:
            self.product_name = self.product.name
        super().save(*args, **kwargs)


class Order(TimestampedModel):
    class PaymentMethod(models.TextChoices):
        COD = "COD", "Cash on Delivery"
        QR = "QR", "VietQR"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        AWAITING_VERIFICATION = "awaiting_verification", "Awaiting verification"
        VERIFIED = "verified", "Verified"
        FAILED = "failed", "Failed"

    order_number = models.CharField(max_length=32, unique=True, blank=True)
    customer_name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=32, db_index=True)
    payment_method = models.CharField(
        max_length=10,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    payment_status = models.CharField(
        max_length=30,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True,
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=0, default=Decimal("0"))
    payment_screenshot = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    processing_started_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status", "payment_status"]),
            models.Index(fields=["is_archived", "-created_at"]),
            models.Index(fields=["customer_name"]),
            models.Index(fields=["order_number", "phone"]),
        ]

    def __str__(self):
        return self.order_number or f"Order {self.pk}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            timestamp = timezone.localtime().strftime("%Y%m%d")
            latest_id = (Order.objects.order_by("-id").values_list("id", flat=True).first() or 0) + 1
            self.order_number = f"FLR-{timestamp}-{latest_id:03d}"

        if self.payment_method == self.PaymentMethod.QR and not self.payment_status:
            self.payment_status = self.PaymentStatus.AWAITING_VERIFICATION

        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(
        Product,
        related_name="order_items",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    product_name = models.CharField(max_length=255)
    unit_price = models.DecimalField(max_digits=12, decimal_places=0)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"


class OrderAuditLog(TimestampedModel):
    order = models.ForeignKey(Order, related_name="audit_logs", on_delete=models.CASCADE)
    actor = models.ForeignKey(
        get_user_model(),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="order_audit_logs",
    )
    action = models.CharField(max_length=64)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order} - {self.action}"
