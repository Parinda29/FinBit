from django.db import migrations


def ensure_receipts_table(apps, schema_editor):
    connection = schema_editor.connection
    table_name = 'receipts'

    with connection.cursor() as cursor:
        existing_tables = set(connection.introspection.table_names(cursor))

        if table_name in existing_tables:
            columns = {column.name for column in connection.introspection.get_table_description(cursor, table_name)}
            required_columns = {'id', 'transaction_id', 'receipt_image', 'created_at'}
            if required_columns.issubset(columns):
                return

            backup_table = 'receipts_legacy_backup_20260328'
            if backup_table in existing_tables:
                cursor.execute(f'DROP TABLE IF EXISTS `{table_name}`')
            else:
                cursor.execute(f'RENAME TABLE `{table_name}` TO `{backup_table}`')

        cursor.execute(
            """
            CREATE TABLE `receipts` (
              `id` bigint AUTO_INCREMENT NOT NULL,
              `receipt_image` varchar(100) NULL,
              `created_at` datetime(6) NOT NULL,
              `transaction_id` bigint NOT NULL,
              PRIMARY KEY (`id`),
              UNIQUE KEY `receipts_transaction_id_uniq` (`transaction_id`),
              CONSTRAINT `receipts_transaction_id_fk`
                FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
                ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """
        )


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0009_repair_legacy_sms_table'),
    ]

    operations = [
        migrations.RunPython(ensure_receipts_table, noop_reverse),
    ]
