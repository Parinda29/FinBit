from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import User, AuthToken
from .serializers import (
    UserSerializer, 
    UserCreateSerializer, 
    LoginSerializer, 
    ChangePasswordSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user account.
    
    Expected payload:
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "securepassword123"
    }
    
    Returns a token-auth response.
    """
    if request.method == 'POST':
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate or get token for the new user
            token = AuthToken.objects.filter(user=user).first()
            if token is None:
                token = AuthToken.objects.create(user=user)
            
            return Response({
                'success': True,
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'access': token.key,
                'token_type': 'Token',
            }, status=status.HTTP_201_CREATED)
        else:
            first_error = 'Invalid data'
            for field, errors in serializer.errors.items():
                if errors:
                    first_error = f"{field}: {errors[0]}"
                    break
            
            return Response({
                'success': False,
                'message': 'Registration failed',
                'error': first_error,
                'errors': serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate user and return access token.
    
    Expected payload accepts either `email` or `username` with `password`.
    
    Returns a token-auth response.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generate or get token for the user
        token = AuthToken.objects.filter(user=user).first()
        if token is None:
            token = AuthToken.objects.create(user=user)
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'access': token.key,
            'token_type': 'Token',
        }, status=status.HTTP_200_OK)
    else:
        # Extract error message safely
        error_msg = 'Invalid credentials'
        if serializer.errors:
            if 'non_field_errors' in serializer.errors:
                error_msg = str(serializer.errors['non_field_errors'][0]) if serializer.errors['non_field_errors'] else error_msg
            else:
                # Get first error from any field
                for field, errors in serializer.errors.items():
                    if errors:
                        error_msg = str(errors[0])
                        break
        
        return Response({
            'success': False,
            'message': 'Login failed',
            'error': error_msg,
            'errors': serializer.errors,
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_detail(request):
    """
    Get or update authenticated user profile.
    
    GET returns:
    {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
    
    PUT accepts:
    {
        "name": "Jane Doe",
        "email": "jane@example.com"
    }
    """
    user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response({
            'success': True,
            'user': serializer.data
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'user': serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'Update failed',
                'error': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change authenticated user's password.
    
    Expected payload:
    {
        "old_password": "oldpassword123",
        "new_password": "newpassword123"
    }
    """
    if request.method == 'POST':
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'message': 'Password change failed',
                'error': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user by deleting their token.
    """
    if request.method == 'POST':
        token = AuthToken.objects.filter(user=request.user).first()
        if token is None:
            return Response({
                'success': False,
                'message': 'Token not found'
            }, status=status.HTTP_400_BAD_REQUEST)

        token.delete()
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
