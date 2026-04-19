from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem, Product, Review


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
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
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
            "totalAmount",
            "items",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["orderNumber", "totalAmount", "items", "createdAt", "updatedAt"]


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
