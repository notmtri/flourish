# Deployment Guide

This project is designed to ship as:

- React frontend on a static host such as Vercel or Netlify
- Django backend on a Python host such as Railway or Render
- Postgres for production data

## 1. Required environment variables

Frontend:

```env
REACT_APP_API_BASE=https://api.yourdomain.com/api
```

Backend:

```env
DJANGO_SECRET_KEY=replace-this
DEBUG=False
ALLOWED_HOSTS=api.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
DATABASE_URL=postgres://...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-this-with-a-strong-password
ADMIN_EMAIL=you@example.com
ORDER_NOTIFICATION_CHANNELS=email,bitrix24
ORDER_NOTIFICATION_EMAIL=you@example.com
BITRIX24_WEBHOOK_URL=https://your-company.bitrix24.com/rest/<user_id>/<webhook>/log.blogpost.add
BITRIX24_DESTINATIONS=UA
BITRIX24_IMPORTANT=True
VIETQR_CLIENT_ID=...
VIETQR_API_KEY=...
VIETQR_ACCOUNT_NO=...
VIETQR_ACCOUNT_NAME=...
VIETQR_ACQ_ID=...
VIETQR_TEMPLATE=compact2
VIETQR_FORMAT=text
```

## 2. Backend deploy

Recommended host: Railway or Render.

If your Render service root directory is `backend`, use the commands below as-is. If your service root is the repo root, prefix paths with `backend/` and use `--chdir backend` for Gunicorn.

Build/install:

```bash
pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput && python manage.py sync_admin_user
```

Start command:

```bash
gunicorn config.wsgi:application
```

## 3. Frontend deploy

Recommended host: Vercel or Netlify.

Build command:

```bash
npm run build
```

Publish directory:

```text
build
```

Set `REACT_APP_API_BASE` to the live backend URL before deploying.

## 4. Domain wiring

- Point `yourdomain.com` to the frontend host
- Point `api.yourdomain.com` to the Django host
- Update frontend and backend env vars to match the final domains

## 5. Release checklist

1. Deploy backend
2. Run migrations, collect static files, and sync the admin user from env
4. Verify `/api/health/`
5. Deploy frontend with the live API base URL
6. Test admin login
7. Test product listing
8. Test order creation
9. Test VietQR generation and fallback behavior
