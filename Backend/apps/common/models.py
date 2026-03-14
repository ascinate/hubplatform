from django.db import models
from django.conf import settings
import uuid


class Comment(models.Model):
    COMMENT_TYPE_CHOICES = [
        ('general', 'General'),
        ('submission_note', 'Submission Note'),
        ('approval_note', 'Approval Note'),
        ('rejection_reason', 'Rejection Reason'),
        ('challenge', 'Challenge'),
        ('feedback', 'Feedback'),
        ('delay_reason', 'Delay Reason'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(max_length=50, db_index=True)
    entity_id = models.CharField(max_length=50, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments'
    )
    comment_type = models.CharField(max_length=30, choices=COMMENT_TYPE_CHOICES, default='general')
    text = models.TextField()
    attachment_url = models.CharField(max_length=500, blank=True)
    mentions = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.email} on {self.entity_type}:{self.entity_id}"

    class Meta:
        ordering = ['created_at']


class History(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(max_length=50, db_index=True)
    entity_id = models.CharField(max_length=50, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='history_entries'
    )
    field = models.CharField(max_length=100)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} changed {self.field} on {self.entity_type}:{self.entity_id}"

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = 'Histories'


class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    entity_type = models.CharField(max_length=50, db_index=True)
    entity_id = models.CharField(max_length=50, db_index=True)
    file = models.FileField(upload_to='documents/%Y/%m/')
    file_name = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_documents'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_name} ({self.entity_type}:{self.entity_id})"

    class Meta:
        ordering = ['-created_at']


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    entity_type = models.CharField(max_length=50, blank=True)
    entity_id = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{'Read' if self.read else 'Unread'}] {self.title}"

    class Meta:
        ordering = ['-created_at']
