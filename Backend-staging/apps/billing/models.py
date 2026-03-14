from django.db import models
from django.conf import settings
import uuid


class SubscriptionPlan(models.Model):
    CURRENCY_CHOICES = [('INR', 'Indian Rupee'), ('USD', 'US Dollar')]
    INTERVAL_CHOICES = [('monthly', 'Monthly'), ('yearly', 'Yearly')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)  # Starter, Professional, Enterprise
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price_inr = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_usd = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    interval = models.CharField(max_length=10, choices=INTERVAL_CHOICES, default='monthly')
    max_users = models.IntegerField(default=3)
    features = models.JSONField(default=list)  # List of feature strings
    razorpay_plan_id = models.CharField(max_length=100, blank=True)
    stripe_price_id = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.interval})"

    class Meta:
        ordering = ['sort_order']


class Subscription(models.Model):
    STATUS_CHOICES = [
        ('trialing', 'Trial'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    GATEWAY_CHOICES = [('razorpay', 'Razorpay'), ('stripe', 'Stripe'), ('manual', 'Manual')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        'accounts.Organization', on_delete=models.CASCADE, related_name='subscription'
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trialing')
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES, default='manual')
    gateway_subscription_id = models.CharField(max_length=200, blank=True)
    gateway_customer_id = models.CharField(max_length=200, blank=True)
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.organization.name} — {self.plan} ({self.status})"

    class Meta:
        ordering = ['-created_at']


class PaymentRecord(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='payments')
    gateway = models.CharField(max_length=20)
    gateway_payment_id = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.gateway} — {self.amount} {self.currency} ({self.status})"

    class Meta:
        ordering = ['-created_at']
