from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from datetime import timedelta

from .models import Factory, ProductionOrder, Inspection, LabTest, ChatMessage, DemoLead, InspectionSection, InspectionItem
from .serializers import (
    FactorySerializer, ProductionOrderSerializer, InspectionSerializer,
    InspectionDetailSerializer, LabTestSerializer, ChatMessageSerializer,
    DemoLeadSerializer,
)


# ── AQL Standard Lookup (ISO 2859-1 / ANSI Z1.4, Normal Inspection Level II) ──
_AQL_LOT_TO_SAMPLE = [
    (8, 2), (15, 3), (25, 5), (50, 8), (90, 13), (150, 20),
    (280, 32), (500, 50), (1200, 80), (3200, 125), (10000, 200), (999999, 315),
]
_AQL_AR = {
    '0.65': {2: None, 3: None, 5: None, 8: (0,1), 13: (0,1), 20: (0,1), 32: (0,1), 50: (1,2), 80: (1,2), 125: (2,3), 200: (3,4), 315: (5,6)},
    '1.0':  {2: None, 3: None, 5: None, 8: (0,1), 13: (0,1), 20: (0,1), 32: (1,2), 50: (1,2), 80: (2,3), 125: (3,4), 200: (5,6), 315: (7,8)},
    '1.5':  {2: None, 3: None, 5: (0,1), 8: (0,1), 13: (0,1), 20: (1,2), 32: (1,2), 50: (2,3), 80: (3,4), 125: (5,6), 200: (7,8), 315: (10,11)},
    '2.5':  {2: None, 3: (0,1), 5: (0,1), 8: (0,1), 13: (1,2), 20: (1,2), 32: (2,3), 50: (3,4), 80: (5,6), 125: (7,8), 200: (10,11), 315: (14,15)},
    '4.0':  {2: (0,1), 3: (0,1), 5: (0,1), 8: (1,2), 13: (1,2), 20: (2,3), 32: (3,4), 50: (5,6), 80: (7,8), 125: (10,11), 200: (14,15), 315: (21,22)},
    '6.5':  {2: (0,1), 3: (0,1), 5: (1,2), 8: (1,2), 13: (2,3), 20: (3,4), 32: (5,6), 50: (7,8), 80: (10,11), 125: (14,15), 200: (21,22), 315: (21,22)},
    '10.0': {2: (0,1), 3: (1,2), 5: (1,2), 8: (2,3), 13: (3,4), 20: (5,6), 32: (7,8), 50: (10,11), 80: (14,15), 125: (21,22), 200: (21,22), 315: (21,22)},
}


def _aql_sample_size(lot_size):
    for max_lot, ss in _AQL_LOT_TO_SAMPLE:
        if lot_size <= max_lot:
            return ss
    return 315


def _aql_accept_reject(sample_size, aql_str):
    table = _AQL_AR.get(str(aql_str), _AQL_AR['2.5'])
    ar = table.get(sample_size)
    if ar is None:
        for ss in sorted(table.keys()):
            if ss >= sample_size and table[ss] is not None:
                return table[ss]
        return (0, 1)
    return ar


class OrgScopedMixin:
    """Automatically scopes querysets to the user's organization."""
    def get_queryset(self):
        return super().get_queryset().filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user,
        )


class FactoryViewSet(OrgScopedMixin, viewsets.ModelViewSet):
    queryset = Factory.objects.all()
    serializer_class = FactorySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class ProductionOrderViewSet(OrgScopedMixin, viewsets.ModelViewSet):
    queryset = ProductionOrder.objects.select_related('factory').all()
    serializer_class = ProductionOrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'factory']
    search_fields = ['po_number', 'product_name']

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class InspectionViewSet(OrgScopedMixin, viewsets.ModelViewSet):
    queryset = Inspection.objects.select_related('factory', 'production_order', 'created_by', 'template').all()
    serializer_class = InspectionSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ('retrieve', 'save_form'):
            return InspectionDetailSerializer
        return InspectionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in ('retrieve', 'export_pdf', 'save_form'):
            qs = qs.prefetch_related('sections__items', 'defects')
        result_filter = self.request.query_params.get('result')
        if result_filter:
            qs = qs.filter(result=result_filter)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request, pk=None):
        import weasyprint

        # get_object() enforces org scoping; refetch with all relations
        obj = self.get_object()
        inspection = (
            Inspection.objects
            .select_related(
                'factory', 'production_order', 'created_by', 'template',
                'organization', 'production_order__factory',
            )
            .prefetch_related('sections__items', 'defects')
            .get(id=obj.id)
        )

        # Aggregate defect quantities by severity
        severity_counts = {'critical': 0, 'major': 0, 'minor': 0, 'other': 0}
        for defect in inspection.defects.all():
            key = defect.severity if defect.severity in severity_counts else 'other'
            severity_counts[key] += defect.quantity

        # ── AQL table rows ──────────────────────────────────────────────
        lot_size = (inspection.production_order.quantity or 0) if inspection.production_order else 0
        aql_str = (inspection.aql_level or '2.5').strip()
        # Strip descriptive suffixes like "AQL 2.5" → "2.5"
        import re as _re
        aql_str = _re.sub(r'[^0-9.]', '', aql_str) or '2.5'
        sample_from_lot = _aql_sample_size(max(lot_size, 1))
        sample_used = inspection.quantity_inspected or sample_from_lot

        # Minor: 1 step higher than major AQL level
        _aql_levels = ['0.65', '1.0', '1.5', '2.5', '4.0', '6.5', '10.0']
        try:
            _idx = _aql_levels.index(aql_str)
            minor_aql = _aql_levels[min(_idx + 1, len(_aql_levels) - 1)]
        except ValueError:
            minor_aql = '4.0'

        major_ar = _aql_accept_reject(sample_from_lot, aql_str)
        minor_ar = _aql_accept_reject(sample_from_lot, minor_aql)

        def _row_result(found, accept, reject):
            if accept is None:
                return 'na'
            return 'fail' if found > accept else 'pass'

        aql_rows = [
            {
                'severity': 'Critical', 'color': 'critical',
                'sample_size': sample_used, 'accept': 0, 'reject': 1,
                'defects_found': severity_counts['critical'],
                'result': 'fail' if severity_counts['critical'] > 0 else 'pass',
            },
            {
                'severity': 'Major', 'color': 'major',
                'sample_size': sample_used,
                'accept': major_ar[0] if major_ar else '—',
                'reject': major_ar[1] if major_ar else '—',
                'defects_found': severity_counts['major'],
                'result': _row_result(severity_counts['major'], major_ar[0] if major_ar else None, major_ar[1] if major_ar else None),
            },
            {
                'severity': 'Minor', 'color': 'minor',
                'sample_size': sample_used,
                'accept': minor_ar[0] if minor_ar else '—',
                'reject': minor_ar[1] if minor_ar else '—',
                'defects_found': severity_counts['minor'],
                'result': _row_result(severity_counts['minor'], minor_ar[0] if minor_ar else None, minor_ar[1] if minor_ar else None),
            },
        ]

        # ── Defect table rows (grouped by section+name, cols per severity) ──
        defect_groups = {}
        for defect in inspection.defects.all():
            key = (defect.section_name or 'General', defect.defect_name)
            if key not in defect_groups:
                defect_groups[key] = {
                    'group': defect.section_name or 'General',
                    'defect_name': defect.defect_name,
                    'remark': defect.item_name or '',
                    'minor': 0, 'major': 0, 'critical': 0,
                    'photo_url': defect.photo_url or '',
                }
            sev = defect.severity if defect.severity in ('minor', 'major', 'critical') else 'minor'
            defect_groups[key][sev] += defect.quantity
            if defect.photo_url:
                defect_groups[key]['photo_url'] = defect.photo_url
        defect_table_rows = list(defect_groups.values())

        # ── Appearance/evidence photos (items with photo_url set) ──
        photo_items = []
        for section in inspection.sections.all():
            for item in section.items.all():
                if item.photo_url:
                    photo_items.append({'label': item.label, 'url': item.photo_url, 'section': section.name})

        # ── Computed overall result ──
        if severity_counts['critical'] > 0:
            computed_result = 'fail'
        elif major_ar and isinstance(major_ar[0], int) and severity_counts['major'] > major_ar[0]:
            computed_result = 'fail'
        else:
            computed_result = 'pass'
        display_result = inspection.result if inspection.result != 'pending' else computed_result

        context = {
            'inspection': inspection,
            'severity_counts': severity_counts,
            'org_name': inspection.organization.name if inspection.organization else 'SankalpHub',
            'aql_rows': aql_rows,
            'defect_table_rows': defect_table_rows,
            'photo_items': photo_items,
            'display_result': display_result,
            'aql_level_display': aql_str,
            'sample_size': sample_used,
        }

        html_string = render_to_string('inspections/report.html', context, request=request)
        pdf_bytes = weasyprint.HTML(
            string=html_string,
            base_url=request.build_absolute_uri('/'),
        ).write_pdf()

        template_code = (
            inspection.template.code.replace('/', '-') if inspection.template else 'RPT'
        )
        order_num = (
            inspection.production_order.po_number.replace('/', '-')
            if inspection.production_order else 'NA'
        )
        date_str = (
            inspection.inspection_date.strftime('%Y%m%d')
            if inspection.inspection_date else 'unknown'
        )
        filename = f"SankalpHub_{template_code}_{order_num}_{date_str}.pdf"

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'], url_path='save-form')
    def save_form(self, request, pk=None):
        """Bulk-upsert InspectionSection + InspectionItem from template form data."""
        obj = self.get_object()  # enforces org scoping

        for sec_data in request.data.get('sections', []):
            section, _ = InspectionSection.objects.get_or_create(
                inspection=obj,
                name=sec_data['name'],
                defaults={'sort_order': sec_data.get('sort_order', 0)},
            )
            if section.sort_order != sec_data.get('sort_order', section.sort_order):
                InspectionSection.objects.filter(pk=section.pk).update(
                    sort_order=sec_data.get('sort_order', 0)
                )

            for item_data in sec_data.get('items', []):
                item, created = InspectionItem.objects.get_or_create(
                    section=section,
                    label=item_data['label'],
                    defaults={
                        'type': item_data.get('type', 'text'),
                        'actual_value': item_data.get('actual_value', ''),
                        'result': item_data.get('result', 'pending'),
                        'comment': item_data.get('comment', ''),
                    },
                )
                if not created:
                    InspectionItem.objects.filter(pk=item.pk).update(
                        actual_value=item_data.get('actual_value', item.actual_value),
                        result=item_data.get('result', item.result),
                        comment=item_data.get('comment', item.comment),
                        type=item_data.get('type', item.type),
                    )

        fresh = (
            Inspection.objects
            .select_related('factory', 'production_order', 'created_by', 'template', 'organization')
            .prefetch_related('sections__items', 'defects')
            .get(id=obj.id)
        )
        return Response(InspectionDetailSerializer(fresh, context={'request': request}).data)


class LabTestViewSet(OrgScopedMixin, viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            submitted_by=self.request.user,
        )


class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.select_related('sender').all()
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']  # no edit/delete

    def get_queryset(self):
        return self.queryset.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            sender=self.request.user,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    org = request.user.organization
    if not org:
        return Response({'error': 'User has no organization.'}, status=400)

    orders = ProductionOrder.objects.filter(organization=org)
    inspections = Inspection.objects.filter(organization=org)
    lab_tests = LabTest.objects.filter(organization=org)

    avg_defect = inspections.aggregate(avg=Avg('defect_rate'))['avg'] or 0
    passed_tests = lab_tests.filter(score__gte=80).count()

    # Recent activity (last 5 inspections)
    recent = list(
        inspections.order_by('-created_at')[:5].values(
            'id', 'inspection_type', 'result', 'inspection_date', 'defect_rate'
        )
    )
    for item in recent:
        item['id'] = str(item['id'])
        item['inspection_date'] = str(item['inspection_date'])
        item['defect_rate'] = float(item['defect_rate'])

    data = {
        'total_orders': orders.count(),
        'pending_orders': orders.filter(status__in=['pending', 'in_progress']).count(),
        'completed_orders': orders.filter(status='completed').count(),
        'total_inspections': inspections.count(),
        'failed_inspections': inspections.filter(result='fail').count(),
        'passed_inspections': inspections.filter(result='pass').count(),
        'avg_defect_rate': round(float(avg_defect), 2),
        'total_lab_tests': lab_tests.count(),
        'passed_lab_tests': passed_tests,
        'active_factories': Factory.objects.filter(organization=org, is_active=True).count(),
        'recent_activity': recent,
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_trends(request):
    org = request.user.organization
    if not org:
        return Response({'error': 'User has no organization.'}, status=400)

    # Last 6 months of inspection data
    six_months_ago = timezone.now().date() - timedelta(days=180)
    inspections = Inspection.objects.filter(
        organization=org,
        inspection_date__gte=six_months_ago,
    ).values('inspection_date__month', 'inspection_date__year').annotate(
        total=Count('id'),
        failed=Count('id', filter=Q(result='fail')),
        avg_defect=Avg('defect_rate'),
    ).order_by('inspection_date__year', 'inspection_date__month')

    return Response({'inspection_trends': list(inspections)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_stats(request):
    org = request.user.organization
    if not org:
        return Response({'error': 'No organization'}, status=400)
    orders = ProductionOrder.objects.filter(organization=org)
    data = {
        'active': orders.exclude(status__in=['completed', 'delivered', 'cancelled']).count(),
        'urgent': orders.filter(status='urgent').count(),
        'warning': orders.filter(status='warning').count(),
        'on_track': orders.filter(status__in=['on_track', 'in_progress']).count(),
        'delivered': orders.filter(status__in=['delivered', 'completed']).count(),
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tasks_cross_order(request):
    from apps.workflow.models import WorkflowTask
    from apps.workflow.serializers import WorkflowTaskSerializer
    org = request.user.organization
    if not org:
        return Response([])
    tasks = WorkflowTask.objects.filter(
        stage__order__organization=org
    ).select_related('assignee', 'stage__order')
    status_filter = request.query_params.get('status')
    if status_filter:
        tasks = tasks.filter(status=status_filter)
    search = request.query_params.get('search')
    if search:
        tasks = tasks.filter(
            Q(name__icontains=search) |
            Q(stage__order__po_number__icontains=search)
        )
    serializer = WorkflowTaskSerializer(tasks[:100], many=True)
    # Enrich with order info
    results = []
    for task, data in zip(tasks[:100], serializer.data):
        data['order_po_number'] = task.stage.order.po_number
        data['stage_name'] = task.stage.name
        results.append(data)
    return Response(results)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tasks_stats(request):
    from apps.workflow.models import WorkflowTask
    from django.utils import timezone as tz
    org = request.user.organization
    if not org:
        return Response({})
    tasks = WorkflowTask.objects.filter(stage__order__organization=org)
    today = tz.now().date()
    data = {
        'active': tasks.exclude(status__in=['APPROVED', 'PASS', 'NOT_APPLICABLE']).count(),
        'planned': tasks.filter(status='PLANNED').count(),
        'upcoming': tasks.filter(status='PLANNED', plan_end__gt=today, plan_end__lte=today + timedelta(days=7)).count(),
        'overdue': tasks.filter(plan_end__lt=today).exclude(status__in=['APPROVED', 'PASS', 'NOT_APPLICABLE']).count(),
        'done': tasks.filter(status__in=['APPROVED', 'PASS']).count(),
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liveboard_inspection(request):
    org = request.user.organization
    if not org:
        return Response({})
    inspections = Inspection.objects.filter(organization=org)
    total = inspections.count()
    passed = inspections.filter(result='pass').count()
    pieces = inspections.aggregate(total=Count('quantity_inspected'))['total'] or 0
    avg_defect = inspections.aggregate(avg=Avg('defect_rate'))['avg'] or 0
    return Response({
        'inspections_count': total,
        'passed_count': passed,
        'pieces_checked': pieces,
        'defect_rate': round(float(avg_defect), 2),
        'top_defects': [],
        'defect_evolution': [],
        'countries_defect_rate': [],
        'suppliers_defect_rate': [],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liveboard_tna(request):
    return Response({
        'orders_overview': {},
        'on_time_rate': 0,
        'stages_summary': [],
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def demo_request(request):
    serializer = DemoLeadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    lead = serializer.save()

    # Send email notification
    try:
        subject = f"New Demo Request from {lead.name} ({lead.company})"
        body = (
            f"New demo request received on SankalpHub:\n\n"
            f"Name: {lead.name}\n"
            f"Company: {lead.company}\n"
            f"Role / Position: {lead.role or 'N/A'}\n"
            f"Email: {lead.email}\n"
            f"Phone: {lead.phone}\n"
            f"Factories: {lead.factories_count}\n"
            f"Monthly Inspections: {lead.monthly_inspections}\n"
            f"Message: {lead.message or 'N/A'}\n\n"
            f"---\nSankalpHub Lead Notification"
        )
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            ['naveenkool786@gmail.com', 'admin@sankalphub.in'],
            fail_silently=True,
        )
    except Exception:
        pass  # Don't fail the request if email fails

    return Response({'message': 'Demo request received! We will contact you shortly.'})
