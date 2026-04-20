from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ReceiptCapture',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('image', models.FileField(upload_to='receipts/captures/')),
                ('source', models.CharField(choices=[('camera', 'Camera'), ('upload', 'Upload')], default='camera', max_length=20)),
                ('ocr_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('ocr_text', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='receipt_captures', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'receipt_captures',
                'verbose_name': 'Receipt Capture',
                'verbose_name_plural': 'Receipt Captures',
                'ordering': ['-created_at'],
            },
        ),
    ]
