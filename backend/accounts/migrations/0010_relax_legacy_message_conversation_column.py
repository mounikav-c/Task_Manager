from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_conversation_message"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'message'
                      AND column_name = 'conversation'
                      AND is_nullable = 'NO'
                ) THEN
                    ALTER TABLE message ALTER COLUMN conversation DROP NOT NULL;
                END IF;
            END
            $$;
            """,
            reverse_sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'message'
                      AND column_name = 'conversation'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM message
                    WHERE conversation IS NULL
                ) THEN
                    ALTER TABLE message ALTER COLUMN conversation SET NOT NULL;
                END IF;
            END
            $$;
            """,
        ),
    ]
