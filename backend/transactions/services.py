# transactions/services.py
from django.db.models import Sum
from django.utils import timezone
from .models import Transaction


def get_monthly_balance(user):
	"""
	Returns total income, total expenses, and net balance for the current month.
	"""
	now = timezone.now()
	current_month = now.month
	current_year = now.year

	monthly_transactions = Transaction.objects.filter(
		user=user,
		transaction_date__year=current_year,
		transaction_date__month=current_month,
	)

	total_income = monthly_transactions.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
	total_expense = monthly_transactions.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0

	return {
		'month': now.strftime('%B'),
		'total_income': total_income,
		'total_expense': total_expense,
		'net_balance': total_income - total_expense,
	}

