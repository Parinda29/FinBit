#!/usr/bin/env python
"""
Standalone test script for SMS parser and format validation.
Run: python test_sms_parser.py
"""

import sys
import json
from datetime import datetime

# Test SMS parsing logic (replicating frontend parser in Python for validation)

TEST_SMS_MESSAGES = [
    {
        "address": "+977-9841234567",
        "body": "Shinhan Bank: Your ac xxxxxxx2345 debited for Rs.5,250.00 on 2026-03-24 14:30:00 via UPI transfer to user@bank. Avl Bal: Rs.45,820.05",
        "date": 1743035400000,
        "_id": 1,
        "expected_type": "expense",
        "expected_amount": 5250.00,
    },
    {
        "address": "+977SALARY",
        "body": "Congratulations! Your salary of NPR 35,000.00 has been credited to your account on 2026-03-24. Thank you!",
        "date": 1743035400000,
        "_id": 2,
        "expected_type": "income",
        "expected_amount": 35000.00,
    },
    {
        "address": "+977-EBANK",
        "body": "Payment of Rs. 1,250 received from Khalti wallet for subscription. Txn ID: KL123456",
        "date": 1743035400000,
        "_id": 3,
        "expected_type": "expense",
        "expected_amount": 1250.00,
    },
    {
        "address": "+977-ESEWA",
        "body": "You received INR 500 from Purchase refund. Balance: INR 2,450.33",
        "date": 1743035400000,
        "_id": 4,
        "expected_type": "income",
        "expected_amount": 500.00,
    },
]

FINANCE_KEYWORDS = [
    'credited', 'debited', 'withdrawn', 'deposit', 'txn', 'transaction',
    'payment', 'purchase', 'spent', 'received', 'salary', 'a/c', 'bank',
    'wallet', 'upi', 'avl bal', 'balance', 'atm', 'transfer', 'sent', 'dr', 'cr',
]

INCOME_HINTS = ['credited', 'deposit', 'salary', 'received', 'refund', 'cashback', 'cr']
EXPENSE_HINTS = ['debited', 'withdrawn', 'purchase', 'payment', 'spent', 'dr', 'sent', 'charged', 'bill', 'emi']


def extract_amount(body):
    """Extract amount from SMS body."""
    currency_amount_regex = r'(?:rs\.?|npr|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)'
    import re
    match = re.search(currency_amount_regex, body, re.IGNORECASE)
    
    if match:
        cleaned = match.group(1).replace(',', '')
        try:
            return float(cleaned)
        except ValueError:
            return None
    
    return None


def is_finance_sms(body):
    """Check if SMS is finance-related."""
    lower_body = body.lower()
    has_keyword = any(word in lower_body for word in FINANCE_KEYWORDS)
    has_amount = bool(extract_amount(body))
    return has_keyword or has_amount


def infer_type(body):
    """Infer transaction type from SMS body."""
    lower_body = body.lower()
    # Refund/cashback semantics should override expense keywords like purchase.
    if any(hint in lower_body for hint in ('refund', 'cashback')):
        return 'income'
    if any(hint in lower_body for hint in EXPENSE_HINTS):
        return 'expense'
    if any(hint in lower_body for hint in INCOME_HINTS):
        return 'income'
    return 'expense'


def test_sms_parsing():
    """Test SMS parsing against known test cases."""
    print("\n" + "="*70)
    print("SMS PARSER VALIDATION TEST")
    print("="*70)
    
    passed = 0
    failed = 0
    
    for idx, sms in enumerate(TEST_SMS_MESSAGES, 1):
        print(f"\n[Test {idx}] From: {sms['address']}")
        print(f"         Message: {sms['body'][:60]}...")
        
        # Test finance detection
        is_finance = is_finance_sms(sms['body'])
        print(f"         ✓ Finance SMS: {is_finance}")
        
        if not is_finance:
            print(f"         ✗ FAILED: Should be detected as finance SMS")
            failed += 1
            continue
        
        # Test amount extraction
        amount = extract_amount(sms['body'])
        expected_amount = sms['expected_amount']
        
        if amount == expected_amount:
            print(f"         ✓ Amount: Rs/NPR/INR {amount} (expected {expected_amount})")
            passed += 1
        else:
            print(f"         ✗ FAILED: Amount {amount} ≠ expected {expected_amount}")
            failed += 1
            continue
        
        # Test type inference
        inferred_type = infer_type(sms['body'])
        expected_type = sms['expected_type']
        
        if inferred_type == expected_type:
            print(f"         ✓ Type: {inferred_type} (expected {expected_type})")
            passed += 1
        else:
            print(f"         ✗ FAILED: Type {inferred_type} ≠ expected {expected_type}")
            failed += 1
    
    print("\n" + "="*70)
    print(f"RESULTS: {passed} passed | {failed} failed out of {len(TEST_SMS_MESSAGES) * 3} tests")
    print("="*70 + "\n")
    
    return failed == 0


if __name__ == '__main__':
    success = test_sms_parsing()
    sys.exit(0 if success else 1)
