from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone

User = get_user_model()


class Transaction(models.Model):
    """
    Transaction model to store user's income and expense transactions
    from SMS, manual entry, or receipt scanner.
    """

    TRANSACTION_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    SOURCE_TYPES = (
        ('manual', 'Manual'),
        ('sms', 'SMS'),
        ('scanner', 'Scanner'),
    )

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='transactions'
    )

    title = models.CharField(max_length=255)

    category = models.CharField(max_length=100)

    description = models.TextField(blank=True, null=True)

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )

    type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES,
        default='expense'
    )

    # NEW FIELD (important for your project)
    source = models.CharField(
        max_length=20,
        choices=SOURCE_TYPES,
        default='manual'
    )

    transaction_date = models.DateTimeField(default=timezone.now)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.type} - {self.amount}"
    
class Receipt(models.Model):

    id = models.BigAutoField(primary_key=True)

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='receipt'
    )

    receipt_image = models.FileField(
        upload_to='receipts/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'receipts'
        verbose_name = 'Receipt'
        verbose_name_plural = 'Receipts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Receipt for Transaction #{self.transaction.id}"


class SMS(models.Model):

    id = models.BigAutoField(primary_key=True)

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='sms'
    )

    message = models.TextField()

    sender = models.CharField(max_length=120)

    sms_timestamp = models.DateTimeField(blank=True, null=True)

    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sms'
        verbose_name = 'SMS'
        verbose_name_plural = 'SMS'
        ordering = ['-received_at']

    def __str__(self):
        return f"SMS from {self.sender} - Transaction #{self.transaction.id}"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('budget', 'Budget'),
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('system', 'System'),
    )

    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='system')
    title = models.CharField(max_length=120)
    message = models.TextField()
    month = models.CharField(max_length=7, help_text='YYYY-MM')
    category = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.user_id})"











class CategoryBudget(models.Model):
    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='category_budgets'
    )

    category = models.CharField(max_length=100)

    limit_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )

    month = models.DateField(help_text='First day of target month (YYYY-MM-01).')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'category_budgets'
        verbose_name = 'Category Budget'
        verbose_name_plural = 'Category Budgets'
        ordering = ['-month', 'category']
        unique_together = ('user', 'category', 'month')

    def __str__(self):
        return f"{self.category} budget {self.limit_amount} ({self.month})"