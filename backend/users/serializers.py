from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - used for user detail representation.
    """
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new user account.
    """
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password']
        read_only_fields = ['id']
    
    def create(self, validated_data):
        """
        Create a new user instance.
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name']
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login - accepts email and password.
    """
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, min_length=6)
    
    def validate(self, data):
        """
        Validate credentials and return authenticated user.
        """
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        
        identifier = (email or username or '').strip()

        if not identifier or not password:
            raise serializers.ValidationError(
                "Email/username and password are required."
            )

        # Accept either `email` or `username` from client input.
        login_kwargs = {
            'email': identifier,
            'password': password,
        }
        user = authenticate(**login_kwargs)

        if user is None:
            # Fallback for payloads that send a username-like value.
            possible_user = User.objects.filter(
                Q(email__iexact=identifier) | Q(name__iexact=identifier)
            ).first()
            if possible_user:
                user = authenticate(email=possible_user.email, password=password)

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account is inactive."
            )
        
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    """
    old_password = serializers.CharField(write_only=True, min_length=6)
    new_password = serializers.CharField(write_only=True, min_length=6)
    
    def validate_old_password(self, value):
        """
        Validate that old password is correct.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                "Old password is incorrect."
            )
        return value
    
    def validate(self, data):
        """
        Ensure new password is different from old password.
        """
        if data.get('old_password') == data.get('new_password'):
            raise serializers.ValidationError(
                "New password must be different from old password."
            )
        return data
    
    def save(self, **kwargs):
        """
        Save the new password.
        """
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
