import json
import logging
import os
import re
import unicodedata
from base64 import b64encode
from urllib.parse import quote
from datetime import datetime
from urllib import error, request

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


class VietQrError(Exception):
    status_code = 400

    def __init__(self, message: str, *, payload: dict | None = None):
        super().__init__(message)
        self.payload = payload or {}


class VietQrConfigError(VietQrError):
    status_code = 500


class VietQrProviderError(VietQrError):
    status_code = 503


class VietQrRequestError(VietQrError):
    status_code = 400


def sync_admin_user_from_env(*, login_identifier: str = ""):
    username = os.getenv("ADMIN_USERNAME", "").strip()
    password = os.getenv("ADMIN_PASSWORD", "").strip()
    email = os.getenv("ADMIN_EMAIL", "").strip()

    if not username or not password:
        return None

    normalized_identifier = login_identifier.strip().lower()
    allowed_identifiers = {username.lower()}
    if email:
        allowed_identifiers.add(email.lower())

    if normalized_identifier and normalized_identifier not in allowed_identifiers:
        return None

    User = get_user_model()
    user, created = User.objects.get_or_create(username=username)

    if email:
        user.email = email

    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.set_password(password)
    user.save()
    return user, created


def send_order_notification_email(order) -> bool:
    recipient = settings.ORDER_NOTIFICATION_EMAIL
    if not recipient:
        logger.warning("ORDER_NOTIFICATION_EMAIL / ADMIN_EMAIL is not configured; skipping order email.")
        return False

    if (
        settings.EMAIL_BACKEND == "django.core.mail.backends.smtp.EmailBackend"
        and not settings.EMAIL_SMTP_CONFIGURED
    ):
        logger.warning("SMTP email backend is enabled without EMAIL_HOST_USER / EMAIL_HOST_PASSWORD; skipping order email.")
        return False

    subject = f"New Flourish order: {order.order_number}"
    message = build_order_notification_message(order)

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[recipient],
        fail_silently=False,
    )
    return True


def build_order_notification_message(order) -> str:
    item_lines = [
        f"- {item.product_name} x {item.quantity} @ {int(item.unit_price):,} VND"
        for item in order.items.all()
    ]
    return "\n".join(
        [
            "A new order has been placed.",
            "",
            f"Order number: {order.order_number}",
            f"Customer: {order.customer_name}",
            f"Phone: {order.phone}",
            f"Address: {order.address}",
            f"Payment method: {order.payment_method}",
            f"Payment status: {order.payment_status}",
            f"Total amount: {int(order.total_amount):,} VND",
            "",
            "Items:",
            *item_lines,
        ]
    )


def build_order_notification_sms(order) -> str:
    item_summary = ", ".join(
        f"{item.product_name} x{item.quantity}"
        for item in order.items.all()[:3]
    )
    if order.items.count() > 3:
        item_summary = f"{item_summary}, +{order.items.count() - 3} more"

    return " | ".join(
        part
        for part in [
            f"New Flourish order {order.order_number}",
            f"{order.customer_name} - {order.phone}",
            f"{int(order.total_amount):,} VND",
            item_summary,
        ]
        if part
    )


def send_order_notification_sms(order) -> bool:
    recipient = settings.ORDER_NOTIFICATION_PHONE
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    from_number = os.getenv("TWILIO_FROM_NUMBER", "").strip()

    missing = [
        name
        for name, value in {
            "ORDER_NOTIFICATION_PHONE / ADMIN_PHONE": recipient,
            "TWILIO_ACCOUNT_SID": account_sid,
            "TWILIO_AUTH_TOKEN": auth_token,
            "TWILIO_FROM_NUMBER": from_number,
        }.items()
        if not value
    ]
    if missing:
        logger.warning("SMS notification is not configured; missing %s.", ", ".join(missing))
        return False

    payload = {
        "To": recipient,
        "From": from_number,
        "Body": build_order_notification_sms(order),
    }
    encoded_payload = "&".join(
        f"{quote(str(key), safe='')}={quote(str(value), safe='')}"
        for key, value in payload.items()
    ).encode("utf-8")
    auth_header = b64encode(f"{account_sid}:{auth_token}".encode("utf-8")).decode("ascii")
    req = request.Request(
        f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json",
        data=encoded_payload,
        headers={
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=20) as response:
            if response.status >= 400:
                raise error.HTTPError(
                    req.full_url,
                    response.status,
                    "Twilio request failed",
                    response.headers,
                    None,
                )
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        logger.exception("Failed to send order SMS notification: %s", detail or exc.reason)
        return False
    except error.URLError:
        logger.exception("Failed to connect to Twilio for order SMS notification.")
        return False

    return True


def send_order_notifications(order) -> dict[str, bool]:
    results: dict[str, bool] = {}
    channels = [channel.strip().lower() for channel in settings.ORDER_NOTIFICATION_CHANNELS if channel.strip()]

    for channel in channels:
        if channel == "email":
            results[channel] = send_order_notification_email(order)
        elif channel == "sms":
            results[channel] = send_order_notification_sms(order)
        else:
            logger.warning("Unknown notification channel '%s'; skipping.", channel)
            results[channel] = False

    return results


def _normalize_vietqr_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    upper = without_accents.upper()
    cleaned = re.sub(r"[^A-Z0-9 ]+", "", upper)
    return re.sub(r"\s+", " ", cleaned).strip()


def build_order_reference(customer_name: str, order_number: str) -> str:
    normalized_name = _normalize_vietqr_text(customer_name)
    combined = f"{normalized_name} {order_number}".strip()
    if len(combined) <= 25:
        return combined

    name_part = normalized_name[: max(0, 24 - len(order_number))].strip()
    shortened = f"{name_part} {order_number}".strip()
    return shortened[:25].strip()


def generate_preview_order_number() -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"FLR-{timestamp}"


def get_vietqr_bank_info():
    return {
        "accountNo": os.getenv("VIETQR_ACCOUNT_NO", "").strip(),
        "accountName": os.getenv("VIETQR_ACCOUNT_NAME", "").strip(),
        "acqId": os.getenv("VIETQR_ACQ_ID", "").strip(),
        "template": os.getenv("VIETQR_TEMPLATE", "compact2").strip() or "compact2",
        "format": os.getenv("VIETQR_FORMAT", "text").strip() or "text",
    }


def build_vietqr_quick_link(*, acq_id: str, account_no: str, template: str, amount: int, transfer_content: str, account_name: str) -> str:
    encoded_add_info = quote(transfer_content, safe="")
    encoded_account_name = quote(account_name, safe="")
    return (
        f"https://img.vietqr.io/image/{acq_id}-{account_no}-{template}.png"
        f"?amount={int(amount)}&addInfo={encoded_add_info}&accountName={encoded_account_name}"
    )


def is_valid_vietqr_acq_id(acq_id: str) -> bool:
    # Guard obvious placeholders / malformed BINs. Full bank validation should come from VietQR's bank list.
    if not re.fullmatch(r"\d{6}", acq_id):
        return False
    if len(set(acq_id)) == 1:
        return False
    if re.fullmatch(r"(\d{2})\1{2}", acq_id):
        return False
    return True


def build_vietqr_preview(*, amount: int, customer_name: str, order_number: str, qr_code: str = "", qr_data_url: str = ""):
    transfer_content = build_order_reference(customer_name, order_number)
    return {
        "orderNumber": order_number,
        "transferContent": transfer_content,
        "amount": int(amount),
        "qrCode": qr_code,
        "qrDataURL": qr_data_url,
        "bankInfo": get_vietqr_bank_info(),
    }


def generate_vietqr(*, amount: int, customer_name: str, order_number: str):
    client_id = os.getenv("VIETQR_CLIENT_ID")
    api_key = os.getenv("VIETQR_API_KEY")
    bank_info = get_vietqr_bank_info()
    account_no = bank_info["accountNo"]
    account_name = bank_info["accountName"]
    acq_id = bank_info["acqId"]
    template = bank_info["template"]
    qr_format = bank_info["format"]

    missing = [
        key
        for key, value in {
            "VIETQR_CLIENT_ID": client_id,
            "VIETQR_API_KEY": api_key,
            "VIETQR_ACCOUNT_NO": account_no,
            "VIETQR_ACCOUNT_NAME": account_name,
            "VIETQR_ACQ_ID": acq_id,
        }.items()
        if not value
    ]

    if missing:
        raise VietQrConfigError(f"Missing VietQR configuration: {', '.join(missing)}")

    preview = build_vietqr_preview(amount=amount, customer_name=customer_name, order_number=order_number)
    quick_link = build_vietqr_quick_link(
        acq_id=acq_id,
        account_no=account_no,
        template=template,
        amount=amount,
        transfer_content=preview["transferContent"],
        account_name=bank_info["accountName"],
    )

    if not is_valid_vietqr_acq_id(acq_id):
        raise VietQrConfigError(
            "VIETQR_ACQ_ID is not a valid bank BIN. Replace it with the real 6-digit BIN from VietQR's bank list.",
            payload=preview,
        )

    payload = {
        "accountNo": account_no,
        "accountName": _normalize_vietqr_text(account_name),
        "acqId": int(acq_id),
        "amount": int(amount),
        "addInfo": preview["transferContent"],
        "format": qr_format,
        "template": template,
    }

    req = request.Request(
        "https://api.vietqr.io/v2/generate",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-client-id": client_id,
            "x-api-key": api_key,
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        error_type = VietQrProviderError if exc.code >= 500 else VietQrRequestError
        fallback_preview = {
            **preview,
            "qrDataURL": quick_link,
        }
        if exc.code >= 500:
            raise error_type(
                "VietQR API is temporarily unavailable. Using Quick Link fallback.",
                payload=fallback_preview,
            ) from exc
        raise error_type(f"VietQR API error: {detail or exc.reason}", payload=fallback_preview) from exc
    except error.URLError as exc:
        raise VietQrProviderError(
            "VietQR connection failed. Using Quick Link fallback.",
            payload={**preview, "qrDataURL": quick_link},
        ) from exc

    if data.get("code") != "00":
        raise VietQrRequestError(
            data.get("desc") or "VietQR generation failed",
            payload={**preview, "qrDataURL": quick_link},
        )

    return {
        **preview,
        "qrCode": data["data"].get("qrCode", ""),
        "qrDataURL": data["data"].get("qrDataURL", "") or quick_link,
        "raw": data,
    }
