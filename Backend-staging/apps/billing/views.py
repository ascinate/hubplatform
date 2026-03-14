import hmac
import hashlib
import json
from rest_framework import status
from apps.accounts.emails import send_payment_receipt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from datetime import timedelta

from .models import SubscriptionPlan, Subscription, PaymentRecord
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def list_plans(request):
    plans = SubscriptionPlan.objects.filter(is_active=True)
    serializer = SubscriptionPlanSerializer(plans, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_subscription(request):
    org = request.user.organization
    if not org:
        return Response({'error': 'No organization found.'}, status=400)
    try:
        sub = org.subscription
        return Response(SubscriptionSerializer(sub).data)
    except Subscription.DoesNotExist:
        return Response({'status': 'none', 'plan': None})


# ---------- Razorpay ----------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def razorpay_create_order(request):
    plan_slug = request.data.get('plan_slug')
    try:
        plan = SubscriptionPlan.objects.get(slug=plan_slug, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=404)

    if not settings.RAZORPAY_KEY_ID or settings.RAZORPAY_KEY_ID == 'rzp_test_placeholder':
        return Response({'error': 'Razorpay is not configured yet.'}, status=503)

    try:
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        amount_paise = int(plan.price_inr * 100)
        order = client.order.create({
            'amount': amount_paise,
            'currency': 'INR',
            'notes': {
                'plan_slug': plan.slug,
                'org_id': str(request.user.organization.id),
                'user_id': str(request.user.id),
            }
        })
        return Response({
            'order_id': order['id'],
            'amount': amount_paise,
            'currency': 'INR',
            'key': settings.RAZORPAY_KEY_ID,
            'plan_name': plan.name,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def razorpay_verify_payment(request):
    razorpay_order_id = request.data.get('razorpay_order_id')
    razorpay_payment_id = request.data.get('razorpay_payment_id')
    razorpay_signature = request.data.get('razorpay_signature')
    plan_slug = request.data.get('plan_slug')

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return Response({'error': 'Missing payment details.'}, status=400)

    # Verify signature
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, razorpay_signature):
        return Response({'error': 'Invalid payment signature.'}, status=400)

    # Activate subscription
    try:
        plan = SubscriptionPlan.objects.get(slug=plan_slug)
        org = request.user.organization
        sub, _ = Subscription.objects.get_or_create(organization=org)
        sub.plan = plan
        sub.status = 'active'
        sub.gateway = 'razorpay'
        sub.gateway_payment_id = razorpay_payment_id
        sub.current_period_start = timezone.now()
        sub.current_period_end = timezone.now() + timedelta(days=30)
        sub.save()

        # Update org plan
        org.plan = plan.slug.split('-')[0]  # starter, professional, etc.
        org.max_users = plan.max_users
        org.save()

        PaymentRecord.objects.create(
            subscription=sub,
            gateway='razorpay',
            gateway_payment_id=razorpay_payment_id,
            amount=plan.price_inr,
            currency='INR',
            status='success',
        )
        # Send payment receipt email
        try:
            send_payment_receipt(
                user=request.user,
                plan_name=plan.name,
                amount=plan.price_inr,
                currency='INR',
                payment_id=razorpay_payment_id,
            )
        except Exception:
            pass
        return Response({'message': 'Payment successful. Subscription activated!'})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ---------- Stripe ----------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stripe_create_checkout(request):
    plan_slug = request.data.get('plan_slug')
    try:
        plan = SubscriptionPlan.objects.get(slug=plan_slug, is_active=True)
    except SubscriptionPlan.DoesNotExist:
        return Response({'error': 'Plan not found.'}, status=404)

    if not settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY == 'sk_test_placeholder':
        return Response({'error': 'Stripe is not configured yet.'}, status=503)

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': plan.stripe_price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/billing.html?stripe_success=1",
            cancel_url=f"{settings.FRONTEND_URL}/pricing.html",
            metadata={
                'plan_slug': plan.slug,
                'org_id': str(request.user.organization.id),
                'user_id': str(request.user.id),
            }
        )
        return Response({'checkout_url': session.url})
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    if not settings.STRIPE_WEBHOOK_SECRET or settings.STRIPE_WEBHOOK_SECRET == 'whsec_placeholder':
        return Response({'error': 'Stripe webhook not configured.'}, status=503)

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        event = stripe.Webhook.construct_event(
            request.body, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            org_id = session['metadata'].get('org_id')
            plan_slug = session['metadata'].get('plan_slug')

            from apps.accounts.models import Organization
            org = Organization.objects.get(id=org_id)
            plan = SubscriptionPlan.objects.get(slug=plan_slug)

            sub, _ = Subscription.objects.get_or_create(organization=org)
            sub.plan = plan
            sub.status = 'active'
            sub.gateway = 'stripe'
            sub.gateway_subscription_id = session.get('subscription', '')
            sub.gateway_customer_id = session.get('customer', '')
            sub.current_period_start = timezone.now()
            sub.current_period_end = timezone.now() + timedelta(days=30)
            sub.save()

            org.plan = plan.slug.split('-')[0]
            org.max_users = plan.max_users
            org.save()

        elif event['type'] == 'customer.subscription.deleted':
            sub_id = event['data']['object']['id']
            try:
                sub = Subscription.objects.get(gateway_subscription_id=sub_id)
                sub.status = 'cancelled'
                sub.save()
            except Subscription.DoesNotExist:
                pass

        return Response({'status': 'ok'})
    except Exception as e:
        return Response({'error': str(e)}, status=400)
