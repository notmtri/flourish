import logging

from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response

from .models import Order, Product, Review
from .serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    ProductSerializer,
    ReviewSerializer,
)
from .services import (
    VietQrError,
    generate_preview_order_number,
    generate_vietqr,
    record_order_audit,
    send_order_notifications,
    sync_admin_user_from_env,
)
from .throttles import AdminLoginThrottle, OrderCreateThrottle

logger = logging.getLogger(__name__)


def is_admin(request):
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


def admin_required_response():
    return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)


def archive_order(order: Order, *, actor=None):
    if not order.is_archived:
        order.is_archived = True
        order.archived_at = timezone.now()
        order.save(update_fields=["is_archived", "archived_at", "updated_at"])
        record_order_audit(order, actor=actor, action="archived")


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["POST"])
@throttle_classes([AdminLoginThrottle])
def admin_login(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "")
    synced_user = sync_admin_user_from_env(login_identifier=username)
    auth_username = synced_user[0].username if synced_user else username

    user = authenticate(username=auth_username, password=password)
    if not user:
        return Response({"error": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)

    if not user.is_staff:
        return Response({"error": "This account does not have admin access."}, status=status.HTTP_403_FORBIDDEN)

    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return Response(
        {
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "isStaff": user.is_staff,
            },
        }
    )


@api_view(["POST"])
def admin_logout(request):
    if not request.user or not request.user.is_authenticated:
        return admin_required_response()

    Token.objects.filter(user=request.user).delete()
    return Response({"success": True})


@api_view(["GET"])
def admin_me(request):
    if not request.user or not request.user.is_authenticated:
        return admin_required_response()

    return Response(
        {
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "isStaff": request.user.is_staff,
            }
        }
    )


@api_view(["POST"])
def admin_test_email(request):
    if not is_admin(request):
        return admin_required_response()

    preview_order = Order(
        order_number="FLR-TEST-EMAIL",
        customer_name="Flourish Admin",
        address="Notification health check",
        phone="+84932015209",
        payment_method=Order.PaymentMethod.COD,
        payment_status=Order.PaymentStatus.PENDING,
        total_amount=0,
    )

    try:
        send_order_notifications(preview_order)
    except Exception:
        logger.exception("Failed to send test admin notification.")
        return Response({"error": "Failed to send test notification."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({"success": True})


@api_view(["POST"])
def vietqr_preview(request):
    customer_name = request.data.get("customerName", "").strip()
    amount = request.data.get("amount")
    order_number = request.data.get("orderNumber") or generate_preview_order_number()

    if not customer_name or not amount:
        return Response(
            {"error": "customerName and amount are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        qr_data = generate_vietqr(
            amount=int(amount),
            customer_name=customer_name,
            order_number=order_number,
        )
    except VietQrError as exc:
        payload = {"error": str(exc), **exc.payload}
        return Response(payload, status=exc.status_code)

    return Response(qr_data)


@api_view(["GET", "POST"])
def products_collection(request):
    if request.method == "GET":
        query = request.query_params.get("q", "").strip()
        products = Product.objects.filter(is_active=True)
        if query:
            products = products.filter(name__icontains=query)
        return Response({"products": ProductSerializer(products, many=True).data})

    if not is_admin(request):
        return admin_required_response()

    serializer = ProductSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"product": serializer.data}, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def product_detail(request, pk):
    product = get_object_or_404(Product, pk=pk)

    if request.method == "GET":
        return Response({"product": ProductSerializer(product).data})

    if not is_admin(request):
        return admin_required_response()

    if request.method == "PUT":
        serializer = ProductSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"product": serializer.data})

    product.is_active = False
    product.save(update_fields=["is_active", "updated_at"])
    return Response({"success": True}, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
def reviews_collection(request):
    if request.method == "GET":
        reviews = Review.objects.filter(is_visible=True)
        return Response({"reviews": ReviewSerializer(reviews, many=True).data})

    serializer = ReviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"review": serializer.data}, status=status.HTTP_201_CREATED)


@api_view(["PUT", "DELETE"])
def review_detail(request, pk):
    if not is_admin(request):
        return admin_required_response()

    review = get_object_or_404(Review, pk=pk)
    if request.method == "DELETE":
        review.delete()
        return Response({"success": True}, status=status.HTTP_200_OK)

    serializer = ReviewSerializer(review, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"review": serializer.data})


@api_view(["GET", "POST"])
@throttle_classes([OrderCreateThrottle])
def orders_collection(request):
    if request.method == "GET":
        if not is_admin(request):
            return admin_required_response()

        orders = Order.objects.prefetch_related("items").filter(is_archived=False)
        query = request.query_params.get("q", "").strip()
        status_filter = request.query_params.get("status", "").strip()
        payment_filter = request.query_params.get("paymentStatus", "").strip()
        if query:
            orders = orders.filter(customer_name__icontains=query) | orders.filter(order_number__icontains=query) | orders.filter(phone__icontains=query)
        if status_filter:
            orders = orders.filter(status=status_filter)
        if payment_filter:
            orders = orders.filter(payment_status=payment_filter)
        return Response({"orders": OrderSerializer(orders.distinct(), many=True).data})

    serializer = OrderCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    order = serializer.save()
    record_order_audit(order, action="created", details={"payment_method": order.payment_method})

    def notify_admin():
        try:
            send_order_notifications(order)
        except Exception:
            logger.exception("Failed to send order notifications for order %s", order.order_number)

    from django.db import transaction

    transaction.on_commit(notify_admin)
    return Response({"order": OrderSerializer(order).data}, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def order_detail(request, pk):
    if not is_admin(request):
        return admin_required_response()

    order = get_object_or_404(Order.objects.prefetch_related("items"), pk=pk)

    if request.method == "GET":
        return Response({"order": OrderSerializer(order).data})

    if request.method == "DELETE":
        archive_order(order, actor=request.user)
        return Response({"success": True}, status=status.HTTP_200_OK)

    previous = {
        "status": order.status,
        "payment_status": order.payment_status,
        "admin_notes": order.admin_notes,
    }
    serializer = OrderSerializer(order, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    updated_order = serializer.save()

    fields_to_update = []
    if previous["payment_status"] != updated_order.payment_status and updated_order.payment_status == Order.PaymentStatus.VERIFIED:
        updated_order.verified_at = timezone.now()
        fields_to_update.append("verified_at")
    if previous["status"] != updated_order.status:
        if updated_order.status == Order.Status.PROCESSING and not updated_order.processing_started_at:
            updated_order.processing_started_at = timezone.now()
            fields_to_update.append("processing_started_at")
        if updated_order.status == Order.Status.SHIPPED and not updated_order.shipped_at:
            updated_order.shipped_at = timezone.now()
            fields_to_update.append("shipped_at")
        if updated_order.status == Order.Status.DELIVERED and not updated_order.delivered_at:
            updated_order.delivered_at = timezone.now()
            fields_to_update.append("delivered_at")
    if fields_to_update:
        fields_to_update.append("updated_at")
        updated_order.save(update_fields=fields_to_update)

    record_order_audit(
        updated_order,
        actor=request.user,
        action="updated",
        details={
            "from": previous,
            "to": {
                "status": updated_order.status,
                "payment_status": updated_order.payment_status,
                "admin_notes": updated_order.admin_notes,
            },
        },
    )
    return Response({"order": OrderSerializer(updated_order).data})


@api_view(["POST"])
def order_delete(request, pk):
    if not is_admin(request):
        return admin_required_response()

    order = get_object_or_404(Order, pk=pk)
    archive_order(order, actor=request.user)
    return Response({"success": True}, status=status.HTTP_200_OK)


@api_view(["POST"])
def order_payment(request, pk):
    order = get_object_or_404(Order, pk=pk)
    order.payment_screenshot = request.data.get("screenshot", "")
    order.payment_status = Order.PaymentStatus.AWAITING_VERIFICATION
    order.save(update_fields=["payment_screenshot", "payment_status", "updated_at"])
    record_order_audit(order, action="payment_screenshot_uploaded")
    return Response({"order": OrderSerializer(order).data})
