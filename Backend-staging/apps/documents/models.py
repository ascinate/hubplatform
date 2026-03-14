import uuid
from django.db import models
from django.conf import settings


DEPARTMENT_CHOICES = [
    ('design', 'Design'),
    ('sampling', 'Sampling'),
    ('costing', 'Costing'),
    ('production', 'Production'),
    ('quality', 'Quality'),
    ('packing', 'Packing'),
    ('lab_testing', 'Lab Testing'),
    ('logistics', 'Logistics'),
]

DOC_CATEGORY_CHOICES = [
    ('tech_pack', 'Tech Pack'),
    ('lab_report', 'Lab Report'),
    ('shipping_doc', 'Shipping Document'),
    ('invoice', 'Invoice'),
    ('certificate', 'Certificate'),
    ('inspection_report', 'Inspection Report'),
    ('sample_photo', 'Sample Photo'),
    ('packing_list', 'Packing List'),
    ('defect_photo', 'Defect Photo'),
    ('audit_report', 'Audit Report'),
    ('sop', 'SOP'),
    ('other', 'Other'),
]

VISIBILITY_CHOICES = [
    ('private', 'Only Uploader'),
    ('team', 'Same Organization'),
    ('brand', 'Brand Can See'),
    ('shared', 'Via Link'),
]

ACTION_CHOICES = [
    ('upload', 'Uploaded'),
    ('view', 'Viewed'),
    ('download', 'Downloaded'),
    ('delete', 'Deleted'),
    ('share_created', 'Share Link Created'),
    ('share_accessed', 'Accessed via Share Link'),
    ('export_pdf', 'Exported as PDF'),
    ('email_share', 'Shared via Email'),
    ('save_draft', 'Saved as Draft'),
]


class ManagedDocument(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE, related_name='managed_documents'
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='dms/%Y/%m/')
    file_type = models.CharField(max_length=20, blank=True)
    file_size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    storage_key = models.CharField(max_length=500, blank=True)

    order = models.ForeignKey(
        'core.ProductionOrder', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='managed_documents'
    )
    factory = models.ForeignKey(
        'core.Factory', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='managed_documents'
    )
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, blank=True)
    doc_category = models.CharField(max_length=50, choices=DOC_CATEGORY_CHOICES, blank=True, default='other')

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dms_uploaded_documents'
    )
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='team')
    description = models.TextField(blank=True)

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='deleted_documents'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'is_deleted']),
            models.Index(fields=['order', 'is_deleted']),
            models.Index(fields=['factory', 'is_deleted']),
            models.Index(fields=['department']),
        ]

    def __str__(self):
        return f'{self.name} ({self.file_type})'


class DocumentAccessLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        ManagedDocument, on_delete=models.CASCADE, related_name='access_logs'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='document_access_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['document', 'timestamp']),
        ]

    def __str__(self):
        user_name = self.user.full_name if self.user else 'Anonymous'
        return f'{user_name} {self.action} {self.document.name}'


class ShareLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        ManagedDocument, on_delete=models.CASCADE, related_name='share_links'
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_share_links'
    )
    recipient_email = models.EmailField(blank=True)
    recipient_name = models.CharField(max_length=255, blank=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    access_count = models.IntegerField(default=0)
    max_access = models.IntegerField(default=10)
    requires_watermark = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['document', 'is_revoked']),
        ]

    def __str__(self):
        return f'Share: {self.document.name} → {self.recipient_email or "anyone"}'

    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_revoked and not self.is_expired and self.access_count < self.max_access
