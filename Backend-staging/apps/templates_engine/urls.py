from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('inspection-templates', views.InspectionTemplateViewSet, basename='inspection-template')

urlpatterns = [
    path(
        'inspection-templates/<uuid:template_id>/sections/<uuid:section_id>/fields/',
        views.section_fields,
        name='section-fields',
    ),
    path(
        'inspection-templates/<uuid:template_id>/sections/<uuid:section_id>/fields/<uuid:field_id>/',
        views.section_field_detail,
        name='section-field-detail',
    ),
    path(
        'inspection-templates/<uuid:template_id>/sections/<uuid:section_id>/fields/reorder/',
        views.reorder_fields,
        name='reorder-fields',
    ),
] + router.urls
