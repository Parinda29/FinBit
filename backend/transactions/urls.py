from django.urls import path
from .views import (
    transaction_list,
    transaction_detail,
    transaction_summary,
    add_receipt,
    add_sms_metadata,
    import_statement_pdf,
    scan_receipt_ocr,
    category_budget_list_create,
    category_budget_detail,
    category_budget_summary,
    budget_notifications,
)

urlpatterns = [
    path('', transaction_list, name='transaction_list'),
    path('<int:pk>/', transaction_detail, name='transaction_detail'),
    path('summary/', transaction_summary, name='transaction_summary'),
    path('<int:transaction_id>/receipt/', add_receipt, name='add_receipt'),
    path('<int:transaction_id>/sms/', add_sms_metadata, name='add_sms_metadata'),
    path('import-statement/', import_statement_pdf, name='import_statement_pdf'),
    path('budgets/', category_budget_list_create, name='category_budget_list_create'),
    path('budgets/<int:budget_id>/', category_budget_detail, name='category_budget_detail'),
    path('budgets/summary/', category_budget_summary, name='category_budget_summary'),
    path('notifications/', budget_notifications, name='budget_notifications'),
    path('scan-ocr/', scan_receipt_ocr, name='scan_receipt_ocr'),
]
