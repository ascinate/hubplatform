from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.core.analytics_admin_view import site_analytics

@api_view(['GET'])
@permission_classes([AllowAny])
def health(request):
    return Response({'status': 'ok', 'service': 'Sankalp API'})

@api_view(['GET'])
@permission_classes([AllowAny])
def config_status(request):
    """Shows which integrations are configured (no secrets exposed)."""
    return Response({
        'debug': settings.DEBUG,
        'email': {
            'backend': settings.EMAIL_BACKEND.split('.')[-1],
            'configured': bool(settings.EMAIL_HOST_PASSWORD),
            'sender': settings.EMAIL_HOST_USER or 'not set',
        },
        'razorpay': {'configured': bool(settings.RAZORPAY_KEY_ID)},
        'stripe': {'configured': bool(settings.STRIPE_SECRET_KEY)},
    })

urlpatterns = [
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
    path('admin/site-analytics/', site_analytics, name='site_analytics'),
    path('admin/', admin.site.urls),
    path('api/health/', health),
    path('api/status/', config_status),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/', include('apps.core.urls')),
    path('api/', include('apps.workflow.urls')),
    path('api/', include('apps.production.urls')),
    path('api/', include('apps.common.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/collaboration/', include('apps.collaboration.urls')),
    path('api/', include('apps.templates_engine.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/founder/', include('apps.accounts.founder_urls')),
    # Public share endpoints (no auth)
    path('api/share/<uuid:token>/', include([
        path('', __import__('apps.documents.views', fromlist=['public_share_view']).public_share_view, name='public-share-view'),
        path('download/', __import__('apps.documents.views', fromlist=['public_share_download']).public_share_download, name='public-share-download'),
    ])),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
