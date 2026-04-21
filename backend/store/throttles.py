from rest_framework.throttling import SimpleRateThrottle


class AdminLoginThrottle(SimpleRateThrottle):
    scope = "admin_login"

    def get_cache_key(self, request, view):
        identifier = (request.data.get("username") or "").strip().lower()
        ip = self.get_ident(request)
        if not identifier:
            identifier = "anonymous"
        return self.cache_format % {"scope": self.scope, "ident": f"{ip}:{identifier}"}


class OrderCreateThrottle(SimpleRateThrottle):
    scope = "order_create"

    def get_cache_key(self, request, view):
        ip = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ip}
