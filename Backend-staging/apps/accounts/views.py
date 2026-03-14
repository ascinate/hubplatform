from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings as django_settings
from datetime import timedelta
import secrets

from .models import User, Organization
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
)
from .emails import send_welcome_email, send_password_reset_email


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.save()
    tokens = get_tokens_for_user(user)
    # Send welcome email (non-blocking — failure won't break registration)
    try:
        send_welcome_email(user)
    except Exception:
        pass
    return Response({
        'message': 'Account created successfully.',
        'user': UserSerializer(user).data,
        **tokens,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data['user']

    # Check trial expiry
    org = user.organization
    if org and org.plan == 'free' and org.is_trial_expired:
        if not org.is_trial_locked:
            org.is_trial_locked = True
            org.save(update_fields=['is_trial_locked'])
        return Response({
            'error': 'Your 21-day free trial has expired. Your data is safe — please upgrade to a paid plan to continue.',
            'trial_expired': True,
        }, status=status.HTTP_403_FORBIDDEN)

    user.last_login_at = timezone.now()
    user.save(update_fields=['last_login_at'])

    tokens = get_tokens_for_user(user)
    return Response({
        'message': 'Login successful.',
        'user': UserSerializer(user).data,
        **tokens,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except TokenError:
        pass
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    # PATCH — update profile
    allowed_fields = ['full_name']
    data = {k: v for k, v in request.data.items() if k in allowed_fields}
    for field, value in data.items():
        setattr(request.user, field, value)
    request.user.save(update_fields=list(data.keys()))
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email'].lower()
    try:
        user = User.objects.get(email=email)
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.save(update_fields=['password_reset_token'])
        try:
            send_password_reset_email(user, token)
        except Exception:
            pass
    except User.DoesNotExist:
        pass  # Don't reveal if email exists

    return Response({
        'message': 'If an account with that email exists, a reset link has been sent.'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']

    try:
        user = User.objects.get(password_reset_token=token)
        user.set_password(new_password)
        user.password_reset_token = ''
        user.save(update_fields=['password', 'password_reset_token'])
        return Response({'message': 'Password reset successful.'})
    except User.DoesNotExist:
        return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if not request.user.check_password(serializer.validated_data['current_password']):
        return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(serializer.validated_data['new_password'])
    request.user.save(update_fields=['password'])
    return Response({'message': 'Password changed successfully.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def free_trial_signup(request):
    """Create a free trial account with 21-day access."""
    email = request.data.get('email', '').strip().lower()
    full_name = request.data.get('full_name', '').strip()
    company_name = request.data.get('company_name', '').strip()
    password = request.data.get('password', '').strip()

    if not all([email, full_name, password]):
        return Response({'error': 'Email, full name, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(password) < 8:
        return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create organization with 21-day trial
    from django.utils.text import slugify
    slug = slugify(company_name or full_name)
    base_slug = slug or 'trial'
    counter = 1
    while Organization.objects.filter(slug=slug).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    now = timezone.now()
    org = Organization.objects.create(
        name=company_name or f"{full_name}'s Workspace",
        slug=slug,
        plan='free',
        trial_start=now,
        trial_end=now + timedelta(days=21),
        is_trial_locked=False,
    )

    user = User.objects.create_user(
        email=email,
        password=password,
        full_name=full_name,
        organization=org,
        role='org_admin',
        is_active=True,
        email_verified=True,
    )

    # Send email notification to SankalpHub admin
    try:
        subject = f"New Free Trial Signup: {full_name} ({company_name})"
        body = (
            f"New free trial user registered on SankalpHub:\n\n"
            f"Name: {full_name}\n"
            f"Email: {email}\n"
            f"Company: {company_name or 'N/A'}\n"
            f"Trial Start: {now.strftime('%Y-%m-%d %H:%M')}\n"
            f"Trial End: {(now + timedelta(days=21)).strftime('%Y-%m-%d %H:%M')}\n\n"
            f"Please grant access within 24 hours.\n\n"
            f"---\nSankalpHub Trial Notification"
        )
        send_mail(
            subject,
            body,
            django_settings.DEFAULT_FROM_EMAIL,
            [django_settings.EMAIL_HOST_USER],
            fail_silently=True,
        )
    except Exception:
        pass

    # Send welcome email to user
    try:
        send_welcome_email(user)
    except Exception:
        pass

    tokens = get_tokens_for_user(user)
    return Response({
        'message': 'Free trial activated! You have 21 days of full access.',
        'user': UserSerializer(user).data,
        'trial_end': org.trial_end.isoformat(),
        **tokens,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def notification_preferences(request):
    if request.method == 'GET':
        from apps.tasks.services import DEFAULT_NOTIFICATION_PREFERENCES
        prefs = request.user.notification_preferences or {}
        merged = {**DEFAULT_NOTIFICATION_PREFERENCES, **prefs}
        return Response(merged)

    # PATCH
    request.user.notification_preferences = request.data
    request.user.save(update_fields=['notification_preferences'])
    return Response({'success': True, 'preferences': request.data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    """List org members for task assignment dropdowns."""
    qs = User.objects.filter(organization=request.user.organization, is_active=True)
    data = [
        {'id': str(u.id), 'full_name': u.full_name, 'email': u.email, 'role': u.role}
        for u in qs
    ]
    return Response(data)
