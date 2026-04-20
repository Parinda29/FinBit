from rest_framework import serializers

from .models import ReceiptCapture


class ReceiptCaptureSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    transaction_title = serializers.CharField(source='transaction.title', read_only=True)

    def validate_category(self, value):
        normalized = (value or 'others').strip().lower()
        allowed = {'food', 'bill', 'transport', 'shopping', 'health', 'entertainment', 'others'}
        return normalized if normalized in allowed else 'others'

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

    class Meta:
        model = ReceiptCapture
        fields = [
            'id',
            'image',
            'image_url',
            'extracted_title',
            'transaction',
            'transaction_title',
            'source',
            'category',
            'ocr_amount',
            'ocr_text',
            'created_at',
        ]
        read_only_fields = ['id', 'image_url', 'transaction_title', 'created_at']
