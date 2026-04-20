from rest_framework import serializers
from datetime import datetime
from django.db import OperationalError, ProgrammingError

from .models import Transaction, Receipt, SMS, Notification, CategoryBudget


class ReceiptSerializer(serializers.ModelSerializer):
    """
    Serializer for Receipt model.
    """

    receipt_image_url = serializers.SerializerMethodField()

    def get_receipt_image_url(self, obj):
        if not obj.receipt_image:
            return None
        request = self.context.get('request')
        url = obj.receipt_image.url
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = Receipt
        fields = ['id', 'transaction', 'receipt_image', 'receipt_image_url', 'created_at']
        read_only_fields = ['id', 'transaction', 'created_at']


class ReceiptListSerializer(ReceiptSerializer):
    transaction_title = serializers.CharField(source='transaction.title', read_only=True)
    transaction_category = serializers.CharField(source='transaction.category', read_only=True)
    transaction_type = serializers.CharField(source='transaction.type', read_only=True)
    transaction_amount = serializers.DecimalField(
        source='transaction.amount',
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    transaction_date = serializers.DateTimeField(source='transaction.transaction_date', read_only=True)

    class Meta(ReceiptSerializer.Meta):
        fields = ReceiptSerializer.Meta.fields + [
            'transaction_title',
            'transaction_category',
            'transaction_type',
            'transaction_amount',
            'transaction_date',
        ]


class SMSSerializer(serializers.ModelSerializer):
    """
    Serializer for SMS model.
    """

    class Meta:
        model = SMS
        fields = ['id', 'transaction', 'message', 'sender', 'sms_timestamp', 'received_at']
        read_only_fields = ['id', 'transaction', 'received_at']


class SMSCreateSerializer(serializers.ModelSerializer):
    """
    Serializer used when creating/updating SMS metadata for a transaction.
    """

    class Meta:
        model = SMS
        fields = ['message', 'sender', 'sms_timestamp']


class TransactionDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed transaction view.
    Includes related receipt and SMS data.
    """

    receipt = ReceiptSerializer(read_only=True)
    sms = SMSSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'user',
            'title',
            'category',
            'description',
            'amount',
            'type',
            'source',
            'transaction_date',
            'receipt',
            'sms',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for Transaction model.
    """

    has_receipt = serializers.SerializerMethodField()

    def get_has_receipt(self, obj):
        try:
            return hasattr(obj, 'receipt') and obj.receipt is not None
        except (OperationalError, ProgrammingError):
            # Legacy databases may miss the receipts table; avoid breaking core transaction APIs.
            return False

    class Meta:
        model = Transaction
        fields = [
            'id',
            'title',
            'category',
            'description',
            'amount',
            'type',
            'source',
            'has_receipt',
            'transaction_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TransactionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new transactions.
    """

    class Meta:
        model = Transaction
        fields = [
            'title',
            'category',
            'description',
            'amount',
            'type',
            'source',
            'transaction_date',
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'title',
            'message',
            'month',
            'category',
            'amount',
            'is_read',
            'read_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'updated_at',
            'read_at',
        ]





class CategoryBudgetSerializer(serializers.ModelSerializer):
    month_label = serializers.SerializerMethodField()

    class Meta:
        model = CategoryBudget
        fields = [
            'id',
            'category',
            'limit_amount',
            'month',
            'month_label',
            'created_at',
        ]
        read_only_fields = ['id', 'month_label', 'created_at']

    def get_month_label(self, obj):
        return obj.month.strftime('%Y-%m')

    def validate_category(self, value):
        normalized = ' '.join((value or '').strip().split())
        if not normalized:
            raise serializers.ValidationError('Category is required.')
        return normalized.title()

    def validate_month(self, value):
        return value.replace(day=1)


class CategoryBudgetSummaryItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    category = serializers.CharField()
    icon = serializers.CharField()
    month = serializers.CharField()
    limit_amount = serializers.CharField()
    current_spent = serializers.CharField()
    remaining = serializers.CharField()
    usage_percent = serializers.FloatField()
    near_limit = serializers.BooleanField()
    exceeded = serializers.BooleanField()
    exceeded_by = serializers.CharField()
    alert_message = serializers.CharField(allow_blank=True)


class BudgetSummarySerializer(serializers.Serializer):
    month = serializers.CharField()
    days_remaining = serializers.IntegerField()
    total_budget = serializers.CharField()
    total_spent = serializers.CharField()
    total_remaining = serializers.CharField()
    total_exceeded = serializers.CharField()
    usage_percent = serializers.FloatField()
    exceeded_count = serializers.IntegerField()
    near_limit_count = serializers.IntegerField()
    categories = CategoryBudgetSummaryItemSerializer(many=True)
    alerts = serializers.ListField(child=serializers.CharField())
