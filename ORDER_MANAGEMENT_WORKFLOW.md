# Flourish Order Management Workflow

## Order states

- `pending`: order created, waiting for review
- `processing`: arrangement is being prepared
- `shipped`: handed off for delivery
- `delivered`: completed
- `cancelled`: cancelled before completion

## Payment states

- `pending`: standard COD state
- `awaiting_verification`: QR order created and waiting for proof review
- `verified`: payment confirmed
- `failed`: payment rejected or invalid

## Recommended process

### 1. New order received

- Open the admin panel and review the customer name, phone, address, items, and payment method.
- For QR orders, confirm the order has a transfer reference and a screenshot upload.

### 2. Payment review for QR orders

- Compare the uploaded screenshot with the order total.
- Check that the transfer content matches the displayed order reference.
- Mark payment as `verified` when the proof is valid.
- Mark payment as `failed` when the proof is missing, mismatched, or suspicious.

### 3. Fulfillment

- Move the order status to `processing` when work starts.
- Move it to `shipped` when it leaves for delivery.
- Move it to `delivered` after completion.
- For COD orders, mark payment as `verified` after cash is collected.

## VietQR operations

- Normal case: checkout shows a live VietQR image and the customer uploads payment proof.
- Fallback case: if VietQR returns a provider error, checkout still shows the configured account number, account name, bank BIN, amount, and transfer description.
- Staff should treat fallback QR orders the same as regular QR orders once proof is uploaded.

## Admin notes

- Admin login uses real Django staff users, not a hardcoded frontend password.
- Orders and products are stored in the Django database at `backend/db.sqlite3`.
- The API base path is `/api/...`.

## Suggested checks

- Review new QR orders several times per day.
- Verify screenshots before marking payments as `verified`.
- Keep product data, pricing, and images current.
- Run `manage.py test` before changing order or payment behavior.
