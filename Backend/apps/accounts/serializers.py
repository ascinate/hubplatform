from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Organization


class OrganizationSerializer(serializers.ModelSerializer):
    trial_days_remaining = serializers.SerializerMethodField()
    is_trial_expired = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'plan', 'max_users', 'trial_start',
                  'trial_end', 'is_trial_locked', 'trial_days_remaining',
                  'is_trial_expired', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_trial_days_remaining(self, obj):
        return round(obj.trial_days_remaining, 2) if obj.trial_end else None

    def get_is_trial_expired(self, obj):
        return obj.is_trial_expired


class UserSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'organization',
                  'avatar_url', 'email_verified', 'created_at', 'last_login_at']
        read_only_fields = ['id', 'email', 'role', 'email_verified', 'created_at', 'last_login_at']


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    full_name = serializers.CharField(max_length=255)
    company_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        company_name = validated_data.pop('company_name', '')
        org = None
        if company_name:
            from django.utils.text import slugify
            slug = slugify(company_name)
            # Ensure unique slug
            base_slug = slug
            counter = 1
            while Organization.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            org = Organization.objects.create(name=company_name, slug=slug)

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
            organization=org,
            is_active=True,
            email_verified=True,  # Skip email verification for now; enable when email is configured
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').lower()
        password = data.get('password', '')
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
