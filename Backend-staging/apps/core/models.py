from django.db import models
from django.conf import settings
import uuid


class Factory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE, related_name='factories'
    )
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    certifications = models.TextField(blank=True)
    audit_compliance = models.CharField(
        max_length=20, blank=True,
        choices=[('compliant', 'Compliant'), ('non_compliant', 'Non-Compliant'), ('pending', 'Pending')]
    )
    last_audit_date = models.DateField(null=True, blank=True)
    production_capacity = models.IntegerField(null=True, blank=True)
    total_manpower = models.IntegerField(null=True, blank=True)
    infrastructure = models.TextField(blank=True)
    contact_person = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Factories'


class ProductionOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('on_hold', 'On Hold'),
        ('cancelled', 'Cancelled'),
        ('on_track', 'On Track'),
        ('warning', 'Warning'),
        ('urgent', 'Urgent'),
        ('delivered', 'Delivered'),
    ]
    CATEGORY_CHOICES = [
        ('garments', 'Garments'),
        ('gloves', 'Gloves'),
        ('footwear', 'Footwear'),
        ('headwear', 'Headwear'),
        ('accessories', 'Accessories'),
        ('bags', 'Bags'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE, related_name='production_orders'
    )
    po_number = models.CharField(max_length=50)
    factory = models.ForeignKey(Factory, on_delete=models.SET_NULL, null=True, blank=True)
    GENDER_CHOICES = [
        ('men', 'Men'),
        ('women', 'Women'),
        ('kids', 'Kids'),
        ('unisex', 'Unisex'),
    ]
    product_name = models.CharField(max_length=255)
    color = models.CharField(max_length=100, blank=True)
    gender = models.CharField(max_length=20, blank=True, choices=GENDER_CHOICES)
    product_category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default='garments'
    )
    quantity = models.IntegerField(default=0)
    completed_quantity = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    description = models.TextField(blank=True)
    order_image_url = models.CharField(max_length=500, blank=True)
    master_order = models.CharField(max_length=255, blank=True)
    country = models.CharField(max_length=100, blank=True)
    progress_percent = models.IntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='production_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def completion_percent(self):
        if self.quantity == 0:
            return 0
        return round((self.completed_quantity / self.quantity) * 100)

    def __str__(self):
        return f"{self.po_number} — {self.product_name}"

    class Meta:
        ordering = ['-created_at']
        unique_together = [['organization', 'po_number']]


INSPECTION_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('scheduled', 'Scheduled'),
    ('confirmed', 'Confirmed'),
    ('in_progress', 'In Progress'),
    ('report_pending', 'Report Pending'),
    ('submitted', 'Submitted'),
    ('approved', 'Approved'),
    ('cancelled', 'Cancelled'),
]


class Inspection(models.Model):
    TYPE_CHOICES = [
        ('pre_production', 'Pre-Production'),
        ('inline', 'Inline'),
        ('final', 'Final'),
        ('lab_test', 'Lab Test'),
        ('fri', 'FRI'),
        ('dupro', 'Dupro'),
        ('pre_final', 'Pre-Final'),
    ]
    RESULT_CHOICES = [
        ('pending', 'Pending'),
        ('pass', 'Pass'),
        ('fail', 'Fail'),
        ('conditional_pass', 'Conditional Pass'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE, related_name='inspections'
    )
    production_order = models.ForeignKey(
        ProductionOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='inspections'
    )
    factory = models.ForeignKey(Factory, on_delete=models.SET_NULL, null=True, blank=True)
    inspection_no = models.CharField(max_length=20, blank=True, db_index=True)
    inspection_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='inline')
    aql_level = models.CharField(max_length=50, blank=True)
    template = models.ForeignKey(
        'templates_engine.InspectionTemplate', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='inspections'
    )
    status = models.CharField(max_length=20, choices=INSPECTION_STATUS_CHOICES, default='draft', db_index=True)
    auditor_name = models.CharField(max_length=255, blank=True)
    inspection_date = models.DateField()
    quantity_inspected = models.IntegerField(default=0)
    defects_found = models.IntegerField(default=0)
    defect_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='pending')
    overall_result = models.CharField(max_length=20, choices=RESULT_CHOICES, null=True, blank=True)
    signature_url = models.CharField(max_length=500, blank=True)
    email_recipients = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='inspections'
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.quantity_inspected > 0:
            self.defect_rate = round((self.defects_found / self.quantity_inspected) * 100, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_inspection_type_display()} — {self.factory} ({self.inspection_date})"

    class Meta:
        ordering = ['-inspection_date', '-created_at']


class LabTest(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE, related_name='lab_tests'
    )
    production_order = models.ForeignKey(
        ProductionOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_tests'
    )
    sample_id = models.CharField(max_length=50)
    test_name = models.CharField(max_length=255)
    test_type = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    pass_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=80)
    notes = models.TextField(blank=True)
    report_file = models.FileField(upload_to='lab-reports/', blank=True, null=True)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='lab_tests'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    @property
    def passed(self):
        if self.score is None:
            return None
        return self.score >= self.pass_threshold

    def __str__(self):
        return f"{self.sample_id} — {self.test_name}"

    class Meta:
        ordering = ['-submitted_at']


class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE, related_name='chat_messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages'
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.email}: {self.message[:50]}"

    class Meta:
        ordering = ['created_at']


class OrderCollaborator(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(ProductionOrder, on_delete=models.CASCADE, related_name='collaborators')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='order_collaborations')
    role = models.CharField(max_length=50, default='viewer')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [['order', 'user']]


class InspectionSection(models.Model):
    RESULT_CHOICES = [('pass', 'Pass'), ('fail', 'Fail'), ('pending', 'Pending'), ('na', 'N/A')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=255)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order']


class InspectionItem(models.Model):
    RESULT_CHOICES = [('pass', 'Pass'), ('fail', 'Fail'), ('pending', 'Pending'), ('na', 'N/A')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.ForeignKey(InspectionSection, on_delete=models.CASCADE, related_name='items')
    label = models.CharField(max_length=255)
    type = models.CharField(max_length=50, default='checklist')
    spec_value = models.CharField(max_length=255, blank=True)
    tolerance = models.CharField(max_length=100, blank=True)
    actual_value = models.CharField(max_length=255, blank=True)
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, null=True, blank=True)
    photo_url = models.CharField(max_length=500, blank=True)
    comment = models.TextField(blank=True)


class InspectionDefect(models.Model):
    SEVERITY_CHOICES = [
        ('critical', 'Critical'), ('major', 'Major'), ('minor', 'Minor'), ('other', 'Other'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    inspection = models.ForeignKey(Inspection, on_delete=models.CASCADE, related_name='defects')
    section_name = models.CharField(max_length=255)
    item_name = models.CharField(max_length=255)
    defect_code = models.CharField(max_length=20)
    defect_name = models.CharField(max_length=255)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='minor')
    quantity = models.IntegerField(default=1)
    photo_url = models.CharField(max_length=500, blank=True)


class DemoLead(models.Model):
    STATUS_CHOICES = [
        ("new", "New"), ("contacted", "Contacted"), ("converted", "Converted"),
    ]
    name = models.CharField(max_length=255)
    email = models.EmailField()
    company = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    role = models.CharField(max_length=100, blank=True)
    factories_count = models.CharField(max_length=20, blank=True)
    monthly_inspections = models.CharField(max_length=50, blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    contacted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} <{self.email}> — {self.company}"

    class Meta:
        ordering = ['-created_at']
