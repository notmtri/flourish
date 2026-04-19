from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Order
from .services import (
    VietQrConfigError,
    VietQrProviderError,
    build_order_reference,
    build_vietqr_quick_link,
    generate_vietqr,
    is_valid_vietqr_acq_id,
)


class VietQrServiceTests(TestCase):
    def test_build_order_reference_normalizes_and_limits_length(self):
        reference = build_order_reference("Nguyen Hoang Minh Tri", "FLR-20260419-001")

        self.assertLessEqual(len(reference), 25)
        self.assertTrue(reference.endswith("001"))

    def test_build_vietqr_quick_link_matches_documented_format(self):
        quick_link = build_vietqr_quick_link(
            acq_id="970415",
            account_no="113366668888",
            template="compact2",
            amount=79000,
            transfer_content="Ung Ho Quy Vac Xin",
            account_name="QUY VAC XIN PHONG CHONG COVID",
        )

        self.assertIn("https://img.vietqr.io/image/970415-113366668888-compact2.png", quick_link)
        self.assertIn("amount=79000", quick_link)
        self.assertIn("addInfo=Ung%20Ho%20Quy%20Vac%20Xin", quick_link)

    def test_invalid_acq_id_rejects_obvious_placeholders(self):
        self.assertFalse(is_valid_vietqr_acq_id("686868"))
        self.assertFalse(is_valid_vietqr_acq_id("abc123"))
        self.assertTrue(is_valid_vietqr_acq_id("970415"))

    @patch.dict(
        "os.environ",
        {
            "VIETQR_CLIENT_ID": "client",
            "VIETQR_API_KEY": "key",
            "VIETQR_ACCOUNT_NO": "1041802514",
            "VIETQR_ACCOUNT_NAME": "NGUYEN HOANG MINH TRI",
            "VIETQR_ACQ_ID": "not-a-bin",
        },
        clear=False,
    )
    def test_generate_vietqr_rejects_invalid_bank_bin(self):
        with self.assertRaises(VietQrConfigError):
            generate_vietqr(amount=1000, customer_name="Nguyen", order_number="FLR-TEST-003")


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
