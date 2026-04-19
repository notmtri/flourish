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

Build/install:

```bash
pip install -r backend/requirements.txt
```

Start command:

```bash
gunicorn config.wsgi:application --chdir backend
```

Run migrations:

```bash
python backend/manage.py migrate
```

Collect static files:

```bash
python backend/manage.py collectstatic --noinput
```

Create admin user:

```bash
python backend/manage.py createsuperuser
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
2. Run migrations
3. Create superuser
4. Verify `/api/health/`
5. Deploy frontend with the live API base URL
6. Test admin login
7. Test product listing
8. Test order creation
9. Test VietQR generation and fallback behavior
