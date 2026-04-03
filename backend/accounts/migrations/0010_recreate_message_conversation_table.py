from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_message"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS message_conversation (
                id BIGSERIAL PRIMARY KEY,
                sender_conversation TEXT NOT NULL,
                receiver_conversation TEXT NOT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                sender_id INTEGER NOT NULL,
                recipient_id INTEGER NOT NULL,
                CONSTRAINT message_conversation_sender_id_fk
                    FOREIGN KEY (sender_id)
                    REFERENCES auth_user_profile (user_id)
                    ON DELETE CASCADE,
                CONSTRAINT message_conversation_recipient_id_fk
                    FOREIGN KEY (recipient_id)
                    REFERENCES auth_user_profile (user_id)
                    ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS message_conversation_sender_id_idx
                ON message_conversation (sender_id);
            CREATE INDEX IF NOT EXISTS message_conversation_recipient_id_idx
                ON message_conversation (recipient_id);
            CREATE INDEX IF NOT EXISTS message_conversation_created_at_idx
                ON message_conversation (created_at);
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS message_conversation;
            """,
        ),
    ]
