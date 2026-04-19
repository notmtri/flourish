# Getting Started with Flourish

Flourish is a React storefront backed by a Django API and a local SQLite database.

## Stack

- Frontend: React + TypeScript
- Backend: Django + Django REST Framework
- Database: `backend/db.sqlite3`
- Admin auth: Django staff users with token login
- Payments: COD and VietQR, with manual transfer fallback if VietQR is unavailable

## Local setup

1. Install frontend dependencies:
```bash
npm install
```
2. Install backend dependencies into the project virtualenv:
```bash
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```
3. Make sure `.env` contains:
```env
REACT_APP_API_BASE=http://127.0.0.1:8000/api
DJANGO_SECRET_KEY=change-me
VIETQR_CLIENT_ID=...
VIETQR_API_KEY=...
VIETQR_ACCOUNT_NO=...
VIETQR_ACCOUNT_NAME=...
VIETQR_ACQ_ID=...
```
4. Run the Django API:
```bash
cd backend
..\ .venv\Scripts\python.exe manage.py runserver
```
5. Run the React app from the repo root:
```bash
npm start
```

Restart Django after changing any backend or VietQR environment variables. Restart React after changing `REACT_APP_*` variables.

## Admin access

Create a Django superuser or staff user, then sign in from the storefront admin dialog.

Example:
```bash
cd backend
..\ .venv\Scripts\python.exe manage.py createsuperuser
```

## Daily flow

1. Add products from the admin panel.
2. Test checkout with both `COD` and `QR`.
3. For QR orders, ask customers to upload a payment screenshot after transfer.
4. Review QR payment proof in the admin panel and mark payment as verified when appropriate.

## VietQR behavior

- When VietQR is healthy, the checkout page shows a generated QR image.
- When VietQR is down, checkout still shows the configured account number, account name, bank BIN, amount, and transfer content.
- Customers can still complete payment manually and upload proof.

## Commands

Run Django checks:
```bash
cd backend
..\ .venv\Scripts\python.exe manage.py check
```

Run backend tests:
```bash
cd backend
..\ .venv\Scripts\python.exe manage.py test
```

Build the frontend:
```bash
npm run build
```
