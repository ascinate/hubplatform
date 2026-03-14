import uuid
from django.db import models
from django.conf import settings


class Task(models.Model):

    class TaskType(models.TextChoices):
        INSPECTION          = 'inspection',          'Inspection'
        LAB_TEST            = 'lab_test',            'Lab Test'
        AUDIT               = 'audit',               'Audit'
        DOCUMENT_SUBMISSION = 'document_submission', 'Document Submission'
        FOLLOW_UP           = 'follow_up',           'Follow Up'
        OTHER               = 'other',               'Other'

    class Priority(models.TextChoices):
        LOW    = 'low',    'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH   = 'high',   'High'
        URGENT = 'urgent', 'Urgent'

    class Status(models.TextChoices):
        OPEN        = 'open',        'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED   = 'completed',   'Completed'
        OVERDUE     = 'overdue',     'Overdue'
        CANCELLED   = 'cancelled',   'Cancelled'

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
                     'accounts.Organization', on_delete=models.CASCADE,
                     related_name='standalone_tasks'
                   )

    # Core fields
    title       = models.CharField(max_length=255)
    task_type   = models.CharField(max_length=30, choices=TaskType.choices, default=TaskType.INSPECTION)
    priority    = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    description = models.TextField(blank=True)
    status      = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)

    # Creator
    created_by = models.ForeignKey(
                   settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                   related_name='created_tasks'
                 )

    # Assignment — platform user OR external email
    assigned_to       = models.ForeignKey(
                          settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                          null=True, blank=True, related_name='standalone_assigned_tasks'
                        )
    assigned_to_email = models.EmailField(blank=True)
    assigned_to_name  = models.CharField(max_length=255, blank=True)

    # Linked entities (optional)
    order   = models.ForeignKey(
                'core.ProductionOrder', on_delete=models.SET_NULL,
                null=True, blank=True, related_name='standalone_tasks'
              )
    factory = models.ForeignKey(
                'core.Factory', on_delete=models.SET_NULL,
                null=True, blank=True, related_name='standalone_tasks'
              )

    # Schedule
    due_date      = models.DateField()
    reminder_days = models.IntegerField(default=1, help_text='Days before due_date to send reminder')

    # Per-task notification toggles
    notify_assignee   = models.BooleanField(default=True)
    notify_creator    = models.BooleanField(default=True)
    notify_on_overdue = models.BooleanField(default=True)
    cc_emails         = models.JSONField(default=list, blank=True)

    # Attachments (JSON array of file paths)
    attachments = models.JSONField(default=list, blank=True)

    # Timestamps
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_status_display()}]"


class TaskActivity(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task       = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activities')
    user       = models.ForeignKey(
                   settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                   null=True, related_name='task_activities'
                 )
    action     = models.CharField(max_length=50)
    old_value  = models.CharField(max_length=100, blank=True)
    new_value  = models.CharField(max_length=100, blank=True)
    note       = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} on {self.task.title}"
