from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Order
from .services import VietQrProviderError, build_order_reference


class VietQrServiceTests(TestCase):
    def test_build_order_reference_normalizes_and_limits_length(self):
        reference = build_order_reference("Nguyen Hoang Minh Tri", "FLR-20260419-001")

        self.assertLessEqual(len(reference), 25)
        self.assertTrue(reference.endswith("001"))


class VietQrPreviewApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("store.views.generate_vietqr")
    def test_preview_returns_fallback_payload_when_provider_is_unavailable(self, mock_generate_vietqr):
        mock_generate_vietqr.side_effect = VietQrProviderError(
            "VietQR is temporarily unavailable.",
            payload={
                "orderNumber": "FLR-TEST-001",
                "transferContent": "NGUYEN FLR-TEST-001",
                "amount": 120000,
                "qrCode": "",
                "qrDataURL": "",
                "bankInfo": {
                    "accountNo": "1041802514",
                    "accountName": "NGUYEN HOANG MINH TRI",
                    "acqId": "686868",
                    "template": "compact2",
                    "format": "text",
                },
            },
        )

        response = self.client.post(
            "/api/payments/vietqr/preview/",
            {"customerName": "Nguyen", "amount": 120000},
            format="json",
        )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["orderNumber"], "FLR-TEST-001")
        self.assertEqual(response.data["bankInfo"]["accountNo"], "1041802514")


class OrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_creating_qr_order_sets_awaiting_verification(self):
        response = self.client.post(
            "/api/orders/",
            {
                "customerName": "Nguyen Hoang Minh Tri",
                "address": "123 Test Street",
                "phone": "0900000000",
                "paymentMethod": "QR",
                "orderNumber": "FLR-TEST-002",
                "items": [
                    {
                        "product": {
                            "name": "Test Bouquet",
                            "price": 150000,
                        },
                        "quantity": 2,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        order = Order.objects.get(order_number="FLR-TEST-002")
        self.assertEqual(order.payment_status, Order.PaymentStatus.AWAITING_VERIFICATION)
        self.assertEqual(int(order.total_amount), 300000)
