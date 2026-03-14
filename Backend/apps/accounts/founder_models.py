import uuid
from django.db import models
from django.conf import settings


class AgentAssignment(models.Model):
    """Links a sub_agent user to specific organizations with scoped permissions."""

    AGENT_TYPE_CHOICES = [
        ('client_success', 'Client Success'),
        ('qa_supervisor', 'QA Supervisor'),
        ('technical', 'Technical Support'),
        ('billing', 'Billing Support'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='agent_assignments',
        limit_choices_to={'role': 'sub_agent'},
    )
    agent_type = models.CharField(max_length=30, choices=AGENT_TYPE_CHOICES)
    client_ids = models.JSONField(
        default=list, blank=True,
        help_text="List of Organization UUIDs this agent can access"
    )
    allowed_actions = models.JSONField(
        default=list, blank=True,
        help_text="List of allowed actions: view_reports, add_users, handle_tickets, etc."
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True,
        related_name='agent_assignments_created',
        limit_choices_to={'role': 'super_owner'},
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.agent.email} — {self.get_agent_type_display()}"


class FounderActionLog(models.Model):
    """Immutable audit trail for all founder/agent actions. Never deletable."""

    ACTION_CHOICES = [
        ('impersonate_start', 'Impersonate Start'),
        ('impersonate_end', 'Impersonate End'),
        ('suspend_user', 'Suspend User'),
        ('unsuspend_user', 'Unsuspend User'),
        ('suspend_client', 'Suspend Client'),
        ('unsuspend_client', 'Unsuspend Client'),
        ('create_agent', 'Create Agent'),
        ('revoke_agent', 'Revoke Agent'),
        ('update_agent', 'Update Agent'),
        ('console_login', 'Console Login'),
        ('config_change', 'Config Change'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True,
        related_name='founder_actions',
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name='founder_actions_targeted',
    )
    target_client_id = models.UUIDField(null=True, blank=True)
    target_client_name = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    session_duration_seconds = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['actor', '-timestamp']),
            models.Index(fields=['action']),
        ]

    def __str__(self):
        actor_email = self.actor.email if self.actor else 'unknown'
        return f"[{self.timestamp}] {actor_email} — {self.get_action_display()}"
