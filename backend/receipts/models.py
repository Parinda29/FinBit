from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ReceiptCapture(models.Model):
	SOURCE_CHOICES = (
		('camera', 'Camera'),
		('upload', 'Upload'),
	)

	CATEGORY_CHOICES = (
		('food', 'Food'),
		('bill', 'Bill'),
		('transport', 'Transport'),
		('shopping', 'Shopping'),
		('health', 'Health'),
		('entertainment', 'Entertainment'),
		('others', 'Others'),
	)

	id = models.BigAutoField(primary_key=True)

	user = models.ForeignKey(
		User,
		on_delete=models.CASCADE,
		related_name='receipt_captures',
	)

	image = models.FileField(upload_to='receipts/captures/')
	extracted_title = models.CharField(max_length=255, blank=True, null=True)
	transaction = models.ForeignKey(
		'transactions.Transaction',
		on_delete=models.SET_NULL,
		related_name='receipt_captures',
		blank=True,
		null=True,
	)

	source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='camera')
	category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='others')

	ocr_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
	ocr_text = models.TextField(blank=True, null=True)

	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'receipt_captures'
		verbose_name = 'Receipt Capture'
		verbose_name_plural = 'Receipt Captures'
		ordering = ['-created_at']

	def __str__(self):
		return f"ReceiptCapture #{self.id} ({self.source})"
