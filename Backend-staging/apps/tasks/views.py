from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import Task, TaskActivity
from .serializers import TaskSerializer, TaskActivitySerializer
from .services import notify_task_event
from .permissions import TASK_CREATOR_ROLES


def _scope_tasks(queryset, user):
    """Filter tasks based on user role."""
    from django.db.models import Q
    qs = queryset.filter(organization=user.organization)
    if user.role in TASK_CREATOR_ROLES:
        return qs
    return qs.filter(Q(assigned_to=user) | Q(created_by=user))


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list_create(request):
    if request.method == 'GET':
        qs = Task.objects.select_related(
            'created_by', 'assigned_to', 'factory', 'order'
        )
        qs = _scope_tasks(qs, request.user)

        # Filters
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s)
        if p := request.query_params.get('priority'):
            qs = qs.filter(priority=p)
        if t := request.query_params.get('task_type'):
            qs = qs.filter(task_type=t)
        if f := request.query_params.get('factory'):
            qs = qs.filter(factory_id=f)
        if q := request.query_params.get('search'):
            from django.db.models import Q
            qs = qs.filter(Q(title__icontains=q) | Q(assigned_to_name__icontains=q))

        serializer = TaskSerializer(qs, many=True)
        return Response(serializer.data)

    # POST — create task
    if request.user.role not in TASK_CREATOR_ROLES:
        return Response({'error': 'Only admins can create tasks.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = TaskSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    task = serializer.save(
        created_by=request.user,
        organization=request.user.organization,
    )

    # Auto-populate assignee email/name from platform user
    if task.assigned_to and not task.assigned_to_email:
        task.assigned_to_email = task.assigned_to.email
        task.assigned_to_name = task.assigned_to.full_name
        task.save(update_fields=['assigned_to_email', 'assigned_to_name'])

    TaskActivity.objects.create(
        task=task, user=request.user, action='created',
        new_value=f"Assigned to {task.assigned_to_name or 'unassigned'}"
    )
    notify_task_event(task, 'task_assigned', actor=request.user)

    return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_stats(request):
    qs = _scope_tasks(Task.objects.all(), request.user)
    return Response({
        'open':        qs.filter(status='open').count(),
        'in_progress': qs.filter(status='in_progress').count(),
        'overdue':     qs.filter(status='overdue').count(),
        'completed':   qs.filter(status='completed').count(),
        'cancelled':   qs.filter(status='cancelled').count(),
        'total':       qs.count(),
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):
    try:
        task = Task.objects.select_related(
            'created_by', 'assigned_to', 'factory', 'order'
        ).get(id=task_id, organization=request.user.organization)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TaskSerializer(task).data)

    # PATCH — update task fields
    if request.user.role not in TASK_CREATOR_ROLES and task.created_by != request.user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    serializer = TaskSerializer(task, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    notify_task_event(task, 'task_updated', actor=request.user)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def task_status_update(request, task_id):
    try:
        task = Task.objects.get(id=task_id, organization=request.user.organization)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    valid = [c[0] for c in Task.Status.choices]
    if new_status not in valid:
        return Response({'error': f'Invalid status. Must be one of: {valid}'}, status=status.HTTP_400_BAD_REQUEST)

    # Permission check
    is_privileged = request.user.role in TASK_CREATOR_ROLES
    if not is_privileged and task.assigned_to != request.user:
        return Response({'error': 'You can only update your own tasks.'}, status=status.HTTP_403_FORBIDDEN)

    old_status = task.status
    task.status = new_status
    if new_status == 'completed':
        task.completed_at = timezone.now()
    task.save(update_fields=['status', 'completed_at', 'updated_at'])

    TaskActivity.objects.create(
        task=task, user=request.user, action='status_changed',
        old_value=old_status, new_value=new_status,
        note=request.data.get('note', '')
    )

    if new_status == 'completed':
        notify_task_event(task, 'task_completed', actor=request.user)
    elif new_status == 'cancelled':
        notify_task_event(task, 'task_cancelled', actor=request.user)

    return Response({'success': True, 'status': new_status})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_activities(request, task_id):
    activities = TaskActivity.objects.filter(
        task_id=task_id, task__organization=request.user.organization
    ).select_related('user')
    return Response(TaskActivitySerializer(activities, many=True).data)
