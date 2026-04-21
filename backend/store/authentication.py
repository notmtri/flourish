from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import exceptions
from rest_framework.authentication import TokenAuthentication


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user_auth_tuple = super().authenticate_credentials(key)
        user, token = user_auth_tuple
        ttl_hours = getattr(settings, "ADMIN_TOKEN_TTL_HOURS", 24)

        if ttl_hours and token.created < timezone.now() - timedelta(hours=ttl_hours):
            token.delete()
            raise exceptions.AuthenticationFailed("Admin session expired. Please log in again.")

        return user, token
