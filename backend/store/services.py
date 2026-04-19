import json
import os
import re
import unicodedata
from datetime import datetime
from urllib import error, request


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
        raise error_type(f"VietQR API error: {detail or exc.reason}", payload=preview) from exc
    except error.URLError as exc:
        raise VietQrProviderError(f"VietQR connection failed: {exc.reason}", payload=preview) from exc

    if data.get("code") != "00":
        raise VietQrRequestError(data.get("desc") or "VietQR generation failed", payload=preview)

    return {
        **preview,
        "qrCode": data["data"].get("qrCode", ""),
        "qrDataURL": data["data"].get("qrDataURL", ""),
        "raw": data,
    }
