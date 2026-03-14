from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import (
    InspectionTemplate, TemplateSection, TemplateField,
    BLOCK_TYPE_CHOICES,
)
from .serializers import (
    InspectionTemplateListSerializer,
    InspectionTemplateDetailSerializer,
    InspectionTemplateWriteSerializer,
    TemplateSectionSerializer,
    TemplateFieldSerializer,
)


# Default section names for the 7 blocks
DEFAULT_SECTIONS = [
    ('header', 'Template Header', 0),
    ('context', 'Product / Order Context', 1),
    ('tasks', 'Department Tasks', 2),
    ('data', 'Technical Data', 3),
    ('attachments', 'Attachments / Evidence', 4),
    ('output', 'Department Output', 5),
    ('approval', 'Approval & Handover', 6),
]


class InspectionTemplateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Always return all templates (max ~35)

    def get_serializer_class(self):
        if self.action == 'list':
            return InspectionTemplateListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return InspectionTemplateWriteSerializer
        return InspectionTemplateDetailSerializer

    def get_queryset(self):
        qs = InspectionTemplate.objects.filter(
            organization=self.request.user.organization
        ).select_related('department').prefetch_related('sections__fields')

        phase = self.request.query_params.get('phase')
        if phase:
            qs = qs.filter(phase=phase)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(product_category=category)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        return qs

    def perform_create(self, serializer):
        template = serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user,
        )
        # Auto-create 7 sections
        for block_type, name, sort_order in DEFAULT_SECTIONS:
            TemplateSection.objects.create(
                template=template,
                block_type=block_type,
                name=name,
                sort_order=sort_order,
            )

    def destroy(self, request, *args, **kwargs):
        template = self.get_object()
        if template.records.exists():
            return Response(
                {'error': 'Cannot delete template with existing records.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'], url_path='seed')
    def seed(self, request):
        """Seed default templates for this organization."""
        from django.core.management import call_command
        from io import StringIO
        out = StringIO()
        call_command(
            'seed_inspection_templates',
            org_id=str(request.user.organization.id),
            stdout=out,
        )
        return Response({
            'status': 'ok',
            'message': out.getvalue().strip(),
        })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def section_fields(request, template_id, section_id):
    """List or add fields within a section."""
    org = request.user.organization
    template = get_object_or_404(InspectionTemplate, id=template_id, organization=org)
    section = get_object_or_404(TemplateSection, id=section_id, template=template)

    if request.method == 'GET':
        fields = section.fields.all()
        serializer = TemplateFieldSerializer(fields, many=True)
        return Response(serializer.data)

    # POST — create field
    serializer = TemplateFieldSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    # Auto-set sort_order if not provided
    if 'sort_order' not in request.data:
        max_order = section.fields.order_by('-sort_order').values_list('sort_order', flat=True).first()
        serializer.validated_data['sort_order'] = (max_order or 0) + 1
    serializer.save(section=section)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def section_field_detail(request, template_id, section_id, field_id):
    """Update or delete a field."""
    org = request.user.organization
    template = get_object_or_404(InspectionTemplate, id=template_id, organization=org)
    section = get_object_or_404(TemplateSection, id=section_id, template=template)
    field = get_object_or_404(TemplateField, id=field_id, section=section)

    if request.method == 'DELETE':
        field.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PUT or PATCH
    partial = request.method == 'PATCH'
    serializer = TemplateFieldSerializer(field, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder_fields(request, template_id, section_id):
    """Reorder fields within a section. Body: {"field_ids": ["uuid1", "uuid2", ...]}"""
    org = request.user.organization
    template = get_object_or_404(InspectionTemplate, id=template_id, organization=org)
    section = get_object_or_404(TemplateSection, id=section_id, template=template)

    field_ids = request.data.get('field_ids', [])
    for i, fid in enumerate(field_ids):
        TemplateField.objects.filter(id=fid, section=section).update(sort_order=i)

    return Response({'status': 'ok'})
