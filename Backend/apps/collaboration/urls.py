from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('rooms', views.CollaborationRoomViewSet, basename='collaboration-room')
router.register('approvals', views.ApprovalRequestViewSet, basename='approval-request')
router.register(
    'inspection-activation',
    views.InspectionActivationViewSet,
    basename='inspection-activation'
)

urlpatterns = [
    path('', include(router.urls)),
]
