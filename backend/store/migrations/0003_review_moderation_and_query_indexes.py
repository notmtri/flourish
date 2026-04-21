from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("store", "0002_orderauditlog_order_admin_notes_order_archived_at_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="category",
            field=models.CharField(
                choices=[
                    ("Bouquet", "Bouquet"),
                    ("Single Stem", "Single Stem"),
                    ("Gift Set", "Gift Set"),
                    ("Custom", "Custom"),
                ],
                db_index=True,
                default="Bouquet",
                max_length=30,
            ),
        ),
        migrations.AlterField(
            model_name="review",
            name="is_visible",
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name="order",
            name="phone",
            field=models.CharField(db_index=True, max_length=32),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["is_archived", "-created_at"], name="store_order_archived_created_idx"),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["customer_name"], name="store_order_customer_name_idx"),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(fields=["order_number", "phone"], name="store_order_number_phone_idx"),
        ),
    ]
