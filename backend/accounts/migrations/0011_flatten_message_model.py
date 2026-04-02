from django.db import migrations, models


def build_conversation_key(sender_id, recipient_id):
    left_id, right_id = sorted([int(sender_id), int(recipient_id)])
    return f"{left_id}:{right_id}"


def migrate_message_data(apps, schema_editor):
    Message = apps.get_model("accounts", "Message")

    for message in Message.objects.all():
        sender_id = message.sender_id
        recipient_id = message.recipient_id

        if recipient_id is None:
            participant_ids = list(
                message.conversation.participants.order_by("id").values_list("id", flat=True)
            )
            recipient_id = next((participant_id for participant_id in participant_ids if participant_id != sender_id), sender_id)

        message.conversation_text = build_conversation_key(sender_id, recipient_id)
        message.sender_value = sender_id
        message.recipient_value = recipient_id
        message.save(update_fields=["conversation_text", "sender_value", "recipient_value"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0010_message_recipient"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="conversation_text",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="message",
            name="sender_value",
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AddField(
            model_name="message",
            name="recipient_value",
            field=models.IntegerField(blank=True, default=0, null=True),
        ),
        migrations.RunPython(migrate_message_data, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="message",
            name="conversation",
        ),
        migrations.RemoveField(
            model_name="message",
            name="sender",
        ),
        migrations.RemoveField(
            model_name="message",
            name="recipient",
        ),
        migrations.RenameField(
            model_name="message",
            old_name="conversation_text",
            new_name="conversation",
        ),
        migrations.RenameField(
            model_name="message",
            old_name="sender_value",
            new_name="sender",
        ),
        migrations.RenameField(
            model_name="message",
            old_name="recipient_value",
            new_name="recipient",
        ),
        migrations.AlterField(
            model_name="message",
            name="recipient",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.DeleteModel(
            name="Conversation",
        ),
    ]
