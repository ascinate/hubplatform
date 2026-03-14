import logging
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from apps.tasks.models import Task
from apps.tasks.services import notify_task_event

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Mark overdue tasks and send reminder notifications'

    def handle(self, *args, **options):
        today = date.today()

        # 1. Mark tasks as overdue
        overdue_qs = Task.objects.filter(
            due_date__lt=today,
            status__in=['open', 'in_progress'],
        ).select_related('assigned_to', 'created_by', 'factory', 'order')

        overdue_count = 0
        for task in overdue_qs:
            task.status = 'overdue'
            task.save(update_fields=['status', 'updated_at'])
            notify_task_event(task, 'task_overdue')
            overdue_count += 1

        # 2. Send reminders (due_date - reminder_days == today)
        reminder_count = 0
        upcoming_qs = Task.objects.filter(
            status__in=['open', 'in_progress'],
            due_date__gte=today,
        ).select_related('assigned_to', 'factory')

        for task in upcoming_qs:
            reminder_date = task.due_date - timedelta(days=task.reminder_days)
            if reminder_date == today:
                notify_task_event(task, 'task_reminder')
                reminder_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"check_task_overdue done — {overdue_count} overdue, {reminder_count} reminders"
        ))
