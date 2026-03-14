from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('email_verified', True)
        return self.create_user(email, password, **extra_fields)


class Organization(models.Model):
    PLAN_CHOICES = [
        ('free', 'Free Trial'),
        ('starter', 'Starter'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='free')
    max_users = models.IntegerField(default=3)
    is_active = models.BooleanField(default=True)
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    is_trial_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_trial_expired(self):
        from django.utils import timezone
        if self.plan != 'free' or not self.trial_end:
            return False
        return timezone.now() >= self.trial_end

    @property
    def trial_days_remaining(self):
        from django.utils import timezone
        if not self.trial_end:
            return 0
        remaining = (self.trial_end - timezone.now()).total_seconds()
        return max(0, remaining / 86400)

    def __str__(self):
        return f"{self.name} ({self.plan})"

    class Meta:
        ordering = ['-created_at']


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('super_owner', 'Super Owner'),
        ('sub_agent', 'Sub Agent'),
        ('admin', 'Platform Admin'),
        ('org_admin', 'Org Admin'),
        ('user', 'User'),
        ('brand', 'Brand'),
        ('factory', 'Factory'),
        ('third_party', '3rd Party'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    organization = models.ForeignKey(
        Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='members'
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=64, blank=True)
    password_reset_token = models.CharField(max_length=64, blank=True)
    avatar_url = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    department = models.ForeignKey(
        'workflow.Department', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='members'
    )
    last_login_at = models.DateTimeField(null=True, blank=True)
    notification_preferences = models.JSONField(
        default=dict, blank=True,
        help_text="Per-user notification toggle preferences"
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

    class Meta:
        ordering = ['-created_at']


# Import founder models so Django discovers them for migrations
from .founder_models import AgentAssignment, FounderActionLog  # noqa: E402, F401
