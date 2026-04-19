import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update a Django admin user from environment variables."

    def handle(self, *args, **options):
        username = os.getenv("ADMIN_USERNAME", "").strip()
        password = os.getenv("ADMIN_PASSWORD", "").strip()
        email = os.getenv("ADMIN_EMAIL", "").strip()

        if not username:
            raise CommandError("Missing ADMIN_USERNAME.")

        if not password:
            raise CommandError("Missing ADMIN_PASSWORD.")

        User = get_user_model()
        user, created = User.objects.get_or_create(username=username)

        if email:
            user.email = email

        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin user '{username}'"))
