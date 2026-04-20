from django.db import migrations


def ensure_source_column(apps, schema_editor):
    connection = schema_editor.connection
    table_name = 'transactions'

    with connection.cursor() as cursor:
        existing_columns = {
            column.name for column in connection.introspection.get_table_description(cursor, table_name)
        }
        if 'source' in existing_columns:
            return

        # Repair legacy databases where migration state is marked applied
        # but the transactions.source column was not actually created.
        cursor.execute(
            "ALTER TABLE transactions ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'manual'"
        )


def noop_reverse(apps, schema_editor):
    # Intentionally keep the column in reverse to avoid data loss.
    return


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0007_delete_budget'),
    ]

    operations = [
        migrations.RunPython(ensure_source_column, noop_reverse),
    ]
