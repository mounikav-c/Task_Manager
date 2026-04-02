from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0011_flatten_message_model"),
    ]

    operations = [
        migrations.DeleteModel(
            name="ContactMessage",
        ),
    ]
