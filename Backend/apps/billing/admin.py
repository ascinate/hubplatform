from django.contrib import admin
from .models import SubscriptionPlan, Subscription, PaymentRecord


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'interval', 'price_inr', 'price_usd', 'max_users', 'is_active', 'sort_order']
    list_filter = ['interval', 'is_active']
    ordering = ['sort_order']
    prepopulated_fields = {'slug': ('name',)}


class PaymentRecordInline(admin.TabularInline):
    model = PaymentRecord
    extra = 0
    readonly_fields = ['gateway', 'gateway_payment_id', 'amount', 'currency', 'status', 'created_at']
    can_delete = False


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['organization', 'plan', 'status', 'gateway',
                    'current_period_end', 'created_at']
    list_filter = ['status', 'gateway', 'plan']
    search_fields = ['organization__name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [PaymentRecordInline]
