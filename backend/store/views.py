import logging

from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
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
    sync_admin_user_from_env,
    generate_vietqr,
    send_order_notifications,
)

logger = logging.getLogger(__name__)


def is_admin(request):
    return bool(request.user and request.user.is_authenticated and request.user.is_staff)


def admin_required_response():
    return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["POST"])
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
        products = Product.objects.filter(is_active=True)
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

    product.delete()
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


@api_view(["DELETE"])
def review_detail(request, pk):
    if not is_admin(request):
        return admin_required_response()

    review = get_object_or_404(Review, pk=pk)
    review.delete()
    return Response({"success": True}, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
def orders_collection(request):
    if request.method == "GET":
        if not is_admin(request):
            return admin_required_response()
        orders = Order.objects.prefetch_related("items").all()
        return Response({"orders": OrderSerializer(orders, many=True).data})

    serializer = OrderCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    order = serializer.save()

    def notify_admin():
        try:
            send_order_notifications(order)
        except Exception:
            logger.exception("Failed to send order notifications for order %s", order.order_number)

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
        order.delete()
        return Response({"success": True}, status=status.HTTP_200_OK)

    serializer = OrderSerializer(order, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"order": serializer.data})


@api_view(["POST"])
def order_delete(request, pk):
    if not is_admin(request):
        return admin_required_response()

    order = get_object_or_404(Order, pk=pk)
    order.delete()
    return Response({"success": True}, status=status.HTTP_200_OK)


@api_view(["POST"])
def order_payment(request, pk):
    order = get_object_or_404(Order, pk=pk)
    order.payment_screenshot = request.data.get("screenshot", "")
    order.payment_status = Order.PaymentStatus.AWAITING_VERIFICATION
    order.save(update_fields=["payment_screenshot", "payment_status", "updated_at"])
    return Response({"order": OrderSerializer(order).data})
