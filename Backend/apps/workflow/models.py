from django.db import models
from django.conf import settings
import uuid


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE, related_name='departments'
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    head_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='headed_departments'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

    class Meta:
        ordering = ['name']
        unique_together = [['organization', 'code']]


CATEGORY_CHOICES = [
    ('garments', 'Garments'),
    ('gloves', 'Gloves'),
    ('footwear', 'Footwear'),
    ('headwear', 'Headwear'),
    ('accessories', 'Accessories'),
    ('bags', 'Bags'),
]


class WorkflowTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE, related_name='workflow_templates'
    )
    name = models.CharField(max_length=255)
    product_category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, blank=True, default=''
    )
    stages_json = models.JSONField(default=list, help_text='Legacy field — use template_stages relation instead')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class WorkflowTemplateStage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        WorkflowTemplate, on_delete=models.CASCADE, related_name='template_stages'
    )
    stage_name = models.CharField(max_length=150)
    stage_code = models.CharField(max_length=50)
    sequence_number = models.IntegerField()
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='template_stages'
    )
    approver_role = models.CharField(max_length=100, blank=True)
    is_required = models.BooleanField(default=True)
    typical_duration_days = models.IntegerField(default=3)
    description = models.TextField(blank=True)
    on_fail_go_to_seq = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.sequence_number}. {self.stage_name}"

    class Meta:
        ordering = ['sequence_number']
        unique_together = [['template', 'sequence_number']]


class WorkflowStage(models.Model):
    STAGE_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('skipped', 'Skipped'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        'core.ProductionOrder', on_delete=models.CASCADE, related_name='workflow_stages'
    )
    name = models.CharField(max_length=255)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    # Gate logic fields
    status = models.CharField(max_length=20, choices=STAGE_STATUS_CHOICES, default='pending')
    stage_code = models.CharField(max_length=50, blank=True)
    sequence_number = models.IntegerField(default=0)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='workflow_stages'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='assigned_stages'
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approver_stages'
    )
    planned_start_date = models.DateField(null=True, blank=True)
    planned_end_date = models.DateField(null=True, blank=True)
    actual_start_date = models.DateField(null=True, blank=True)
    actual_end_date = models.DateField(null=True, blank=True)
    is_delayed = models.BooleanField(default=False)
    delay_days = models.IntegerField(default=0)
    is_required = models.BooleanField(default=True)
    on_fail_go_to_seq = models.IntegerField(null=True, blank=True)
    template_stage = models.ForeignKey(
        WorkflowTemplateStage, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='instances'
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.order.po_number})"

    class Meta:
        ordering = ['sequence_number', 'sort_order']


class WorkflowTask(models.Model):
    STATUS_CHOICES = [
        ('NOT_PLANNED', 'Not Planned'),
        ('PLANNED', 'Planned'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
        ('NOT_APPLICABLE', 'Not Applicable'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stage = models.ForeignKey(WorkflowStage, on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=255)
    plan_start = models.DateField(null=True, blank=True)
    plan_end = models.DateField(null=True, blank=True)
    actual_date = models.DateField(null=True, blank=True)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_tasks'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_PLANNED')
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Extended fields
    is_completed = models.BooleanField(default=False)
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='completed_tasks'
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    output_type = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.name} [{self.status}]"

    class Meta:
        ordering = ['sort_order']
