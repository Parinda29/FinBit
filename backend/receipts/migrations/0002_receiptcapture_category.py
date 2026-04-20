from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('receipts', '0001_receiptcapture'),
    ]

    operations = [
        migrations.AddField(
            model_name='receiptcapture',
            name='category',
            field=models.CharField(
                choices=[('food', 'Food'), ('bill', 'Bill'), ('others', 'Others')],
                default='others',
                max_length=20,
            ),
        ),
    ]
