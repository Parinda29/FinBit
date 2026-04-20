from django.urls import path

from .views import budget_notifications, mark_notification_read, delete_notification

urlpatterns = [
    path('', budget_notifications, name='api_notifications_list'),
    path('<int:notification_id>/read/', mark_notification_read, name='api_notifications_mark_read'),
    path('<int:notification_id>/', delete_notification, name='api_notifications_delete'),
]
