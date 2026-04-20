from django.contrib import admin
from .models import Transaction, Receipt, SMS


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'category', 'amount', 'type', 'source', 'transaction_date', 'created_at')
    list_filter = ('type', 'source', 'category', 'created_at')
    search_fields = ('user__email', 'title', 'category')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Transaction Info', {
            'fields': ('id', 'user', 'title', 'category', 'description', 'amount', 'type', 'source', 'transaction_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('transaction__id', 'transaction__title')
    readonly_fields = ('id', 'created_at')


@admin.register(SMS)
class SMSAdmin(admin.ModelAdmin):
    list_display = ('id', 'transaction', 'sender', 'sms_timestamp', 'received_at')
    list_filter = ('received_at', 'sms_timestamp', 'sender')
    search_fields = ('transaction__id', 'sender', 'message')
    readonly_fields = ('id', 'received_at')
