import os

from django.core.management.base import BaseCommand, CommandError
from store.services import sync_admin_user_from_env


class Command(BaseCommand):
    help = "Create or update a Django admin user from environment variables."

    def handle(self, *args, **options):
        username = os.getenv("ADMIN_USERNAME", "").strip()
        password = os.getenv("ADMIN_PASSWORD", "").strip()

        if not username:
            raise CommandError("Missing ADMIN_USERNAME.")

        if not password:
            raise CommandError("Missing ADMIN_PASSWORD.")

        synced_user = sync_admin_user_from_env(login_identifier=username)
        if synced_user is None:
            raise CommandError("Unable to sync admin user from environment.")
        _, created = synced_user

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin user '{username}'"))
