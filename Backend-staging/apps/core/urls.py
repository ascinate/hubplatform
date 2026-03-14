from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('factories', views.FactoryViewSet, basename='factory')
router.register('production-orders', views.ProductionOrderViewSet, basename='production-order')
router.register('inspections', views.InspectionViewSet, basename='inspection')
router.register('lab-tests', views.LabTestViewSet, basename='lab-test')
router.register('chat', views.ChatMessageViewSet, basename='chat')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/summary/', views.dashboard_summary, name='analytics-summary'),
    path('analytics/trends/', views.analytics_trends, name='analytics-trends'),
    path('orders/stats/', views.order_stats, name='order-stats'),
    path('liveboard/inspection/', views.liveboard_inspection, name='liveboard-inspection'),
    path('liveboard/tna/', views.liveboard_tna, name='liveboard-tna'),
    path('demo-request/', views.demo_request, name='demo-request'),
]
