import uuid
from django.db import models
from django.conf import settings


class CollaborationRoom(models.Model):
    ROOM_TYPE_CHOICES = [
        ('po', 'Production Order'),
        ('factory', 'Factory'),
        ('inspection', 'Inspection'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'accounts.Organization', on_delete=models.CASCADE,
        related_name='collaboration_rooms'
    )
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    production_order = models.ForeignKey(
        'core.ProductionOrder', on_delete=models.CASCADE,
        null=True, blank=True, related_name='collaboration_rooms'
    )
    factory = models.ForeignKey(
        'core.Factory', on_delete=models.CASCADE,
        null=True, blank=True, related_name='collaboration_rooms'
    )
    inspection = models.ForeignKey(
        'core.Inspection', on_delete=models.CASCADE,
        null=True, blank=True, related_name='collaboration_rooms'
    )
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'room_type', 'production_order'],
                condition=models.Q(room_type='po'),
                name='unique_po_room'
            ),
            models.UniqueConstraint(
                fields=['organization', 'room_type', 'factory'],
                condition=models.Q(room_type='factory'),
                name='unique_factory_room'
            ),
            models.UniqueConstraint(
                fields=['organization', 'room_type', 'inspection'],
                condition=models.Q(room_type='inspection'),
                name='unique_inspection_room'
            ),
        ]

    def __str__(self):
        return self.name


class RoomParticipant(models.Model):
    PARTICIPANT_ROLE_CHOICES = [
        ('member', 'Member'),
        ('moderator', 'Moderator'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        CollaborationRoom, on_delete=models.CASCADE, related_name='participants'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='room_participations'
    )
    participant_role = models.CharField(
        max_length=20, choices=PARTICIPANT_ROLE_CHOICES, default='member'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [['room', 'user']]

    def __str__(self):
        return f"{self.user.email} in {self.room.name}"


class CollaborationMessage(models.Model):
    MESSAGE_TYPE_CHOICES = [
        ('text', 'Text'),
        ('photo', 'Photo'),
        ('document', 'Document'),
        ('approval_request', 'Approval Request'),
        ('approval_response', 'Approval Response'),
        ('inspection_activation', 'Inspection Activation Request'),
        ('system', 'System Message'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        CollaborationRoom, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='collaboration_messages'
    )
    message_type = models.CharField(
        max_length=30, choices=MESSAGE_TYPE_CHOICES, default='text'
    )
    text = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to='collaboration/%Y/%m/', blank=True, null=True
    )
    attachment_name = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.email}: {self.text[:50] or self.message_type}"


class ApprovalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        CollaborationRoom, on_delete=models.CASCADE, related_name='approvals'
    )
    message = models.OneToOneField(
        CollaborationMessage, on_delete=models.CASCADE,
        related_name='approval', null=True, blank=True
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='approval_requests_sent'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='approval_requests_received'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    responded_at = models.DateTimeField(null=True, blank=True)
    response_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Approval: {self.title} ({self.status})"


class InspectionActivationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('activated', 'Activated'),
        ('declined', 'Declined'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        CollaborationRoom, on_delete=models.CASCADE,
        related_name='activation_requests'
    )
    inspection = models.ForeignKey(
        'core.Inspection', on_delete=models.CASCADE,
        related_name='activation_requests'
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='activation_requests'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    note = models.TextField(blank=True)
    location_lat = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    location_lng = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='activation_responses'
    )
    responded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Activation: {self.inspection} ({self.status})"
