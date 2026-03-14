from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.list_plans, name='billing-plans'),
    path('my-subscription/', views.my_subscription, name='my-subscription'),
    # Razorpay
    path('razorpay/create-order/', views.razorpay_create_order, name='razorpay-create-order'),
    path('razorpay/verify/', views.razorpay_verify_payment, name='razorpay-verify'),
    # Stripe
    path('stripe/create-checkout/', views.stripe_create_checkout, name='stripe-create-checkout'),
    path('stripe/webhook/', views.stripe_webhook, name='stripe-webhook'),
]
