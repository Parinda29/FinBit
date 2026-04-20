from django.urls import path
from .views import receipt_detail, receipt_list, receipt_capture_list_create, receipt_capture_detail

urlpatterns = [
    path('', receipt_list, name='receipt_list'),
    path('captures/', receipt_capture_list_create, name='receipt_capture_list_create'),
    path('captures/<int:capture_id>/', receipt_capture_detail, name='receipt_capture_detail'),
    path('<int:transaction_id>/', receipt_detail, name='receipt_detail'),
]
