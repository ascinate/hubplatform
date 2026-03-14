from datetime import date, timedelta
from django.db import transaction
from django.utils import timezone
from apps.common.models import Comment, Notification


def get_progress_color(pct):
    if pct == 0:
        return '#EF4444'
    if pct <= 20:
        return '#F97316'
    if pct <= 40:
        return '#EAB308'
    if pct <= 60:
        return '#3B82F6'
    if pct <= 80:
        return '#8B5CF6'
    if pct < 100:
        return '#22C55E'
    return '#16A34A'


def calculate_progress(order):
    stages = order.workflow_stages.all()
    if not stages.exists():
        return {'percent': 0, 'color': '#EF4444', 'status_label': 'Not Started'}

    total = stages.exclude(status='skipped').count()
    if total == 0:
        return {'percent': 0, 'color': '#EF4444', 'status_label': 'Not Started'}

    approved = stages.filter(status='approved').count()
    in_progress = stages.filter(status='in_progress').count()

    pct = round(((approved + in_progress * 0.5) / total) * 100)

    # Only 100% when all stages approved
    all_done = approved == total
    if all_done:
        pct = 100
    else:
        pct = min(pct, 99)

    color = get_progress_color(pct)
    status_label = _get_order_status_label(stages, all_done)

    return {'percent': pct, 'color': color, 'status_label': status_label}


def _get_order_status_label(stages, all_done):
    if all_done:
        return 'Completed'

    # Check if any stage is delayed
    if stages.filter(is_delayed=True).exists():
        return 'Delayed'

    # Find the highest approved sequence
    last_approved = stages.filter(status='approved').order_by('-sequence_number').first()
    current_seq = last_approved.sequence_number if last_approved else 0

    # Check for any rejected stage
    if stages.filter(status='rejected').exists():
        return 'Delayed'

    if current_seq == 0 and not stages.filter(status='in_progress').exists():
        return 'Not Started'

    # Map sequence ranges to labels (blueprint Section 3.3)
    if current_seq < 9:
        return 'In Development'
    if current_seq == 9:
        return 'Order Confirmed'
    if current_seq <= 15:
        return 'Pre-Production'
    if current_seq <= 18:
        return 'In Production'
    if current_seq <= 21:
        return 'Quality Control'
    if current_seq <= 24:
        return 'Shipped'
    if current_seq <= 26:
        return 'Delivered'

    return 'In Progress'


def sync_order_status(order):
    progress = calculate_progress(order)
    label = progress['status_label']

    # Map status label to ProductionOrder status choices
    status_map = {
        'Not Started': 'pending',
        'In Development': 'in_progress',
        'Order Confirmed': 'in_progress',
        'Pre-Production': 'in_progress',
        'In Production': 'in_progress',
        'Quality Control': 'in_progress',
        'Shipped': 'delivered',
        'Delivered': 'delivered',
        'Completed': 'completed',
        'Delayed': 'warning',
        'On Hold': 'on_hold',
    }

    order.status = status_map.get(label, 'in_progress')
    order.progress_percent = progress['percent']
    order.save(update_fields=['status', 'progress_percent', 'updated_at'])
    return progress


def initialize_order_workflow(order, template):
    from apps.workflow.models import WorkflowStage

    template_stages = template.template_stages.all().order_by('sequence_number')
    if not template_stages.exists():
        raise ValueError('Template has no stages defined')

    # Delete existing stages if re-initializing
    order.workflow_stages.all().delete()

    # Calculate planned dates from order due_date
    due_date = order.due_date or (date.today() + timedelta(days=90))
    total_duration = sum(ts.typical_duration_days for ts in template_stages if ts.is_required)
    start_date = due_date - timedelta(days=total_duration)
    if start_date < date.today():
        start_date = date.today()

    current_date = start_date
    created_stages = []

    for i, ts in enumerate(template_stages):
        stage_end = current_date + timedelta(days=ts.typical_duration_days)

        stage = WorkflowStage.objects.create(
            order=order,
            name=ts.stage_name,
            sort_order=ts.sequence_number,
            status='in_progress' if i == 0 and ts.is_required else ('skipped' if not ts.is_required else 'pending'),
            stage_code=ts.stage_code,
            sequence_number=ts.sequence_number,
            department=ts.department,
            planned_start_date=current_date if ts.is_required else None,
            planned_end_date=stage_end if ts.is_required else None,
            actual_start_date=date.today() if i == 0 and ts.is_required else None,
            is_required=ts.is_required,
            on_fail_go_to_seq=ts.on_fail_go_to_seq,
            template_stage=ts,
        )
        created_stages.append(stage)

        if ts.is_required:
            current_date = stage_end

    # Sync order status
    sync_order_status(order)
    return created_stages


def start_stage(stage, user):
    if stage.status != 'pending':
        raise ValueError(f'Stage is {stage.status}, cannot start')

    # Check gate: all previous required stages must be approved
    previous_pending = stage.order.workflow_stages.filter(
        sequence_number__lt=stage.sequence_number,
        is_required=True,
    ).exclude(status__in=['approved', 'skipped'])

    if previous_pending.exists():
        raise ValueError('Previous stages must be approved before starting this stage')

    stage.status = 'in_progress'
    stage.actual_start_date = date.today()
    stage.save(update_fields=['status', 'actual_start_date'])
    return stage


def submit_stage(stage, user, comment_text):
    if stage.status != 'in_progress':
        raise ValueError(f'Stage is {stage.status}, cannot submit')

    if not comment_text or len(comment_text.strip()) < 10:
        raise ValueError('Submission note must be at least 10 characters')

    stage.status = 'submitted'
    stage.submitted_at = timezone.now()
    stage.save(update_fields=['status', 'submitted_at'])

    # Create mandatory comment
    Comment.objects.create(
        entity_type='workflow_stage',
        entity_id=str(stage.id),
        user=user,
        comment_type='submission_note',
        text=comment_text.strip(),
    )

    # Notify approver
    if stage.approver:
        Notification.objects.create(
            user=stage.approver,
            type='stage_submitted',
            title=f'Stage submitted for approval: {stage.name}',
            message=f'{user.full_name or user.email} submitted "{stage.name}" for order {stage.order.po_number}. Please review and approve.',
            entity_type='workflow_stage',
            entity_id=str(stage.id),
        )

    return stage


@transaction.atomic
def approve_stage(stage, user, comment_text):
    if stage.status != 'submitted':
        raise ValueError(f'Stage is {stage.status}, cannot approve')

    if not comment_text or len(comment_text.strip()) < 10:
        raise ValueError('Approval note must be at least 10 characters')

    stage.status = 'approved'
    stage.actual_end_date = date.today()
    stage.approved_at = timezone.now()
    stage.save(update_fields=['status', 'actual_end_date', 'approved_at'])

    # Create mandatory comment
    Comment.objects.create(
        entity_type='workflow_stage',
        entity_id=str(stage.id),
        user=user,
        comment_type='approval_note',
        text=comment_text.strip(),
    )

    # Unlock next stage
    next_stage = stage.order.workflow_stages.filter(
        sequence_number__gt=stage.sequence_number,
        is_required=True,
        status='pending',
    ).order_by('sequence_number').first()

    if next_stage:
        next_stage.status = 'in_progress'
        next_stage.actual_start_date = date.today()
        next_stage.save(update_fields=['status', 'actual_start_date'])

        # Notify next assignee
        if next_stage.assigned_to:
            Notification.objects.create(
                user=next_stage.assigned_to,
                type='stage_approved',
                title=f'Your stage is ready: {next_stage.name}',
                message=f'"{stage.name}" was approved. You can now work on "{next_stage.name}" for order {stage.order.po_number}.',
                entity_type='workflow_stage',
                entity_id=str(next_stage.id),
            )

    # Sync order progress
    sync_order_status(stage.order)
    return stage


@transaction.atomic
def reject_stage(stage, user, rejection_reason):
    if stage.status != 'submitted':
        raise ValueError(f'Stage is {stage.status}, cannot reject')

    if not rejection_reason or len(rejection_reason.strip()) < 20:
        raise ValueError('Rejection reason must be at least 20 characters')

    stage.status = 'rejected'
    stage.rejected_at = timezone.now()
    stage.save(update_fields=['status', 'rejected_at'])

    # Create mandatory comment
    Comment.objects.create(
        entity_type='workflow_stage',
        entity_id=str(stage.id),
        user=user,
        comment_type='rejection_reason',
        text=rejection_reason.strip(),
    )

    # Route back to on_fail_go_to_seq
    if stage.on_fail_go_to_seq:
        target_stage = stage.order.workflow_stages.filter(
            sequence_number=stage.on_fail_go_to_seq
        ).first()

        if target_stage:
            # Reset target stage to in_progress
            target_stage.status = 'in_progress'
            target_stage.actual_start_date = date.today()
            target_stage.actual_end_date = None
            target_stage.approved_at = None
            target_stage.submitted_at = None
            target_stage.rejected_at = None
            target_stage.save(update_fields=[
                'status', 'actual_start_date', 'actual_end_date',
                'approved_at', 'submitted_at', 'rejected_at',
            ])

            # Reset all intermediate stages to pending
            stage.order.workflow_stages.filter(
                sequence_number__gt=stage.on_fail_go_to_seq,
                sequence_number__lt=stage.sequence_number,
            ).update(
                status='pending',
                actual_start_date=None,
                actual_end_date=None,
                submitted_at=None,
                approved_at=None,
                rejected_at=None,
            )

            # Notify the target stage assignee
            if target_stage.assigned_to:
                Notification.objects.create(
                    user=target_stage.assigned_to,
                    type='stage_rejected',
                    title=f'Stage rejected: {stage.name}',
                    message=f'"{stage.name}" was rejected by {user.full_name or user.email}. Reason: {rejection_reason[:100]}. Work has been routed back to "{target_stage.name}".',
                    entity_type='workflow_stage',
                    entity_id=str(target_stage.id),
                )

    # Notify the original submitter
    if stage.assigned_to and stage.assigned_to != user:
        Notification.objects.create(
            user=stage.assigned_to,
            type='stage_rejected',
            title=f'Your submission was rejected: {stage.name}',
            message=f'"{stage.name}" was rejected. Reason: {rejection_reason[:200]}',
            entity_type='workflow_stage',
            entity_id=str(stage.id),
        )

    # Sync order progress
    sync_order_status(stage.order)
    return stage


def add_comment(stage, user, comment_type, text):
    valid_types = ['challenge', 'feedback', 'delay_reason', 'general']
    if comment_type not in valid_types:
        raise ValueError(f'Invalid comment type. Must be one of: {", ".join(valid_types)}')

    if not text or len(text.strip()) < 5:
        raise ValueError('Comment must be at least 5 characters')

    return Comment.objects.create(
        entity_type='workflow_stage',
        entity_id=str(stage.id),
        user=user,
        comment_type=comment_type,
        text=text.strip(),
    )
