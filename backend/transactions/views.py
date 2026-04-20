from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser

import re
import os
import shutil
import difflib
import tempfile
from decimal import Decimal, InvalidOperation
from datetime import datetime, timedelta
from typing import Any, Optional
from django.db import OperationalError, ProgrammingError
from django.db.models import Sum
from django.utils import timezone

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover
    PdfReader = None
try:
    from PIL import Image, ImageOps, ImageFilter
except ImportError:  # pragma: no cover
    Image = None
    ImageOps = None
    ImageFilter = None

try:
    import pytesseract
except ImportError:  # pragma: no cover
    pytesseract = None

if pytesseract is not None:
    default_windows_tesseract = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    if not os.environ.get('TESSERACT_CMD') and os.path.exists(default_windows_tesseract):
        pytesseract.pytesseract.tesseract_cmd = default_windows_tesseract

from .models import Transaction, Receipt, SMS, Notification
from .serializers import (
    TransactionSerializer,
    TransactionDetailSerializer,
    TransactionCreateSerializer,
    ReceiptSerializer,
    SMSSerializer,
    SMSCreateSerializer,
    NotificationSerializer,
)

from .models import CategoryBudget
from .serializers import CategoryBudgetSerializer, BudgetSummarySerializer
from .services import get_monthly_balance
from .ocr_pipeline import process_receipt


def _extract_date(line: str):
    patterns = [
        (r'\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b', 'ymd'),
        (r'\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b', 'dmy'),
    ]

    for pattern, kind in patterns:
        match = re.search(pattern, line)
        if not match:
            continue

        try:
            if kind == 'ymd':
                year, month, day = map(int, match.groups())
            else:
                day, month, year = map(int, match.groups())
            return datetime(year, month, day)
        except ValueError:
            continue

    return None


def _extract_amount(line: str):
    amount_patterns = [
        r'(?:rs\.?|npr|inr)\s*([0-9,]+(?:\.[0-9]{1,2})?)',
        r'amount\s*[:=\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)',
        r'([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:rs\.?|npr|inr)',
    ]

    for pattern in amount_patterns:
        match = re.search(pattern, line, re.IGNORECASE)
        if not match:
            continue
        raw_value = match.group(1).replace(',', '')
        try:
            value = Decimal(raw_value)
            if value > 0:
                return value
        except InvalidOperation:
            continue

    return None


def _infer_transaction_type(line: str):
    normalized = line.lower()
    expense_tokens = ['paid', 'debited', 'dr', 'purchase', 'sent', 'payment']
    income_tokens = ['received', 'credited', 'cr', 'refund', 'cashback']

    if any(token in normalized for token in expense_tokens):
        return 'expense'
    if any(token in normalized for token in income_tokens):
        return 'income'
    return 'expense'


def _infer_category(provider: str):
    if provider == 'bank':
        return 'Banking'
    if provider in ('esewa', 'khalti'):
        return 'Wallet'
    return 'Statement Import'


def _build_title(provider: str, line: str):
    compact = re.sub(r'\s+', ' ', line).strip()
    if compact:
        return compact[:90]

    if provider == 'esewa':
        return 'eSewa Statement Import'
    if provider == 'khalti':
        return 'Khalti Statement Import'
    if provider == 'bank':
        return 'Bank Statement Import'
    return 'Statement Import'


def _extract_transactions_from_pdf_text(text: str, provider: str):
    rows = []
    lines = [line.strip() for line in text.splitlines() if line and line.strip()]

    for line in lines:
        amount = _extract_amount(line)
        if not amount:
            continue

        lower_line = line.lower()
        if any(skip in lower_line for skip in ['total', 'opening balance', 'closing balance']):
            continue

        rows.append({
            'title': _build_title(provider, line),
            'category': _infer_category(provider),
            'description': f'[{provider.upper()} PDF] {line[:400]}',
            'amount': amount,
            'type': _infer_transaction_type(line),
            'transaction_date': _extract_date(line),
        })

    return rows


def _extract_first_amount_from_text(raw_text: str):
    if not raw_text:
        return None

    lines = [line.strip() for line in raw_text.splitlines() if line and line.strip()]
    if not lines:
        return None

    number_pattern = re.compile(r'([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)')

    def parse_decimal(value: str):
        try:
            amount = Decimal(value.replace(',', ''))
            if amount <= 0:
                return None
            if amount > Decimal('10000000'):
                return None
            return amount.quantize(Decimal('0.01'))
        except InvalidOperation:
            return None

    strong_total_keywords = (
        'grand total',
        'grandtotal',
        'invoice total',
        'bill total',
        'total amount',
        'amount total',
        'net amount',
        'net total',
        'nettotal',
        'amount due',
        'total due',
        'payable amount',
        'amount payable',
        'total payable',
        'final amount',
        'final total',
        'you paid',
        'total paid',
        'amount paid',
        'balance due',
    )
    soft_total_keywords = (
        'total',
        'payable',
        'due',
        'payment',
        'paid',
        'final',
        'net',
        # Common OCR variants for "total"
        'tota1',
        'totai',
    )
    excluded_keywords = (
        'subtotal', 'sub total', 'tax', 'vat', 'discount', 'rate', 'qty', 'quantity',
        'mobile', 'phone', 'bill no', 'invoice no', 'hscode', 'refund', 'change',
        'round off', 'roundoff', 'cash received', 'cash tendered', 'tendered', 'mrp', 'unit price',
        'sgst', 'cgst', 'service charge', 'delivery fee', 'tip', 'item', 'invoice #', 'invoice id'
    )

    normalized_lines = [re.sub(r'\s+', ' ', line.lower()).strip() for line in lines]

    def has_any(text: str, tokens) -> bool:
        return any(token in text for token in tokens)

    def parse_numbers(text: str):
        numbers = [parse_decimal(item) for item in number_pattern.findall(text)]
        return [item for item in numbers if item is not None]

    scored_candidates = []

    for idx, line in enumerate(lines):
        normalized_line = normalized_lines[idx]
        numbers_in_line = parse_numbers(line)
        if not numbers_in_line:
            continue

        prev_line = normalized_lines[idx - 1] if idx > 0 else ''
        next_line = normalized_lines[idx + 1] if idx + 1 < len(normalized_lines) else ''

        has_currency_signal = bool(re.search(r'(?:rs\.?|npr|inr)', normalized_line))
        has_strong_total = has_any(normalized_line, strong_total_keywords)
        has_soft_total = has_any(normalized_line, soft_total_keywords)
        has_excluded = has_any(normalized_line, excluded_keywords)

        neighbor_strong_total = has_any(prev_line, strong_total_keywords) or has_any(next_line, strong_total_keywords)
        neighbor_soft_total = has_any(prev_line, soft_total_keywords) or has_any(next_line, soft_total_keywords)

        # If current line looks like tax/subtotal/etc, reject unless adjacent line clearly says grand/final total.
        if has_excluded and not neighbor_strong_total:
            continue

        score = 0
        if has_strong_total:
            score += 140
        elif has_soft_total:
            score += 80

        if neighbor_strong_total:
            score += 90
        elif neighbor_soft_total:
            score += 45

        if has_currency_signal:
            score += 25
        if re.search(r'\d+\.\d{2}', line):
            score += 12

        # Keep strictness: require a clear total signal on this line or neighboring line.
        if score < 90:
            continue

        # Most receipts place totals to the right.
        candidate_amount = numbers_in_line[-1]
        has_decimal_point = bool(re.search(r'\d+\.\d{1,2}', line))
        if has_decimal_point:
            score += 14
        scored_candidates.append((score, candidate_amount, idx, has_decimal_point))

    # Fallback for split-line pattern: line has "Total" but amount is in next line.
    for idx, normalized_line in enumerate(normalized_lines):
        if not (has_any(normalized_line, strong_total_keywords) or has_any(normalized_line, soft_total_keywords)):
            continue
        if has_any(normalized_line, excluded_keywords):
            continue

        neighbor_index = idx + 1
        if neighbor_index >= len(lines):
            continue
        neighbor_numbers = parse_numbers(lines[neighbor_index])
        if not neighbor_numbers:
            continue

        candidate_amount = neighbor_numbers[-1]
        score = 100
        if has_any(normalized_line, strong_total_keywords):
            score += 50
        has_decimal_point = bool(re.search(r'\d+\.\d{1,2}', lines[neighbor_index]))
        if has_decimal_point:
            score += 14
        scored_candidates.append((score, candidate_amount, neighbor_index, has_decimal_point))

    if not scored_candidates:
        return None

    scored_candidates.sort(key=lambda item: (item[0], item[3], item[1], -item[2]), reverse=True)
    return scored_candidates[0][1]


def _extract_receipt_date_from_text(raw_text: str):
    if not raw_text:
        return None

    lines = [line.strip() for line in raw_text.splitlines() if line and line.strip()]
    if not lines:
        return None

    date_pattern = re.compile(r'\b(\d{1,4})[\-/\s](\d{1,2})[\-/\s](\d{1,4})\b')
    date_pattern_with_month_name = re.compile(r'\b(\d{1,2})[\-/\s]([A-Za-z]{3,9})[\-/\s](\d{2,4})\b')
    keyword_lines = [line for line in lines if any(k in line.lower() for k in ('date', 'bill date', 'invoice date'))]
    candidates = keyword_lines + lines

    month_map = {
        'jan': 1, 'january': 1,
        'feb': 2, 'february': 2,
        'mar': 3, 'march': 3,
        'apr': 4, 'april': 4,
        'may': 5,
        'jun': 6, 'june': 6,
        'jul': 7, 'july': 7,
        'aug': 8, 'august': 8,
        'sep': 9, 'sept': 9, 'september': 9,
        'oct': 10, 'october': 10,
        'nov': 11, 'november': 11,
        'dec': 12, 'december': 12,
    }

    def normalize_year(value: int):
        if value >= 1900:
            return value
        return value + 2000 if value < 70 else value + 1900

    def to_date(parts):
        a, b, c = map(int, parts)
        attempts = []
        if a > 1900:
            attempts.append((a, b, c))
        elif c > 1900:
            attempts.append((c, b, a))
        else:
            yy = normalize_year(c)
            attempts.append((yy, b, a))

        for y, m, d in attempts:
            try:
                parsed = datetime(y, m, d).date()
                if parsed.year < 2000:
                    continue
                if parsed > timezone.now().date() + timedelta(days=400):
                    continue
                return parsed
            except ValueError:
                continue
        return None

    for line in candidates:
        for match in date_pattern.findall(line):
            parsed = to_date(match)
            if parsed:
                return parsed.isoformat()

        for day_str, month_name, year_str in date_pattern_with_month_name.findall(line):
            token = re.sub(r'[^a-z]', '', month_name.lower())
            month = month_map.get(token)
            if not month:
                closest = difflib.get_close_matches(token, list(month_map.keys()), n=1, cutoff=0.6)
                month = month_map.get(closest[0]) if closest else None
            if not month:
                continue
            try:
                day = int(day_str)
                year = normalize_year(int(year_str))
                parsed = datetime(year, month, day).date()
                if parsed.year < 2000:
                    continue
                if parsed > timezone.now().date() + timedelta(days=400):
                    continue
                return parsed.isoformat()
            except ValueError:
                continue

    return None


def _suggest_receipt_category(raw_text: str):
    text = (raw_text or '').lower()
    if any(token in text for token in ('restaurant', 'food', 'cafe', 'dine', 'kitchen', 'grocery')):
        return 'food'
    if any(token in text for token in ('electric', 'water', 'internet', 'bill', 'utility', 'recharge', 'tax invoice')):
        return 'bill'
    return 'others'


def _parse_budget_month(month_value: Optional[str]):
    if not month_value:
        now = timezone.now().date()
        return now.replace(day=1)

    raw = month_value.strip()
    if re.match(r'^\d{4}-\d{2}$', raw):
        raw = f'{raw}-01'

    try:
        parsed = datetime.strptime(raw, '%Y-%m-%d').date()
        return parsed.replace(day=1)
    except ValueError:
        raise ValueError('month must be YYYY-MM or YYYY-MM-DD')


def _create_transaction_notification(user, transaction: Transaction):
    amount = f"{transaction.amount:.2f}"
    notif_type = transaction.type if transaction.type in ('income', 'expense') else 'system'

    if notif_type == 'income':
        title = 'Income Added'
        message = f"{transaction.title} added as income for NPR {amount}."
    else:
        title = 'Expense Added'
        message = f"{transaction.title} added as expense for NPR {amount}."

    return Notification.objects.create(
        user=user,
        type=notif_type,
        title=title,
        message=message,
        month=timezone.localtime(transaction.created_at).strftime('%Y-%m') if transaction.created_at else timezone.now().strftime('%Y-%m'),
        category=transaction.category,
        amount=transaction.amount,
    )


def _category_icon(category: str):
    normalized = (category or '').strip().lower()
    icon_map = {
        'food': 'restaurant',
        'transport': 'directions-car',
        'travel': 'flight',
        'shopping': 'shopping-bag',
        'bills': 'receipt-long',
        'entertainment': 'movie',
        'health': 'local-hospital',
        'education': 'school',
        'rent': 'home',
        'utilities': 'bolt',
    }
    return icon_map.get(normalized, 'category')


def _prepare_image_variants_for_ocr(image: Any):
    gray = image.convert('L')
    gray = ImageOps.autocontrast(gray)

    width, height = gray.size
    if width < 1400:
        scale = 1400 / max(width, 1)
        gray = gray.resize((int(width * scale), int(height * scale)), Image.LANCZOS)

    denoised = gray.filter(ImageFilter.MedianFilter(size=3))
    threshold = denoised.point(lambda x: 255 if x > 165 else 0)
    return [denoised, threshold]


def _extract_ocr_text(image: Any):
    variants = _prepare_image_variants_for_ocr(image)
    configs = [
        '--oem 3 --psm 6',
        '--oem 3 --psm 11',
        '--oem 3 --psm 4',
    ]

    candidates = []
    for variant in variants:
        for config in configs:
            try:
                text = pytesseract.image_to_string(variant, config=config) or ''
                score = len(re.findall(r'\d', text)) + len(text) // 20
                candidates.append((score, text))
            except Exception:
                continue

    if not candidates:
        return ''

    candidates.sort(key=lambda item: item[0], reverse=True)
    return candidates[0][1]


class TransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def transaction_list(request):
    """
    Get list of user's transactions or create a new transaction.
    All sources (manual, SMS, scanner) are stored in Transaction table.
    """
    user = request.user

    if request.method == 'GET':
        transaction_type = request.query_params.get('type')
        category = request.query_params.get('category')

        transactions = Transaction.objects.filter(user=user)
        if transaction_type:
            transactions = transactions.filter(type=transaction_type)
        if category:
            transactions = transactions.filter(category=category)

        paginator = TransactionPagination()
        page = paginator.paginate_queryset(transactions, request)
        serializer = TransactionSerializer(page, many=True)
        return paginator.get_paginated_response({
            'success': True,
            'results': serializer.data,
        })

    serializer = TransactionCreateSerializer(data=request.data)
    if serializer.is_valid():
        transaction = serializer.save(user=user)
        _create_transaction_notification(user, transaction)
        return Response({
            'success': True,
            'message': 'Transaction created successfully',
            'transaction': TransactionSerializer(transaction).data,
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'message': 'Transaction creation failed',
        'error': serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def transaction_detail(request, pk):
    """
    Retrieve, update, or delete a transaction.
    """
    user = request.user
    try:
        transaction = Transaction.objects.get(id=pk, user=user)
    except Transaction.DoesNotExist:
        return Response({'success': False, 'message': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TransactionDetailSerializer(transaction)
        return Response({'success': True, 'transaction': serializer.data}, status=status.HTTP_200_OK)

    if request.method == 'PUT':
        serializer = TransactionCreateSerializer(transaction, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Transaction updated successfully',
                'transaction': TransactionSerializer(transaction).data,
            }, status=status.HTTP_200_OK)
        return Response({
            'success': False,
            'message': 'Update failed',
            'error': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    transaction.delete()
    return Response({'success': True, 'message': 'Transaction deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_summary(request):
    """
    Returns total income, total expenses, and net balance for the current month.
    Uses transaction created time as baseline for summary calculation.
    """
    user = request.user
    summary = get_monthly_balance(user)
    return Response({
        'success': True,
        'summary': summary,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_receipt(request, transaction_id):
    """
    Add or update a receipt for a transaction.
    """
    user = request.user
    try:
        transaction = Transaction.objects.get(id=transaction_id, user=user)
    except Transaction.DoesNotExist:
        return Response({'success': False, 'message': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        receipt = Receipt.objects.get(transaction=transaction)
        serializer = ReceiptSerializer(receipt, data=request.data, partial=True)
    except Receipt.DoesNotExist:
        serializer = ReceiptSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(transaction=transaction)
        return Response({
            'success': True,
            'message': 'Receipt uploaded successfully',
            'receipt': serializer.data,
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'message': 'Receipt upload failed',
        'error': serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_sms_metadata(request, transaction_id):
    """
    Add or update SMS metadata linked to a transaction.
    Ensures the transaction belongs to the authenticated user.
    Prevents duplicate SMS imports based on sender, message hash, and timestamp.
    """
    user = request.user
    try:
        transaction = Transaction.objects.get(id=transaction_id, user=user)
    except Transaction.DoesNotExist:
        return Response({'success': False, 'message': 'Transaction not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check for duplicate SMS (same sender + message + timestamp within ±10 seconds)
    incoming_sender = (request.data.get('sender') or '').strip()
    incoming_message = (request.data.get('message') or '').strip()
    incoming_timestamp = request.data.get('sms_timestamp')

    if incoming_sender and incoming_message and incoming_timestamp:
        try:
            sms_timestamp = timezone.datetime.fromisoformat(incoming_timestamp.replace('Z', '+00:00'))
            from django.db.models import Q
            from datetime import timedelta
            
            # Look for duplicate within ±10 seconds window
            time_window_start = sms_timestamp - timedelta(seconds=10)
            time_window_end = sms_timestamp + timedelta(seconds=10)
            
            duplicate = SMS.objects.filter(
                transaction__user=user,
                sender=incoming_sender,
                message=incoming_message,
                sms_timestamp__gte=time_window_start,
                sms_timestamp__lte=time_window_end,
            ).exclude(transaction_id=transaction_id).first()
            
            if duplicate:
                return Response({
                    'success': False,
                    'message': 'This SMS has already been imported',
                    'error': 'duplicate_sms',
                }, status=status.HTTP_409_CONFLICT)
        except (ValueError, AttributeError):
            # If timestamp parsing fails, continue without duplicate check
            pass

    try:
        sms = SMS.objects.get(transaction=transaction)
        serializer = SMSCreateSerializer(sms, data=request.data, partial=True)
    except SMS.DoesNotExist:
        serializer = SMSCreateSerializer(data=request.data)

    if serializer.is_valid():
        sms = serializer.save(transaction=transaction)
        return Response({
            'success': True,
            'message': 'SMS metadata saved successfully',
            'sms': SMSSerializer(sms).data,
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'message': 'SMS metadata save failed',
        'error': serializer.errors,
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def import_statement_pdf(request):
    """
    Upload a statement PDF (eSewa/Khalti/bank) and auto-create transactions.
    """
    user = request.user

    if PdfReader is None:
        return Response({
            'success': False,
            'message': 'PDF import dependency missing. Install pypdf in backend environment.',
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    provider = (request.data.get('provider') or 'other').strip().lower()
    statement_file = request.FILES.get('statement_file')

    if provider not in ('esewa', 'khalti', 'bank', 'other'):
        return Response({
            'success': False,
            'message': 'Invalid provider. Use one of: esewa, khalti, bank, other.',
        }, status=status.HTTP_400_BAD_REQUEST)

    if not statement_file:
        return Response({
            'success': False,
            'message': 'statement_file is required.',
        }, status=status.HTTP_400_BAD_REQUEST)

    filename = statement_file.name or ''
    if not filename.lower().endswith('.pdf'):
        return Response({
            'success': False,
            'message': 'Only PDF files are supported for statement import.',
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        reader = PdfReader(statement_file)
        pages = []
        for page in reader.pages:
            page_text = page.extract_text() or ''
            pages.append(page_text)
        full_text = '\n'.join(pages).strip()
    except Exception as exc:
        return Response({
            'success': False,
            'message': f'Could not read PDF: {str(exc)}',
        }, status=status.HTTP_400_BAD_REQUEST)

    if not full_text:
        return Response({
            'success': False,
            'message': 'No readable text found in PDF. Try another export file.',
        }, status=status.HTTP_400_BAD_REQUEST)

    extracted = _extract_transactions_from_pdf_text(full_text, provider)
    if not extracted:
        return Response({
            'success': False,
            'message': 'No transaction rows detected in this PDF.',
        }, status=status.HTTP_400_BAD_REQUEST)

    created_transactions = []
    for item in extracted[:120]:
        payload = {
            'title': item['title'],
            'category': item['category'],
            'description': item['description'],
            'amount': item['amount'],
            'type': item['type'],
            'source': 'scanner',
            'transaction_date': item['transaction_date'] or datetime.now(),
        }
        serializer = TransactionCreateSerializer(data=payload)
        if serializer.is_valid():
            transaction = serializer.save(user=user)
            _create_transaction_notification(user, transaction)
            created_transactions.append(TransactionSerializer(transaction).data)

    if not created_transactions:
        return Response({
            'success': False,
            'message': 'PDF was read but no valid transactions could be created.',
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'success': True,
        'message': f'Imported {len(created_transactions)} transactions from PDF.',
        'provider': provider,
        'created_count': len(created_transactions),
        'transactions': created_transactions,
    }, status=status.HTTP_201_CREATED)




@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def category_budget_list_create(request):
    user = request.user

    if request.method == 'GET':
        month_query = request.query_params.get('month')
        try:
            month_start = _parse_budget_month(month_query)
        except ValueError as exc:
            return Response({'success': False, 'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        budgets = CategoryBudget.objects.filter(user=user, month=month_start).order_by('category')
        serializer = CategoryBudgetSerializer(budgets, many=True)
        return Response({'success': True, 'budgets': serializer.data}, status=status.HTTP_200_OK)

    payload = request.data.copy()
    month_query = payload.get('month')
    try:
        month_start = _parse_budget_month(month_query)
    except ValueError as exc:
        return Response({'success': False, 'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    payload['month'] = month_start.isoformat()
    serializer = CategoryBudgetSerializer(data=payload)
    if serializer.is_valid():
        budget, created = CategoryBudget.objects.update_or_create(
            user=user,
            category=serializer.validated_data['category'],
            month=serializer.validated_data['month'],
            defaults={'limit_amount': serializer.validated_data['limit_amount']},
        )
        out = CategoryBudgetSerializer(budget)
        return Response(
            {
                'success': True,
                'message': 'Budget created successfully' if created else 'Budget updated successfully',
                'budget': out.data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    return Response(
        {'success': False, 'message': 'Budget save failed', 'error': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def category_budget_detail(request, budget_id):
    user = request.user
    try:
        budget = CategoryBudget.objects.get(id=budget_id, user=user)
    except CategoryBudget.DoesNotExist:
        return Response({'success': False, 'message': 'Budget not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        budget.delete()
        return Response({'success': True, 'message': 'Budget deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

    payload = request.data.copy()
    if 'month' in payload:
        try:
            payload['month'] = _parse_budget_month(payload.get('month')).isoformat()
        except ValueError as exc:
            return Response({'success': False, 'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    serializer = CategoryBudgetSerializer(budget, data=payload, partial=True)
    if serializer.is_valid():
        updated = serializer.save()
        return Response(
            {
                'success': True,
                'message': 'Budget updated successfully',
                'budget': CategoryBudgetSerializer(updated).data,
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {'success': False, 'message': 'Budget update failed', 'error': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


def _build_budget_summary(user, month_start):
    month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)

    budgets = CategoryBudget.objects.filter(user=user, month=month_start).order_by('category')
    budget_by_category = {}
    for item in budgets:
        normalized_key = (item.category or '').strip().casefold()
        if not normalized_key:
            continue
        budget_by_category[normalized_key] = item

    tx_rows = Transaction.objects.filter(
        user=user,
        type='expense',
        transaction_date__date__gte=month_start,
        transaction_date__date__lte=month_end,
    ).values('category').annotate(total_spent=Sum('amount'))

    spent_map = {}
    for row in tx_rows:
        category_key = (row.get('category') or '').strip().casefold()
        if not category_key:
            continue
        spent_map[category_key] = spent_map.get(category_key, Decimal('0')) + (row.get('total_spent') or Decimal('0'))

    total_budget = Decimal('0')
    total_spent = Decimal('0')
    category_items = []
    alerts = []

    for normalized_category, budget in budget_by_category.items():
        category = budget.category
        limit_amount = budget.limit_amount
        spent = spent_map.get(normalized_category, Decimal('0'))
        remaining = limit_amount - spent
        usage_percent = float((spent / limit_amount) * 100) if limit_amount > 0 else 0.0
        exceeded = spent > limit_amount
        near_limit = (not exceeded) and usage_percent >= 80
        exceeded_by = (spent - limit_amount) if exceeded else Decimal('0')

        alert_message = ''
        if exceeded:
            alert_message = f'Your {category} spending exceeded by {exceeded_by:.2f}'
            alerts.append(alert_message)
        elif near_limit:
            alert_message = f'Your {category} spending is near limit ({usage_percent:.1f}%)'
            alerts.append(alert_message)

        category_items.append(
            {
                'id': budget.id,
                'category': category,
                'icon': _category_icon(category),
                'month': month_start.strftime('%Y-%m'),
                'limit_amount': str(limit_amount),
                'current_spent': str(spent),
                'remaining': str(remaining),
                'usage_percent': round(usage_percent, 2),
                'near_limit': near_limit,
                'exceeded': exceeded,
                'exceeded_by': str(exceeded_by),
                'alert_message': alert_message,
            }
        )

        total_budget += limit_amount
        total_spent += spent

    total_remaining = total_budget - total_spent
    total_exceeded = abs(total_remaining) if total_remaining < 0 else Decimal('0')
    total_usage_percent = float((total_spent / total_budget) * 100) if total_budget > 0 else 0.0

    today = timezone.now().date()
    days_remaining = (month_end - today).days
    if days_remaining < 0:
        days_remaining = 0

    return {
        'month': month_start.strftime('%Y-%m'),
        'days_remaining': days_remaining,
        'total_budget': str(total_budget),
        'total_spent': str(total_spent),
        'total_remaining': str(total_remaining),
        'total_exceeded': str(total_exceeded),
        'usage_percent': round(total_usage_percent, 2),
        'exceeded_count': len([item for item in category_items if item['exceeded']]),
        'near_limit_count': len([item for item in category_items if item['near_limit']]),
        'categories': category_items,
        'alerts': alerts,
    }


def _sync_budget_alert_notifications(user, month_start):
    summary_payload = _build_budget_summary(user, month_start)
    month_label = summary_payload['month']
    alert_messages = set(summary_payload['alerts'])

    existing_rows = list(
        Notification.objects.filter(user=user, type='budget', month=month_label).order_by('-created_at')
    )
    existing_messages = {row.message for row in existing_rows}

    for message in alert_messages:
        if message in existing_messages:
            continue
        Notification.objects.create(
            user=user,
            type='budget',
            title='Budget Alert',
            message=message,
            month=month_label,
        )

    for row in existing_rows:
        if row.message not in alert_messages:
            row.delete()


def _build_transient_notification_feed(user, month_start):
    month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    month_label = month_start.strftime('%Y-%m')

    summary_payload = _build_budget_summary(user, month_start)
    items = []

    for index, alert in enumerate(summary_payload['alerts']):
        items.append(
            {
                'id': 2000000 + index,
                'type': 'budget',
                'title': 'Budget Alert',
                'message': alert,
                'month': month_label,
                'category': None,
                'amount': None,
                'is_read': False,
                'read_at': None,
                'created_at': timezone.now().isoformat(),
                'updated_at': timezone.now().isoformat(),
            }
        )

    recent_transactions = Transaction.objects.filter(
        user=user,
        created_at__date__gte=month_start,
        created_at__date__lt=month_end,
    ).order_by('-created_at')[:20]

    for transaction in recent_transactions:
        amount = f"{transaction.amount:.2f}"
        if transaction.type == 'income':
            title = 'Income Added'
            message = f"{transaction.title} added as income for NPR {amount}."
        else:
            title = 'Expense Added'
            message = f"{transaction.title} added as expense for NPR {amount}."

        items.append(
            {
                'id': 1000000 + int(transaction.id),
                'type': transaction.type,
                'title': title,
                'message': message,
                'month': transaction.created_at.strftime('%Y-%m'),
                'category': transaction.category,
                'amount': amount,
                'is_read': False,
                'read_at': None,
                'created_at': transaction.created_at.isoformat(),
                'updated_at': transaction.updated_at.isoformat(),
            }
        )

    items.sort(key=lambda item: item.get('created_at') or '', reverse=True)
    return items


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_budget_summary(request):
    user = request.user
    try:
        month_start = _parse_budget_month(request.query_params.get('month'))
    except ValueError as exc:
        return Response({'success': False, 'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    summary_payload = _build_budget_summary(user, month_start)
    serializer = BudgetSummarySerializer(data=summary_payload)
    serializer.is_valid(raise_exception=True)
    return Response({'success': True, 'summary': serializer.data}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def budget_notifications(request):
    user = request.user
    try:
        month_start = _parse_budget_month(request.query_params.get('month'))
    except ValueError as exc:
        return Response({'success': False, 'message': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        _sync_budget_alert_notifications(user, month_start)

        month_label = month_start.strftime('%Y-%m')
        notifications = Notification.objects.filter(user=user, month=month_label).order_by('-created_at')
        serialized = NotificationSerializer(notifications, many=True)
        unread_count = notifications.filter(is_read=False).count()

        items = serialized.data
    except (OperationalError, ProgrammingError):
        # If notification table is not yet migrated, still return a usable feed.
        items = _build_transient_notification_feed(user, month_start)
        unread_count = len(items)

    return Response(
        {
            'success': True,
            'count': len(items),
            'unread_count': unread_count,
            'notifications': items,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    user = request.user
    try:
        notification = Notification.objects.get(id=notification_id, user=user)
    except Notification.DoesNotExist:
        return Response({'success': False, 'message': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at', 'updated_at'])

    return Response(
        {
            'success': True,
            'message': 'Notification marked as read',
            'notification': NotificationSerializer(notification).data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    user = request.user
    try:
        notification = Notification.objects.get(id=notification_id, user=user)
    except Notification.DoesNotExist:
        return Response({'success': False, 'message': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

    notification.delete()
    return Response({'success': True, 'message': 'Notification deleted'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def scan_receipt_ocr(request):
    """
    Extract amount and basic metadata from a receipt image using OCR.
    """
    image_file = request.FILES.get('receipt_image')
    title_hint = (request.data.get('title_hint') or '').strip()

    if not image_file:
        return Response(
            {'success': False, 'message': 'receipt_image is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if pytesseract is None:
        return Response(
            {
                'success': False,
                'message': 'OCR engine is not installed on server. Install pytesseract and Tesseract binary.',
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )

    # Resolve Tesseract executable dynamically for long-running dev servers.
    configured_cmd = os.environ.get('TESSERACT_CMD')
    default_windows_tesseract = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    detected_cmd = configured_cmd or (
        default_windows_tesseract if os.path.exists(default_windows_tesseract) else shutil.which('tesseract')
    )
    if detected_cmd:
        pytesseract.pytesseract.tesseract_cmd = detected_cmd
    else:
        return Response(
            {
                'success': False,
                'message': 'Tesseract binary not found. Install Tesseract OCR or set TESSERACT_CMD environment variable.',
            },
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )

    temp_file_path = None
    try:
        file_extension = os.path.splitext(image_file.name or '')[1] or '.jpg'
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            for chunk in image_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        pipeline_result = process_receipt(temp_file_path)
        extracted_text = pipeline_result.get('raw_text') or ''
        normalized_text = pipeline_result.get('normalized_text') or ''
        ocr_debug = pipeline_result.get('debug') or {}
        amount_value = pipeline_result.get('amount')
        amount = Decimal(str(amount_value)).quantize(Decimal('0.01')) if amount_value is not None else None
    except Exception as exc:
        return Response(
            {'success': False, 'message': f'Failed to process image for OCR: {str(exc)}'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass

    if not amount:
        return Response(
            {
                'success': False,
                'message': 'Could not detect amount from image. Try a clearer receipt image.',
                'ocr_text_preview': extracted_text[:300],
                'ocr_debug': ocr_debug,
            },
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    lines = [line.strip() for line in extracted_text.splitlines() if line and line.strip()]
    suggested_title = title_hint or (lines[0][:90] if lines else 'Scanned Receipt')
    suggested_category = _suggest_receipt_category(extracted_text)
    suggested_date = _extract_receipt_date_from_text(extracted_text)

    return Response(
        {
            'success': True,
            'message': 'OCR parsed successfully.',
            'result': {
                'title': suggested_title,
                'amount': str(amount),
                'category': suggested_category,
                'transaction_date': suggested_date,
                'description': f'OCR scan result: {suggested_title}',
                'ocr_text_preview': extracted_text[:500],
                'normalized_text_preview': normalized_text[:500],
                'ocr_debug': ocr_debug,
            },
        },
        status=status.HTTP_200_OK,
    )
