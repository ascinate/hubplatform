from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Department, WorkflowTemplate, WorkflowTemplateStage,
    WorkflowStage, WorkflowTask,
)
from .serializers import (
    DepartmentSerializer, WorkflowTemplateSerializer, WorkflowTemplateStageSerializer,
    WorkflowStageSerializer, WorkflowTaskSerializer, WorkflowProgressSerializer,
)
from . import services
from apps.common.models import Comment
from apps.common.serializers import CommentSerializer


# ─── Existing endpoints (preserved) ─────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order_workflow(request, order_id):
    if request.method == 'GET':
        stages = WorkflowStage.objects.filter(
            order_id=order_id,
            order__organization=request.user.organization,
        ).prefetch_related('tasks__assignee').select_related('department', 'assigned_to', 'approver')
        serializer = WorkflowStageSerializer(stages, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        data['order'] = order_id
        serializer = WorkflowStageSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stage_add_task(request, stage_id):
    try:
        stage = WorkflowStage.objects.get(
            id=stage_id,
            order__organization=request.user.organization,
        )
    except WorkflowStage.DoesNotExist:
        return Response({'error': 'Stage not found'}, status=404)

    data = request.data.copy()
    data['stage'] = stage.id
    serializer = WorkflowTaskSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkflowTaskViewSet(viewsets.ModelViewSet):
    queryset = WorkflowTask.objects.select_related('assignee', 'stage__order').all()
    serializer_class = WorkflowTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(
            stage__order__organization=self.request.user.organization
        )


# ─── Workflow Initialization ─────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_workflow(request, order_id):
    from apps.core.models import ProductionOrder
    try:
        order = ProductionOrder.objects.get(
            id=order_id, organization=request.user.organization
        )
    except ProductionOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    template_id = request.data.get('template_id')
    if template_id:
        try:
            template = WorkflowTemplate.objects.get(
                id=template_id, organization=request.user.organization
            )
        except WorkflowTemplate.DoesNotExist:
            return Response({'error': 'Template not found'}, status=404)
    else:
        template = WorkflowTemplate.objects.filter(
            organization=request.user.organization, is_default=True
        ).first()
        if not template:
            return Response({'error': 'No default template found. Please seed defaults first.'}, status=404)

    try:
        created_stages = services.initialize_order_workflow(order, template)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    serializer = WorkflowStageSerializer(created_stages, many=True)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ─── Stage Transitions ───────────────────────────────────────────────────────

def _get_stage(order_id, stage_id, user):
    try:
        return WorkflowStage.objects.select_related(
            'order', 'department', 'assigned_to', 'approver'
        ).get(
            id=stage_id, order_id=order_id,
            order__organization=user.organization,
        )
    except WorkflowStage.DoesNotExist:
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stage_detail(request, order_id, stage_id):
    stage = _get_stage(order_id, stage_id, request.user)
    if not stage:
        return Response({'error': 'Stage not found'}, status=404)
    serializer = WorkflowStageSerializer(stage)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def stage_start(request, order_id, stage_id):
    stage = _get_stage(order_id, stage_id, request.user)
    if not stage:
        return Response({'error': 'Stage not found'}, status=404)

    try:
        services.start_stage(stage, request.user)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    return Response(WorkflowStageSerializer(stage).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stage_submit(request, order_id, stage_id):
    stage = _get_stage(order_id, stage_id, request.user)
    if not stage:
        return Response({'error': 'Stage not found'}, status=404)

    comment_text = request.data.get('comment_text', '')
    try:
        services.submit_stage(stage, request.user, comment_text)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    return Response(WorkflowStageSerializer(stage).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stage_approve(request, order_id, stage_id):
    stage = _get_stage(order_id, stage_id, request.user)
    if not stage:
        return Response({'error': 'Stage not found'}, status=404)

    comment_text = request.data.get('comment_text', '')
    try:
        services.approve_stage(stage, request.user, comment_text)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    return Response(WorkflowStageSerializer(stage).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stage_reject(request, order_id, stage_id):
    stage = _get_stage(order_id, stage_id, request.user)
    if not stage:
        return Response({'error': 'Stage not found'}, status=404)

    comment_text = request.data.get('comment_text', '')
    try:
        services.reject_stage(stage, request.user, comment_text)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    return Response(WorkflowStageSerializer(stage).data)


# ─── Stage Comments ──────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def stage_comments(request, order_id, stage_id):
    stage = _get_stage(order_id, stage_id, request.user)
    if not stage:
        return Response({'error': 'Stage not found'}, status=404)

    if request.method == 'GET':
        comments = Comment.objects.filter(
            entity_type='workflow_stage', entity_id=str(stage.id)
        ).select_related('user')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    comment_type = request.data.get('comment_type', 'general')
    text = request.data.get('text', '')

    try:
        comment = services.add_comment(stage, request.user, comment_type, text)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)

    return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)


# ─── Order Progress ──────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_progress(request, order_id):
    from apps.core.models import ProductionOrder
    try:
        order = ProductionOrder.objects.get(
            id=order_id, organization=request.user.organization
        )
    except ProductionOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    progress = services.calculate_progress(order)
    return Response(progress)


# ─── Departments ─────────────────────────────────────────────────────────────

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Department.objects.filter(
            organization=self.request.user.organization
        ).select_related('head_user')

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


# ─── Workflow Templates ──────────────────────────────────────────────────────

class WorkflowTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = WorkflowTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WorkflowTemplate.objects.filter(
            organization=self.request.user.organization
        ).prefetch_related('template_stages__department')

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


# ─── Workflow Template Stages ────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def template_stages(request, template_id):
    try:
        template = WorkflowTemplate.objects.get(
            id=template_id, organization=request.user.organization
        )
    except WorkflowTemplate.DoesNotExist:
        return Response({'error': 'Template not found'}, status=404)

    if request.method == 'GET':
        stages = template.template_stages.all().select_related('department')
        serializer = WorkflowTemplateStageSerializer(stages, many=True)
        return Response(serializer.data)

    data = request.data.copy()
    data['template'] = template.id
    serializer = WorkflowTemplateStageSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def template_stage_detail(request, template_id, stage_id):
    try:
        stage = WorkflowTemplateStage.objects.get(
            id=stage_id, template_id=template_id,
            template__organization=request.user.organization
        )
    except WorkflowTemplateStage.DoesNotExist:
        return Response({'error': 'Template stage not found'}, status=404)

    if request.method == 'DELETE':
        stage.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = WorkflowTemplateStageSerializer(stage, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
