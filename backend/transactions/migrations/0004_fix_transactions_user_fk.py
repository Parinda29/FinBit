from django.db import migrations


def fix_transactions_user_fk(apps, schema_editor):
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'transactions'
              AND COLUMN_NAME = 'user_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            LIMIT 1
            """
        )
        row = cursor.fetchone()

        # No FK found; create the correct one.
        if row is None:
            cursor.execute("ALTER TABLE transactions MODIFY COLUMN user_id BIGINT NOT NULL")
            cursor.execute(
                "ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fk_users "
                "FOREIGN KEY (user_id) REFERENCES users(id)"
            )
            return

        constraint_name, referenced_table = row
        if referenced_table == 'users':
            # Already correct.
            return

        # Drop incorrect FK that points to auth_user.
        cursor.execute(f"ALTER TABLE transactions DROP FOREIGN KEY {constraint_name}")

        # Drop the old index if it matches the same name (MySQL auto-created index pattern).
        try:
            cursor.execute(f"ALTER TABLE transactions DROP INDEX {constraint_name}")
        except Exception:
            pass

        # Ensure type matches users.id type.
        cursor.execute("ALTER TABLE transactions MODIFY COLUMN user_id BIGINT NOT NULL")

        # Add the correct FK to the custom users table.
        cursor.execute(
            "ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_fk_users "
            "FOREIGN KEY (user_id) REFERENCES users(id)"
        )


def reverse_fix_transactions_user_fk(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        # Best-effort rollback to Django's default auth_user relation.
        try:
            cursor.execute("ALTER TABLE transactions DROP FOREIGN KEY transactions_user_id_fk_users")
        except Exception:
            return

        try:
            cursor.execute("ALTER TABLE transactions DROP INDEX transactions_user_id_fk_users")
        except Exception:
            pass

        cursor.execute("ALTER TABLE transactions MODIFY COLUMN user_id INT NOT NULL")
        cursor.execute(
            "ALTER TABLE transactions ADD CONSTRAINT transactions_user_id_766cc893_fk_auth_user_id "
            "FOREIGN KEY (user_id) REFERENCES auth_user(id)"
        )


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0003_transaction_date_and_sms_metadata'),
    ]

    operations = [
        migrations.RunPython(fix_transactions_user_fk, reverse_fix_transactions_user_fk),
    ]
