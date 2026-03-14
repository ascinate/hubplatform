from datetime import date
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from apps.workflow.models import WorkflowStage
from apps.common.models import Notification


class Command(BaseCommand):
    help = 'Check for delayed workflow stages and send notifications'

    def handle(self, *args, **options):
        today = date.today()

        delayed_stages = WorkflowStage.objects.filter(
            status__in=['pending', 'in_progress'],
            planned_end_date__lt=today,
            is_delayed=False,
            is_required=True,
        ).select_related('order', 'assigned_to', 'approver', 'department')

        count = 0
        for stage in delayed_stages:
            delay_days = (today - stage.planned_end_date).days

            # Update stage delay flags
            stage.is_delayed = True
            stage.delay_days = delay_days
            stage.save(update_fields=['is_delayed', 'delay_days'])

            order = stage.order
            po_number = order.po_number

            # Update order status if not already delayed
            if order.status not in ('on_hold', 'cancelled', 'completed'):
                order.status = 'warning'
                order.save(update_fields=['status', 'updated_at'])

            # Notify assignee
            if stage.assigned_to:
                Notification.objects.create(
                    user=stage.assigned_to,
                    type='delay_alert',
                    title=f'Delay Alert: {stage.name}',
                    message=f'Stage "{stage.name}" is {delay_days} day(s) overdue for Order {po_number}. Immediate action required.',
                    entity_type='workflow_stage',
                    entity_id=str(stage.id),
                )

            # Notify approver
            if stage.approver and stage.approver != stage.assigned_to:
                Notification.objects.create(
                    user=stage.approver,
                    type='delay_alert',
                    title=f'Delay Alert: {stage.name}',
                    message=f'Stage "{stage.name}" is {delay_days} day(s) overdue for Order {po_number}.',
                    entity_type='workflow_stage',
                    entity_id=str(stage.id),
                )

            # Notify department head
            if stage.department and stage.department.head_user:
                head = stage.department.head_user
                if head != stage.assigned_to and head != stage.approver:
                    Notification.objects.create(
                        user=head,
                        type='delay_alert',
                        title=f'Delay Alert: {stage.name}',
                        message=f'Stage "{stage.name}" in your department is {delay_days} day(s) overdue for Order {po_number}.',
                        entity_type='workflow_stage',
                        entity_id=str(stage.id),
                    )

            # Send email to assignee
            if stage.assigned_to and stage.assigned_to.email:
                try:
                    send_mail(
                        subject=f'Delay Alert: {stage.name} — Order {po_number}',
                        message=(
                            f'Stage "{stage.name}" is {delay_days} day(s) overdue for Order {po_number}.\n'
                            f'Planned End Date: {stage.planned_end_date}\n'
                            f'Order Due Date: {order.due_date}\n\n'
                            f'Please take immediate action at https://sankalphub.in/orders/{order.id}'
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[stage.assigned_to.email],
                        fail_silently=True,
                    )
                except Exception as e:
                    self.stderr.write(f'  Email failed for {stage.assigned_to.email}: {e}')

            count += 1
            self.stdout.write(f'  [{po_number}] {stage.name} — {delay_days} day(s) overdue')

        if count:
            self.stdout.write(self.style.WARNING(f'\n{count} delayed stage(s) flagged.'))
        else:
            self.stdout.write(self.style.SUCCESS('No new delays detected.'))
