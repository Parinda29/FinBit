from django.db import migrations


def repair_legacy_sms_table(apps, schema_editor):
    connection = schema_editor.connection
    table_name = 'sms'

    with connection.cursor() as cursor:
        existing_tables = set(connection.introspection.table_names(cursor))
        if table_name not in existing_tables:
            return

        columns = {column.name for column in connection.introspection.get_table_description(cursor, table_name)}
        required_columns = {'id', 'transaction_id', 'message', 'sender', 'received_at', 'sms_timestamp'}

        # Schema is already correct enough for app usage.
        if required_columns.issubset(columns):
            return

        legacy_backup = 'sms_legacy_backup_20260328'
        if legacy_backup in existing_tables:
            # If backup table already exists from a prior run, reuse it.
            cursor.execute(f'DROP TABLE IF EXISTS `{table_name}`')
        else:
            cursor.execute(f'RENAME TABLE `{table_name}` TO `{legacy_backup}`')

        cursor.execute(
            """
            CREATE TABLE `sms` (
              `id` bigint AUTO_INCREMENT NOT NULL,
              `message` longtext NOT NULL,
              `sender` varchar(120) NOT NULL,
              `sms_timestamp` datetime(6) NULL,
              `received_at` datetime(6) NOT NULL,
              `transaction_id` bigint NOT NULL,
              PRIMARY KEY (`id`),
              UNIQUE KEY `sms_transaction_id_uniq` (`transaction_id`),
              CONSTRAINT `sms_transaction_id_fk`
                FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`)
                ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """
        )


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0008_ensure_transaction_source_column'),
    ]

    operations = [
        migrations.RunPython(repair_legacy_sms_table, noop_reverse),
    ]
