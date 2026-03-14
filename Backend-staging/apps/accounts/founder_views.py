from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Organization
from .founder_models import AgentAssignment, FounderActionLog
from .founder_permissions import IsFounder, IsFounderOrAgent


def _get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    return xff.split(',')[0].strip() if xff else request.META.get('REMOTE_ADDR')


def _log_action(request, action, target_user=None, target_client_id=None,
                target_client_name='', notes='', session_duration=None):
    FounderActionLog.objects.create(
        actor=request.user,
        action=action,
        target_user=target_user,
        target_client_id=target_client_id,
        target_client_name=target_client_name,
        notes=notes,
        ip_address=_get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
        session_duration_seconds=session_duration,
    )


# ─── Dashboard KPIs ──────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsFounder])
def founder_dashboard(request):
    from apps.core.models import Factory, ProductionOrder, Inspection
    from apps.billing.models import PaymentRecord

    total_orgs = Organization.objects.count()
    total_users = User.objects.count()
    total_orders = ProductionOrder.objects.count()
    total_factories = Factory.objects.count()
    total_inspections = Inspection.objects.count()

    total_revenue = 0
    payments = PaymentRecord.objects.filter(status='captured')
    for p in payments:
        total_revenue += float(p.amount or 0)

    plan_dist = dict(
        Organization.objects.values_list('plan')
        .annotate(c=Count('id'))
        .values_list('plan', 'c')
    )

    # Recent actions
    recent_actions = []
    for log in FounderActionLog.objects.select_related('actor', 'target_user')[:20]:
        recent_actions.append({
            'id': str(log.id),
            'actor': log.actor.email if log.actor else 'unknown',
            'action': log.action,
            'action_display': log.get_action_display(),
            'target_user': log.target_user.email if log.target_user else None,
            'target_client_name': log.target_client_name,
            'notes': log.notes,
            'timestamp': log.timestamp.isoformat(),
        })

    return Response({
        'total_orgs': total_orgs,
        'total_users': total_users,
        'total_orders': total_orders,
        'total_factories': total_factories,
        'total_inspections': total_inspections,
        'total_revenue': total_revenue,
        'plan_distribution': plan_dist,
        'recent_actions': recent_actions,
    })


# ─── Client List ─────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsFounderOrAgent])
def client_list(request):
    orgs = Organization.objects.annotate(member_count=Count('members'))

    # Sub-agents only see assigned orgs
    if request.user.role == 'sub_agent':
        assignments = AgentAssignment.objects.filter(
            agent=request.user, is_active=True
        )
        allowed_ids = []
        for a in assignments:
            allowed_ids.extend(a.client_ids or [])
        orgs = orgs.filter(id__in=allowed_ids)

    search = request.query_params.get('search', '').strip()
    if search:
        orgs = orgs.filter(Q(name__icontains=search) | Q(slug__icontains=search))

    plan_filter = request.query_params.get('plan')
    if plan_filter:
        orgs = orgs.filter(plan=plan_filter)

    data = []
    for org in orgs[:100]:
        data.append({
            'id': str(org.id),
            'name': org.name,
            'slug': org.slug,
            'plan': org.plan,
            'is_active': org.is_active,
            'is_trial_locked': org.is_trial_locked,
            'member_count': org.member_count,
            'trial_days_remaining': round(org.trial_days_remaining, 1) if org.plan == 'free' else None,
            'created_at': org.created_at.isoformat(),
        })

    return Response(data)


# ─── User List ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsFounder])
def user_list(request):
    users = User.objects.select_related('organization').all()

    search = request.query_params.get('search', '').strip()
    if search:
        users = users.filter(
            Q(email__icontains=search) | Q(full_name__icontains=search)
        )

    role_filter = request.query_params.get('role')
    if role_filter:
        users = users.filter(role=role_filter)

    org_filter = request.query_params.get('org_id')
    if org_filter:
        users = users.filter(organization_id=org_filter)

    data = []
    for u in users[:200]:
        data.append({
            'id': str(u.id),
            'email': u.email,
            'full_name': u.full_name,
            'role': u.role,
            'is_active': u.is_active,
            'organization': {
                'id': str(u.organization.id),
                'name': u.organization.name,
            } if u.organization else None,
            'last_login_at': u.last_login_at.isoformat() if u.last_login_at else None,
            'created_at': u.created_at.isoformat(),
        })

    return Response(data)


# ─── Impersonation ───────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsFounder])
def impersonate_start(request, user_id):
    try:
        target = User.objects.select_related('organization').get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if target.role in ('super_owner', 'sub_agent'):
        return Response(
            {'error': 'Cannot impersonate console users'},
            status=status.HTTP_403_FORBIDDEN,
        )

    refresh = RefreshToken.for_user(target)

    _log_action(
        request,
        action='impersonate_start',
        target_user=target,
        target_client_id=target.organization_id,
        target_client_name=target.organization.name if target.organization else '',
        notes=f"Impersonating {target.email}",
    )

    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {
            'id': str(target.id),
            'email': target.email,
            'full_name': target.full_name,
            'role': target.role,
            'organization': {
                'id': str(target.organization.id),
                'name': target.organization.name,
            } if target.organization else None,
        },
    })


@api_view(['POST'])
@permission_classes([IsFounder])
def impersonate_end(request):
    duration = request.data.get('session_duration_seconds')
    target_email = request.data.get('target_email', '')

    _log_action(
        request,
        action='impersonate_end',
        notes=f"Ended impersonation of {target_email}",
        session_duration=duration,
    )

    return Response({'status': 'ok'})


# ─── Suspend / Unsuspend User ────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsFounder])
def suspend_user(request, user_id):
    try:
        target = User.objects.select_related('organization').get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if target.role == 'super_owner':
        return Response(
            {'error': 'Cannot suspend super_owner'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Toggle
    target.is_active = not target.is_active
    target.save(update_fields=['is_active'])

    action = 'unsuspend_user' if target.is_active else 'suspend_user'
    _log_action(
        request,
        action=action,
        target_user=target,
        target_client_id=target.organization_id,
        target_client_name=target.organization.name if target.organization else '',
    )

    return Response({
        'id': str(target.id),
        'email': target.email,
        'is_active': target.is_active,
        'action': action,
    })


# ─── Agent Management ────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsFounder])
def agent_list_create(request):
    if request.method == 'GET':
        assignments = AgentAssignment.objects.select_related('agent', 'assigned_by').all()
        data = []
        for a in assignments:
            data.append({
                'id': str(a.id),
                'agent': {
                    'id': str(a.agent.id),
                    'email': a.agent.email,
                    'full_name': a.agent.full_name,
                },
                'agent_type': a.agent_type,
                'agent_type_display': a.get_agent_type_display(),
                'client_ids': a.client_ids,
                'allowed_actions': a.allowed_actions,
                'is_active': a.is_active,
                'notes': a.notes,
                'assigned_by': a.assigned_by.email if a.assigned_by else None,
                'created_at': a.created_at.isoformat(),
            })
        return Response(data)

    # POST — create new assignment
    agent_id = request.data.get('agent_id')
    if not agent_id:
        return Response({'error': 'agent_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        agent_user = User.objects.get(id=agent_id, role='sub_agent')
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found or not a sub_agent'},
            status=status.HTTP_404_NOT_FOUND,
        )

    assignment = AgentAssignment.objects.create(
        agent=agent_user,
        agent_type=request.data.get('agent_type', 'client_success'),
        client_ids=request.data.get('client_ids', []),
        allowed_actions=request.data.get('allowed_actions', []),
        assigned_by=request.user,
        notes=request.data.get('notes', ''),
    )

    _log_action(
        request,
        action='create_agent',
        target_user=agent_user,
        notes=f"Created {assignment.get_agent_type_display()} assignment for {agent_user.email}",
    )

    return Response({
        'id': str(assignment.id),
        'agent': agent_user.email,
        'agent_type': assignment.agent_type,
        'status': 'created',
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsFounder])
def agent_revoke(request, assignment_id):
    try:
        assignment = AgentAssignment.objects.select_related('agent').get(id=assignment_id)
    except AgentAssignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=status.HTTP_404_NOT_FOUND)

    assignment.is_active = False
    assignment.save(update_fields=['is_active', 'updated_at'])

    _log_action(
        request,
        action='revoke_agent',
        target_user=assignment.agent,
        notes=f"Revoked {assignment.get_agent_type_display()} assignment for {assignment.agent.email}",
    )

    return Response({'id': str(assignment.id), 'status': 'revoked'})


# ─── Audit Log ───────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsFounder])
def audit_log(request):
    logs = FounderActionLog.objects.select_related('actor', 'target_user').all()

    action_filter = request.query_params.get('action')
    if action_filter:
        logs = logs.filter(action=action_filter)

    # Pagination
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 50))
    offset = (page - 1) * page_size
    total = logs.count()

    data = []
    for log in logs[offset:offset + page_size]:
        data.append({
            'id': str(log.id),
            'actor': log.actor.email if log.actor else 'unknown',
            'action': log.action,
            'action_display': log.get_action_display(),
            'target_user': log.target_user.email if log.target_user else None,
            'target_client_id': str(log.target_client_id) if log.target_client_id else None,
            'target_client_name': log.target_client_name,
            'notes': log.notes,
            'ip_address': log.ip_address,
            'session_duration_seconds': log.session_duration_seconds,
            'timestamp': log.timestamp.isoformat(),
        })

    return Response({
        'results': data,
        'total': total,
        'page': page,
        'page_size': page_size,
    })
