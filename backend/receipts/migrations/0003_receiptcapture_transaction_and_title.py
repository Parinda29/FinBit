from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0005_budget_model'),
        ('receipts', '0002_receiptcapture_category'),
    ]

    operations = [
        migrations.AddField(
            model_name='receiptcapture',
            name='extracted_title',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='receiptcapture',
            name='transaction',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='receipt_captures',
                to='transactions.transaction',
            ),
        ),
    ]
