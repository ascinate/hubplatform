import uuid
from django.db import models
from django.conf import settings
from apps.workflow.models import CATEGORY_CHOICES


PHASE_CHOICES = [
    ('product_development', 'Product Development'),
    ('order_management', 'Order Management'),
    ('production_prep', 'Production Preparation'),
    ('production_execution', 'Production Execution'),
    ('quality_control', 'Quality Control'),
    ('logistics', 'Logistics'),
    ('combined_operational', 'Combined Operational'),
    ('quality_system', 'Quality System'),
]

BLOCK_TYPE_CHOICES = [
    ('header', 'Header'),
    ('context', 'Product/Order Context'),
    ('tasks', 'Department Tasks'),
    ('data', 'Technical Data'),
    ('attachments', 'Attachments/Evidence'),
    ('output', 'Department Output'),
    ('approval', 'Approval & Handover'),
]

FIELD_TYPE_CHOICES = [
    ('checkbox', 'Checkbox'),
    ('text', 'Text'),
    ('number', 'Number'),
    ('decimal', 'Decimal'),
    ('dropdown', 'Dropdown'),
    ('date', 'Date'),
    ('file', 'File Upload'),
    ('textarea', 'Text Area'),
    ('signature', 'Signature'),
    ('table', 'Table'),
]

STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('submitted', 'Submitted'),
    ('in_review', 'In Review'),
    ('revision_requested', 'Revision Requested'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
    ('completed', 'Completed'),
]


class InspectionTemplate(models.Model):
    """Template definition — what fields/blocks a department template contains."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE,
        related_name='inspection_templates'
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    phase = models.CharField(max_length=30, choices=PHASE_CHOICES)
    phase_sequence = models.IntegerField(default=0)
    department = models.ForeignKey(
        'workflow.Department', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='inspection_templates'
    )
    product_category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, blank=True, default=''
    )
    submitted_by_role = models.CharField(max_length=100, blank=True, default='')
    reviewed_by_role = models.CharField(max_length=100, blank=True, default='')
    approved_by_role = models.CharField(max_length=100, blank=True, default='')
    next_template_code = models.CharField(max_length=10, blank=True, default='')
    is_builtin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='created_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} — {self.name}"

    class Meta:
        ordering = ['phase_sequence']
        unique_together = [['organization', 'code']]


class TemplateSection(models.Model):
    """One of the 7 universal blocks within a template."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        InspectionTemplate, on_delete=models.CASCADE, related_name='sections'
    )
    block_type = models.CharField(max_length=20, choices=BLOCK_TYPE_CHOICES)
    name = models.CharField(max_length=255)
    sort_order = models.IntegerField(default=0)
    is_visible = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.template.code} → {self.name}"

    class Meta:
        ordering = ['sort_order']
        unique_together = [['template', 'block_type']]


class TemplateField(models.Model):
    """Individual field definition within a section."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.ForeignKey(
        TemplateSection, on_delete=models.CASCADE, related_name='fields'
    )
    label = models.CharField(max_length=255)
    field_key = models.SlugField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    is_required = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    options = models.JSONField(default=list, blank=True)
    default_value = models.CharField(max_length=500, blank=True, default='')
    placeholder = models.CharField(max_length=255, blank=True, default='')
    help_text = models.CharField(max_length=500, blank=True, default='')
    auto_fill_source = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        return f"{self.section.template.code} → {self.label}"

    class Meta:
        ordering = ['sort_order']
        unique_together = [['section', 'field_key']]


class TemplateRecord(models.Model):
    """A filled instance of a template for a specific order."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    template = models.ForeignKey(
        InspectionTemplate, on_delete=models.PROTECT, related_name='records'
    )
    order = models.ForeignKey(
        'core.ProductionOrder', on_delete=models.CASCADE,
        related_name='template_records'
    )
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE,
        related_name='template_records'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='submitted_records'
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_records'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='approved_records'
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    revision_count = models.IntegerField(default=0)
    handover_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.template.code} — Order {self.order_id} ({self.status})"

    class Meta:
        ordering = ['-created_at']


class TemplateFieldValue(models.Model):
    """Stores the value of a single field in a filled record."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.ForeignKey(
        TemplateRecord, on_delete=models.CASCADE, related_name='field_values'
    )
    field = models.ForeignKey(
        TemplateField, on_delete=models.PROTECT, related_name='values'
    )
    value_text = models.TextField(blank=True, default='')
    value_number = models.DecimalField(
        max_digits=15, decimal_places=4, null=True, blank=True
    )
    value_date = models.DateField(null=True, blank=True)
    value_boolean = models.BooleanField(null=True, blank=True)
    value_file = models.FileField(
        upload_to='template-values/%Y/%m/', blank=True, null=True
    )
    value_json = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = [['record', 'field']]
