"""End-to-end API tests for SMS transaction import flow."""

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient

from users.models import AuthToken
from transactions.models import SMS, Transaction


class TestSMSImportAPI(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            email='test@test.com',
            password='testpass123',
            name='Test User',
        )
        self.token = AuthToken.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_unauthenticated_request_rejected(self):
        """Verify unauthenticated requests are rejected with 403."""
        unauth_client = APIClient()
        sms_transaction_data = {
            'title': 'Test',
            'category': 'Test',
            'description': 'Test',
            'amount': '100.00',
            'type': 'expense',
            'source': 'sms',
            'transaction_date': '2026-03-24T14:30:00Z',
        }
        response = unauth_client.post('/api/transactions/', data=sms_transaction_data, format='json')
        self.assertEqual(response.status_code, 403)

    def test_create_sms_transaction_and_save_sms_metadata(self):
        sms_transaction_data = {
            'title': 'EseWa Payment',
            'category': 'Digital Wallet',
            'description': 'Payment of Rs. 1,250 received from Khalti wallet for subscription. Txn ID: KL123456',
            'amount': '1250.00',
            'type': 'expense',
            'source': 'sms',
            'transaction_date': '2026-03-24T14:30:00Z',
        }

        create_response = self.client.post('/api/transactions/', data=sms_transaction_data, format='json')
        self.assertEqual(create_response.status_code, 201)
        self.assertTrue(create_response.data.get('success'))

        transaction_id = create_response.data.get('transaction', {}).get('id')
        self.assertIsNotNone(transaction_id)

        sms_metadata = {
            'message': sms_transaction_data['description'],
            'sender': '+977-ESEWA',
            'sms_timestamp': sms_transaction_data['transaction_date'],
        }

        sms_response = self.client.post(
            f'/api/transactions/{transaction_id}/sms/',
            data=sms_metadata,
            format='json',
        )
        self.assertEqual(sms_response.status_code, 201)
        self.assertTrue(sms_response.data.get('success'))

        transaction = Transaction.objects.get(id=transaction_id, user=self.user)
        sms = SMS.objects.get(transaction=transaction)
        self.assertEqual(str(transaction.amount), '1250.00')
        self.assertEqual(transaction.type, 'expense')
        self.assertEqual(transaction.source, 'sms')
        self.assertEqual(sms.sender, '+977-ESEWA')
        self.assertIn('Khalti wallet', sms.message)

    def test_sms_metadata_endpoint_requires_authentication(self):
        """Verify SMS metadata endpoint enforces authentication."""
        unauth_client = APIClient()
        
        sms_metadata = {
            'message': 'Test SMS',
            'sender': '+977-TEST',
            'sms_timestamp': '2026-03-24T14:30:00Z',
        }
        
        response = unauth_client.post(
            '/api/transactions/999/sms/',
            data=sms_metadata,
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_duplicate_sms_detection(self):
        """Verify that duplicate SMS from same sender/message/timestamp is rejected."""
        sms_transaction_data = {
            'title': 'First Import',
            'category': 'Test',
            'description': 'Payment of Rs. 500',
            'amount': '500.00',
            'type': 'expense',
            'source': 'sms',
            'transaction_date': '2026-03-24T14:30:00Z',
        }

        # Create first transaction with SMS metadata
        response1 = self.client.post('/api/transactions/', data=sms_transaction_data, format='json')
        self.assertEqual(response1.status_code, 201)
        trans_id_1 = response1.data['transaction']['id']

        sms_metadata = {
            'message': 'Exact same message about payment',
            'sender': '+977-BANK',
            'sms_timestamp': '2026-03-24T14:30:00Z',
        }

        sms_response1 = self.client.post(f'/api/transactions/{trans_id_1}/sms/', data=sms_metadata, format='json')
        self.assertEqual(sms_response1.status_code, 201)

        # Create second transaction and try to save identical SMS metadata - should be rejected
        response2 = self.client.post('/api/transactions/', data=sms_transaction_data, format='json')
        self.assertEqual(response2.status_code, 201)
        trans_id_2 = response2.data['transaction']['id']

        sms_response2 = self.client.post(f'/api/transactions/{trans_id_2}/sms/', data=sms_metadata, format='json')
        self.assertEqual(sms_response2.status_code, 409)
        self.assertEqual(sms_response2.data.get('error'), 'duplicate_sms')

