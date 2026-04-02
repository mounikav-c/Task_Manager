from django.conf import settings
from django.db import migrations, models


def populate_message_recipient(apps, schema_editor):
    Message = apps.get_model("accounts", "Message")

    for message in Message.objects.select_related("sender", "conversation").prefetch_related("conversation__participants"):
        participants = list(message.conversation.participants.all())
        recipient = next((participant for participant in participants if participant.pk != message.sender_id), None)
        if recipient is None:
            recipient = message.sender

        Message.objects.filter(pk=message.pk).update(recipient=recipient)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_conversation_message"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="recipient",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.CASCADE,
                related_name="received_messages",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(populate_message_recipient, migrations.RunPython.noop),
    ]
