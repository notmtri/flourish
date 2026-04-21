import io
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Order
from .services import (
    VietQrConfigError,
    VietQrProviderError,
    build_order_reference,
    build_order_notification_sms,
    build_vietqr_quick_link,
    generate_vietqr,
    is_valid_vietqr_acq_id,
    send_order_notification_email,
    send_order_notifications,
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


class OrderNotificationServiceTests(TestCase):
    def setUp(self):
        self.order = Order.objects.create(
            order_number="FLR-NOTIFY-001",
            customer_name="Nguyen Hoang Minh Tri",
            address="123 Test Street",
            phone="0900000000",
            payment_method=Order.PaymentMethod.COD,
            status=Order.Status.PENDING,
            payment_status=Order.PaymentStatus.PENDING,
            total_amount=150000,
        )
        self.order.items.create(
            product_name="Test Bouquet",
            unit_price=150000,
            quantity=1,
        )

    @patch("store.services.send_mail")
    def test_email_notification_skips_when_smtp_credentials_are_missing(self, mock_send_mail):
        with self.settings(
            ORDER_NOTIFICATION_EMAIL="admin@example.com",
            EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
            EMAIL_SMTP_CONFIGURED=False,
        ):
            self.assertFalse(send_order_notification_email(self.order))

        mock_send_mail.assert_not_called()

    @patch("store.services.send_order_notification_email", return_value=True)
    @patch("store.services.send_order_notification_sms", return_value=True)
    def test_send_order_notifications_uses_configured_channels(self, mock_sms, mock_email):
        with self.settings(ORDER_NOTIFICATION_CHANNELS=["sms", "email"]):
            result = send_order_notifications(self.order)

        self.assertEqual(result, {"sms": True, "email": True})
        mock_sms.assert_called_once_with(self.order)
        mock_email.assert_called_once_with(self.order)

    def test_build_order_notification_sms_includes_order_summary(self):
        message = build_order_notification_sms(self.order)

        self.assertIn("FLR-NOTIFY-001", message)
        self.assertIn("150,000 VND", message)
        self.assertIn("Test Bouquet x1", message)


class AdminLoginApiTests(TestCase):
    def setUp(self):
        self.client = APIClient(HTTP_HOST="localhost")

    @patch.dict(
        "os.environ",
        {
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD": "StrongPass123!",
            "ADMIN_EMAIL": "admin@example.com",
        },
        clear=False,
    )
    def test_login_syncs_env_admin_and_returns_token(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "admin", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)

        User = get_user_model()
        user = User.objects.get(username="admin")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.email, "admin@example.com")

    @patch.dict(
        "os.environ",
        {
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD": "ResetPass456!",
            "ADMIN_EMAIL": "admin@example.com",
        },
        clear=False,
    )
    def test_login_accepts_configured_admin_email(self):
        User = get_user_model()
        User.objects.create_user(
            username="admin",
            password="outdated-password",
            is_staff=False,
            is_superuser=False,
            email="old@example.com",
        )

        response = self.client.post(
            "/api/auth/login/",
            {"username": "admin@example.com", "password": "ResetPass456!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)

        user = User.objects.get(username="admin")
        self.assertTrue(user.check_password("ResetPass456!"))
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.email, "admin@example.com")


class OrderAdminApiTests(TestCase):
    def setUp(self):
        self.client = APIClient(HTTP_HOST="localhost")
        User = get_user_model()
        self.admin = User.objects.create_user(
            username="admin",
            password="StrongPass123!",
            is_staff=True,
            is_superuser=True,
        )
        self.order = Order.objects.create(
            order_number="FLR-DELETE-001",
            customer_name="Delete Me",
            address="123 Test Street",
            phone="0900000000",
            payment_method=Order.PaymentMethod.COD,
            status=Order.Status.PENDING,
            payment_status=Order.PaymentStatus.PENDING,
            total_amount=100000,
        )

    def test_delete_order_requires_admin_auth(self):
        response = self.client.delete(f"/api/orders/{self.order.id}/")

        self.assertEqual(response.status_code, 401)
        self.assertTrue(Order.objects.filter(id=self.order.id).exists())

    def test_admin_can_delete_order(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(f"/api/orders/{self.order.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Order.objects.filter(id=self.order.id).exists())

    def test_admin_can_delete_order_via_post_fallback(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(f"/api/orders/{self.order.id}/delete/")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Order.objects.filter(id=self.order.id).exists())


class SyncAdminUserCommandTests(TestCase):
    @patch.dict(
        "os.environ",
        {
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD": "StrongPass123!",
            "ADMIN_EMAIL": "admin@example.com",
        },
        clear=False,
    )
    def test_sync_admin_user_creates_admin_account(self):
        output = io.StringIO()

        call_command("sync_admin_user", stdout=output)

        User = get_user_model()
        user = User.objects.get(username="admin")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.email, "admin@example.com")
        self.assertTrue(user.check_password("StrongPass123!"))
        self.assertIn("Created admin user 'admin'", output.getvalue())

    @patch.dict(
        "os.environ",
        {
            "ADMIN_USERNAME": "admin",
            "ADMIN_PASSWORD": "ResetPass456!",
            "ADMIN_EMAIL": "new-admin@example.com",
        },
        clear=False,
    )
    def test_sync_admin_user_updates_existing_account(self):
        User = get_user_model()
        user = User.objects.create_user(
            username="admin",
            password="old-password",
            is_staff=False,
            is_superuser=False,
        )

        output = io.StringIO()
        call_command("sync_admin_user", stdout=output)

        user.refresh_from_db()
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.email, "new-admin@example.com")
        self.assertTrue(user.check_password("ResetPass456!"))
        self.assertIn("Updated admin user 'admin'", output.getvalue())
