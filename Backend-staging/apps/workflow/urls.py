from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'workflow/tasks', views.WorkflowTaskViewSet, basename='workflow-task')
router.register(r'departments', views.DepartmentViewSet, basename='department')
router.register(r'workflow-templates', views.WorkflowTemplateViewSet, basename='workflow-template')

urlpatterns = [
    # Existing
    path('orders/<uuid:order_id>/workflow/', views.order_workflow, name='order-workflow'),
    path('orders/<uuid:order_id>/workflow/stages/', views.order_workflow, name='order-workflow-create'),
    path('workflow/stages/<uuid:stage_id>/tasks/', views.stage_add_task, name='stage-add-task'),

    # Workflow initialization
    path('orders/<uuid:order_id>/workflow/initialize/', views.initialize_workflow, name='initialize-workflow'),

    # Stage transitions
    path('orders/<uuid:order_id>/workflow/<uuid:stage_id>/', views.stage_detail, name='stage-detail'),
    path('orders/<uuid:order_id>/workflow/<uuid:stage_id>/start/', views.stage_start, name='stage-start'),
    path('orders/<uuid:order_id>/workflow/<uuid:stage_id>/submit/', views.stage_submit, name='stage-submit'),
    path('orders/<uuid:order_id>/workflow/<uuid:stage_id>/approve/', views.stage_approve, name='stage-approve'),
    path('orders/<uuid:order_id>/workflow/<uuid:stage_id>/reject/', views.stage_reject, name='stage-reject'),
    path('orders/<uuid:order_id>/workflow/<uuid:stage_id>/comments/', views.stage_comments, name='stage-comments'),

    # Order progress
    path('orders/<uuid:order_id>/progress/', views.order_progress, name='order-progress'),

    # Template stages
    path('workflow-templates/<uuid:template_id>/stages/', views.template_stages, name='template-stages'),
    path('workflow-templates/<uuid:template_id>/stages/<uuid:stage_id>/', views.template_stage_detail, name='template-stage-detail'),
] + router.urls
