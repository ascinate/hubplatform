from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, PaymentRecord


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'slug', 'description', 'price_inr', 'price_usd',
                  'interval', 'max_users', 'features', 'sort_order']


class PaymentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentRecord
        fields = ['id', 'gateway', 'amount', 'currency', 'status', 'created_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = SubscriptionPlanSerializer(read_only=True)
    payments = PaymentRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'status', 'gateway', 'current_period_start',
                  'current_period_end', 'trial_end', 'created_at', 'payments']
