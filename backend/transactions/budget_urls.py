from django.urls import path

from .views import (
    category_budget_list_create,
    category_budget_detail,
    category_budget_summary,
)

urlpatterns = [
    path('', category_budget_list_create, name='budget_list_create_alias'),
    path('<int:budget_id>/', category_budget_detail, name='budget_detail_alias'),
    path('summary/', category_budget_summary, name='budget_summary_alias'),
]
