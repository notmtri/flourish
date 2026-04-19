from decimal import Decimal

from django.db import models
from django.utils import timezone


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
    is_visible = models.BooleanField(default=True)

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
    phone = models.CharField(max_length=32)
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
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=0, default=Decimal("0"))
    payment_screenshot = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

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
