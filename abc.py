from django.contrib.auth import get_user_model
User = get_user_model()

u, created = User.objects.get_or_create(username="admin")
u.is_staff = True
u.is_superuser = True
u.email = "you@example.com"
u.set_password("your-new-password")
u.save()

print("done", created)
