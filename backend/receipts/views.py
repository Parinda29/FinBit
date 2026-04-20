from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from transactions.models import Receipt, Transaction
from transactions.serializers import ReceiptSerializer, ReceiptListSerializer
from .models import ReceiptCapture
from .serializers import ReceiptCaptureSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def receipt_list(request):
    """
    List all receipts for the authenticated user with transaction summary info.
    """
    receipts = Receipt.objects.filter(transaction__user=request.user).select_related('transaction')
    serializer = ReceiptListSerializer(receipts, many=True, context={'request': request})
    return Response(
        {
            'success': True,
            'count': len(serializer.data),
            'receipts': serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def receipt_detail(request, transaction_id):
    """
    Manage receipt for a transaction.
    
    GET: Get receipt details
    POST: Create receipt for transaction
    PUT: Update receipt
    DELETE: Delete receipt
    """
    user = request.user
    
    try:
        transaction = Transaction.objects.get(id=transaction_id, user=user)
    except Transaction.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Transaction not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        try:
            receipt = Receipt.objects.get(transaction=transaction)
            serializer = ReceiptSerializer(receipt, context={'request': request})
            return Response({
                'success': True,
                'receipt': serializer.data
            }, status=status.HTTP_200_OK)
        except Receipt.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Receipt not found'
            }, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'POST':
        try:
            receipt = Receipt.objects.get(transaction=transaction)
            return Response({
                'success': False,
                'message': 'Receipt already exists for this transaction'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Receipt.DoesNotExist:
            serializer = ReceiptSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(transaction=transaction)
                return Response({
                    'success': True,
                    'message': 'Receipt created successfully',
                    'receipt': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'success': False,
                    'message': 'Receipt creation failed',
                    'error': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'PUT':
        try:
            receipt = Receipt.objects.get(transaction=transaction)
            serializer = ReceiptSerializer(
                receipt,
                data=request.data,
                partial=True,
                context={'request': request},
            )
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'success': True,
                    'message': 'Receipt updated successfully',
                    'receipt': serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': 'Update failed',
                    'error': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Receipt.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Receipt not found'
            }, status=status.HTTP_404_NOT_FOUND)

    elif request.method == 'DELETE':
        try:
            receipt = Receipt.objects.get(transaction=transaction)
            receipt.delete()
            return Response({
                'success': True,
                'message': 'Receipt deleted successfully'
            }, status=status.HTTP_204_NO_CONTENT)
        except Receipt.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Receipt not found'
            }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def receipt_capture_list_create(request):
    """
    Standalone receipt captures not linked to transactions.

    GET: list authenticated user's receipt captures
    POST: save a new captured/uploaded receipt image
    """
    user = request.user

    if request.method == 'GET':
        captures = ReceiptCapture.objects.filter(user=user)
        serializer = ReceiptCaptureSerializer(captures, many=True, context={'request': request})
        return Response(
            {
                'success': True,
                'count': len(serializer.data),
                'captures': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    serializer = ReceiptCaptureSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        transaction = None
        transaction_warning = None
        transaction_id = request.data.get('transaction')
        if transaction_id:
            try:
                transaction = Transaction.objects.get(id=transaction_id, user=user)
            except Transaction.DoesNotExist:
                transaction_warning = 'Transaction link was not applied because the selected transaction was invalid.'

        capture = serializer.save(user=user, transaction=transaction)

        linked_receipt = False
        if transaction is not None and capture.image:
            try:
                Receipt.objects.update_or_create(
                    transaction=transaction,
                    defaults={'receipt_image': capture.image},
                )
                linked_receipt = True
            except Exception:
                linked_receipt = False

        return Response(
            {
                'success': True,
                'message': 'Receipt image saved successfully',
                'capture': ReceiptCaptureSerializer(capture, context={'request': request}).data,
                'warning': transaction_warning,
                'linked_to_transaction_receipt': linked_receipt,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        {
            'success': False,
            'message': 'Failed to save receipt image',
            'error': serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def receipt_capture_detail(request, capture_id):
    """
    Retrieve or delete a standalone receipt capture.
    """
    user = request.user
    try:
        capture = ReceiptCapture.objects.get(id=capture_id, user=user)
    except ReceiptCapture.DoesNotExist:
        return Response({'success': False, 'message': 'Receipt capture not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ReceiptCaptureSerializer(capture, context={'request': request})
        return Response({'success': True, 'capture': serializer.data}, status=status.HTTP_200_OK)

    capture.delete()
    return Response({'success': True, 'message': 'Receipt capture deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
