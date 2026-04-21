from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem, Product, Review
from .services import (
    is_reasonable_payment_screenshot,
    is_valid_vietnam_phone,
    normalize_phone_number,
)


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=12, decimal_places=0, coerce_to_string=False)
    isBestSeller = serializers.BooleanField(source="is_best_seller", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "category",
            "isBestSeller",
            "images",
            "createdAt",
            "updatedAt",
        ]

    def validate_images(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Images must be a list of URLs.")
        if len(value) > 6:
            raise serializers.ValidationError("Please keep product images to 6 or fewer.")
        for url in value:
            serializers.URLField().run_validation(url)
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    customerName = serializers.CharField(source="customer_name")
    productName = serializers.CharField(source="product_name", required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "customerName",
            "productName",
            "rating",
            "feedback",
            "avatar",
            "createdAt",
            "updatedAt",
        ]


class ReviewCreateSerializer(ReviewSerializer):
    class Meta(ReviewSerializer.Meta):
        read_only_fields = ["createdAt", "updatedAt"]

    def validate_feedback(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Feedback is too short.")
        if len(value) > 600:
            raise serializers.ValidationError("Feedback is too long.")
        return value

    def validate_avatar(self, value):
        if value:
            serializers.URLField().run_validation(value)
        return value


class ProductRefWriteSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    name = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(
        max_digits=12,
        decimal_places=0,
        required=False,
        coerce_to_string=False,
    )


class OrderItemWriteSerializer(serializers.Serializer):
    product = ProductRefWriteSerializer()
    quantity = serializers.IntegerField(min_value=1)


class OrderItemProductSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()
    name = serializers.CharField(source="product_name")
    price = serializers.DecimalField(source="unit_price", max_digits=12, decimal_places=0, coerce_to_string=False)

    def get_id(self, obj):
        return str(obj.product_id) if obj.product_id else ""


class OrderItemSerializer(serializers.ModelSerializer):
    product = OrderItemProductSerializer(source="*", read_only=True)

    class Meta:
        model = OrderItem
        fields = ["product", "quantity"]


class OrderSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    orderNumber = serializers.CharField(source="order_number", read_only=True)
    customerName = serializers.CharField(source="customer_name")
    paymentMethod = serializers.CharField(source="payment_method")
    totalAmount = serializers.DecimalField(
        source="total_amount",
        max_digits=12,
        decimal_places=0,
        coerce_to_string=False,
        read_only=True,
    )
    paymentStatus = serializers.CharField(source="payment_status")
    paymentScreenshot = serializers.CharField(source="payment_screenshot", allow_blank=True, required=False)
    adminNotes = serializers.CharField(source="admin_notes", allow_blank=True, required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    verifiedAt = serializers.DateTimeField(source="verified_at", read_only=True)
    processingStartedAt = serializers.DateTimeField(source="processing_started_at", read_only=True)
    shippedAt = serializers.DateTimeField(source="shipped_at", read_only=True)
    deliveredAt = serializers.DateTimeField(source="delivered_at", read_only=True)
    archivedAt = serializers.DateTimeField(source="archived_at", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "orderNumber",
            "customerName",
            "address",
            "phone",
            "paymentMethod",
            "status",
            "paymentStatus",
            "paymentScreenshot",
            "adminNotes",
            "totalAmount",
            "items",
            "createdAt",
            "updatedAt",
            "verifiedAt",
            "processingStartedAt",
            "shippedAt",
            "deliveredAt",
            "archivedAt",
        ]
        read_only_fields = ["orderNumber", "totalAmount", "items", "createdAt", "updatedAt"]


class OrderListSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    orderNumber = serializers.CharField(source="order_number", read_only=True)
    customerName = serializers.CharField(source="customer_name")
    paymentMethod = serializers.CharField(source="payment_method")
    totalAmount = serializers.DecimalField(
        source="total_amount",
        max_digits=12,
        decimal_places=0,
        coerce_to_string=False,
        read_only=True,
    )
    paymentStatus = serializers.CharField(source="payment_status")
    adminNotes = serializers.CharField(source="admin_notes", allow_blank=True, required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    hasPaymentScreenshot = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "orderNumber",
            "customerName",
            "address",
            "phone",
            "paymentMethod",
            "status",
            "paymentStatus",
            "adminNotes",
            "totalAmount",
            "items",
            "createdAt",
            "updatedAt",
            "hasPaymentScreenshot",
        ]

    def get_hasPaymentScreenshot(self, obj):
        return bool(obj.payment_screenshot)


class OrderCreateSerializer(serializers.ModelSerializer):
    orderNumber = serializers.CharField(source="order_number", required=False, allow_blank=True)
    customerName = serializers.CharField(source="customer_name")
    paymentMethod = serializers.CharField(source="payment_method")
    paymentStatus = serializers.CharField(
        source="payment_status",
        required=False,
        allow_blank=True,
    )
    paymentScreenshot = serializers.CharField(
        source="payment_screenshot",
        required=False,
        allow_blank=True,
    )
    items = OrderItemWriteSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "orderNumber",
            "customerName",
            "address",
            "phone",
            "paymentMethod",
            "paymentStatus",
            "paymentScreenshot",
            "items",
        ]

    def validate_phone(self, value):
        if not is_valid_vietnam_phone(value):
            raise serializers.ValidationError("Please enter a valid Vietnam phone number.")
        return normalize_phone_number(value)

    def validate_address(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError("Address is too short.")
        return value

    def validate_payment_screenshot(self, value):
        if value and not is_reasonable_payment_screenshot(value):
            raise serializers.ValidationError("Payment screenshot must be an image under 5 MB.")
        return value

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one order item is required.")
        if len(value) > 20:
            raise serializers.ValidationError("Orders are limited to 20 line items.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        payment_method = attrs.get("payment_method")
        payment_screenshot = attrs.get("payment_screenshot", "")
        if payment_method == Order.PaymentMethod.QR and not payment_screenshot:
            raise serializers.ValidationError(
                {"paymentScreenshot": "Payment screenshot is required for QR orders."}
            )
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        payment_method = validated_data.get("payment_method")

        if payment_method == Order.PaymentMethod.QR and not validated_data.get("payment_status"):
            validated_data["payment_status"] = Order.PaymentStatus.AWAITING_VERIFICATION

        order = Order.objects.create(**validated_data)
        total_amount = Decimal("0")

        for item in items_data:
            product_payload = item.get("product", {})
            product = None
            product_id = product_payload.get("id")
            product_name = product_payload.get("name", "")
            unit_price = product_payload.get("price", Decimal("0"))

            if product_id:
                product = Product.objects.get(pk=product_id)
                product_name = product.name
                unit_price = product.price

            quantity = item["quantity"]
            line_total = Decimal(unit_price) * quantity
            total_amount += line_total

            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product_name,
                unit_price=unit_price,
                quantity=quantity,
            )

        order.total_amount = total_amount
        order.save(update_fields=["total_amount", "updated_at"])
        return order
