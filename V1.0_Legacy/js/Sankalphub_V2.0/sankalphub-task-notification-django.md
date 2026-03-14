# SankalpHub.in — Task Management, Role Hierarchy & Notification Engine
## Stack-Correct Build Instructions: Django/DRF + PostgreSQL + Next.js

> **Read this first:** Before writing any code, explore the existing codebase as instructed  
> in Part 0. This document is written for **Django REST Framework (backend)**,  
> **PostgreSQL (database)**, and **Next.js (frontend)**. Do not deviate from this stack.
>
> **Goal:** Build a fully functional Task Assignment system with Role-Based Access Control  
> and a live Notification Engine covering in-app alerts and email delivery across  
> Brand, Factory, and 3rd Party users.

---

## PART 0 — Codebase Exploration (Do This Before Anything Else)

Claude Code: explore the following in parallel before planning any implementation.

### 0.1 Backend (Django)

```bash
# Understand project structure
find . -name "models.py" | head -20
find . -name "serializers.py" | head -20
find . -name "views.py" | head -20
find . -name "urls.py" | head -20

# Check installed apps
cat */settings.py | grep INSTALLED_APPS -A 30

# Check existing user model
grep -r "AbstractUser\|AbstractBaseUser\|AUTH_USER_MODEL" --include="*.py"

# Check existing models
cat */models.py

# Check what authentication is in use (JWT / Session / Token)
grep -r "JWT\|simplejwt\|TokenAuthentication\|SessionAuthentication" --include="*.py"

# Check email config
grep -r "EMAIL_BACKEND\|EMAIL_HOST\|SMTP" --include="*.py" --include="*.env"

# Check if celery is already installed (for async tasks/cron)
grep -r "celery\|CELERY" --include="*.py" requirements.txt 2>/dev/null

# Check existing migrations
find . -path "*/migrations/00*.py" | head -10
```

### 0.2 Frontend (Next.js)

```bash
# Understand project structure
ls -la
cat package.json

# Check Next.js version (App Router vs Pages Router matters)
grep '"next"' package.json

# Find existing API calls to understand fetch patterns
grep -r "fetch\|axios\|api/" --include="*.tsx" --include="*.ts" --include="*.jsx" -l

# Check auth approach (NextAuth / custom JWT / cookies)
grep -r "NextAuth\|useSession\|getSession\|jwt\|token" --include="*.tsx" --include="*.ts" -l

# Check existing component structure
find . -name "*.tsx" -not -path "*/node_modules/*" | head -30

# Check if Tailwind is configured
cat tailwind.config.* 2>/dev/null

# Check state management
grep -r "redux\|zustand\|context\|useState" --include="*.tsx" -l | head -10
```

### 0.3 Database

```bash
# Check existing migrations to understand current schema
find . -path "*/migrations/0*.py" -exec grep -l "CreateModel" {} \;

# Check PostgreSQL connection settings
grep -r "DATABASES" --include="*.py" -A 10

# List existing tables (run in Django shell or psql)
python manage.py inspectdb 2>/dev/null | grep "class " | head -30
```

### 0.4 Before Writing Code — Answer These

After exploration, confirm:
- [ ] What is the custom user model? What fields already exist?
- [ ] Does a `role` field already exist on the user model?
- [ ] Is there an existing notifications app or model?
- [ ] What auth method is in use? (JWT tokens / session / NextAuth?)
- [ ] Is Celery available for async tasks and scheduled jobs?
- [ ] What is the API base URL pattern? (e.g. `/api/v1/` or `/api/`)
- [ ] Does Next.js use App Router (`app/`) or Pages Router (`pages/`)?
- [ ] Is there an existing email utility in the Django project?

---

## PART 1 — Role Hierarchy (Django)

### 1.1 Role Constants

In your users app, create or update `users/constants.py`:

```python
class UserRole(models.TextChoices):
    ADMIN            = 'admin',           'Admin'
    QC_MANAGER       = 'qc_manager',      'QC Manager'
    QC_INSPECTOR     = 'qc_inspector',    'QC Inspector'
    FACTORY_MANAGER  = 'factory_manager', 'Factory Manager'
    FACTORY_QC       = 'factory_qc',      'Factory QC'
    THIRD_PARTY      = 'third_party',     'Third Party'
```

### 1.2 Update User Model

**Check your existing user model first.** If it already extends `AbstractUser`,
add only the missing fields. Do NOT recreate the model from scratch.

```python
# users/models.py — ADD these fields to your existing user model only if missing

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # ADD ONLY IF NOT ALREADY PRESENT:
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.QC_INSPECTOR
    )
    factory = models.ForeignKey(
        'factories.Factory',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='users'
    )
    notification_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="Per-user notification toggle preferences"
    )

    def get_default_notification_preferences(self):
        return {
            "task_assigned":   True,
            "task_reminder":   True,
            "task_overdue":    True,
            "task_completed":  True,
            "email_enabled":   True,
            "inapp_enabled":   True,
        }

    def save(self, *args, **kwargs):
        if not self.notification_preferences:
            self.notification_preferences = self.get_default_notification_preferences()
        super().save(*args, **kwargs)
```

After changes: `python manage.py makemigrations && python manage.py migrate`

### 1.3 DRF Permission Classes

Create `users/permissions.py`:

```python
from rest_framework.permissions import BasePermission
from .constants import UserRole

class IsAdminOrQCManager(BasePermission):
    """Only Admin and QC Manager can create/assign tasks."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role in [UserRole.ADMIN, UserRole.QC_MANAGER]
        )

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.ADMIN

class HasPlatformAccess(BasePermission):
    """Blocks third-party users who are email-only."""
    EMAIL_ONLY_ROLES = [UserRole.THIRD_PARTY]

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.role not in self.EMAIL_ONLY_ROLES
        )

class IsTaskAssigneeOrManager(BasePermission):
    """Users can only modify tasks assigned to them, unless they are Admin/Manager."""
    MANAGER_ROLES = [UserRole.ADMIN, UserRole.QC_MANAGER]

    def has_object_permission(self, request, view, obj):
        if request.user.role in self.MANAGER_ROLES:
            return True
        return obj.assigned_to == request.user
```

### 1.4 Role-Based Query Scoping Mixin

Create `tasks/mixins.py`:

```python
from users.constants import UserRole

class RoleScopedTaskMixin:
    """
    Mixin for TaskViewSet — automatically scopes queryset to user's role.
    Apply to any view that returns tasks.
    """
    def get_role_scoped_queryset(self, queryset, user):
        if user.role == UserRole.ADMIN:
            return queryset  # Admin sees everything

        elif user.role == UserRole.QC_MANAGER:
            return queryset.filter(created_by=user)

        elif user.role in [
            UserRole.QC_INSPECTOR,
            UserRole.FACTORY_MANAGER,
            UserRole.FACTORY_QC
        ]:
            return queryset.filter(assigned_to=user)

        return queryset.none()  # Unknown role sees nothing
```

---

## PART 2 — Database Models (Django ORM / PostgreSQL)

### 2.1 Create Tasks App

```bash
python manage.py startapp tasks
# Add 'tasks' to INSTALLED_APPS in settings.py
```

### 2.2 Task Model

`tasks/models.py`:

```python
from django.db import models
from django.conf import settings

class Task(models.Model):

    class TaskType(models.TextChoices):
        INSPECTION          = 'inspection',         'Inspection'
        LAB_TEST            = 'lab_test',           'Lab Test'
        AUDIT               = 'audit',              'Audit'
        DOCUMENT_SUBMISSION = 'document_submission','Document Submission'
        FOLLOW_UP           = 'follow_up',          'Follow Up'
        OTHER               = 'other',              'Other'

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

    # Core fields
    title       = models.CharField(max_length=255)
    task_type   = models.CharField(max_length=30, choices=TaskType.choices, default=TaskType.INSPECTION)
    priority    = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    description = models.TextField(blank=True, null=True)
    status      = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)

    # Relationships
    created_by          = models.ForeignKey(
                            settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                            related_name='created_tasks'
                          )
    assigned_to         = models.ForeignKey(
                            settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                            null=True, blank=True, related_name='assigned_tasks'
                          )
    # For 3rd party / guest assignees (no platform login)
    assigned_to_email   = models.EmailField(blank=True, null=True)
    assigned_to_name    = models.CharField(max_length=255, blank=True, null=True)

    # Links
    order       = models.ForeignKey(
                    'orders.Order', on_delete=models.SET_NULL,
                    null=True, blank=True, related_name='tasks'
                  )
    factory     = models.ForeignKey(
                    'factories.Factory', on_delete=models.SET_NULL,
                    null=True, blank=True, related_name='tasks'
                  )

    # Scheduling
    due_date        = models.DateTimeField()
    reminder_days   = models.IntegerField(default=1)

    # Notification toggles
    notify_assignee     = models.BooleanField(default=True)
    notify_creator      = models.BooleanField(default=True)
    notify_on_overdue   = models.BooleanField(default=True)
    cc_emails           = models.TextField(blank=True, null=True,
                            help_text="Comma-separated additional emails")

    # Attachments stored as list of file paths/URLs
    attachments = models.JSONField(default=list, blank=True)

    # Timestamps
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['created_by', 'status']),
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['factory', 'status']),
        ]

    def __str__(self):
        return f"{self.title} [{self.status}]"
```

### 2.3 Notification Model

```python
class Notification(models.Model):

    class NotificationType(models.TextChoices):
        TASK_ASSIGNED   = 'task_assigned',  'Task Assigned'
        TASK_REMINDER   = 'task_reminder',  'Task Reminder'
        TASK_OVERDUE    = 'task_overdue',   'Task Overdue'
        TASK_COMPLETED  = 'task_completed', 'Task Completed'
        TASK_UPDATED    = 'task_updated',   'Task Updated'
        TASK_CANCELLED  = 'task_cancelled', 'Task Cancelled'

    user        = models.ForeignKey(
                    settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                    related_name='notifications'
                  )
    task        = models.ForeignKey(
                    Task, on_delete=models.SET_NULL,
                    null=True, blank=True, related_name='notifications'
                  )
    type        = models.CharField(max_length=30, choices=NotificationType.choices)
    title       = models.CharField(max_length=255)
    message     = models.TextField()
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
```

### 2.4 Task Activity Log Model

```python
class TaskActivity(models.Model):
    task        = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activity')
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    action      = models.CharField(max_length=100)
    detail      = models.TextField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
```

After all models: `python manage.py makemigrations tasks && python manage.py migrate`

---

## PART 3 — Notification Engine (Django Service Layer)

Create `tasks/services.py` — the central notification engine:

```python
import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class NotificationService:

    @staticmethod
    def create_inapp(user, task, notif_type, title, message):
        """Create an in-app notification if user preferences allow it."""
        from .models import Notification

        try:
            prefs = user.notification_preferences or {}
            if not prefs.get('inapp_enabled', True):
                return
            if not prefs.get(notif_type, True):
                return

            Notification.objects.create(
                user=user,
                task=task,
                type=notif_type,
                title=title,
                message=message,
            )
        except Exception as e:
            logger.error(f"[NotificationService] create_inapp error: {e}")

    @staticmethod
    def send_email(to_email, to_name, subject, html_body):
        """Send an HTML email via Django's email backend."""
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=subject,  # plain text fallback
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[f"{to_name} <{to_email}>" if to_name else to_email],
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send()
            logger.info(f"[NotificationService] Email sent to {to_email} — {subject}")
        except Exception as e:
            logger.error(f"[NotificationService] send_email error: {e}")

    @classmethod
    def trigger(cls, event_type, task, actor_user=None):
        """Master trigger. Call this for every task event."""
        handlers = {
            'task_assigned':  cls._on_task_assigned,
            'task_reminder':  cls._on_task_reminder,
            'task_overdue':   cls._on_task_overdue,
            'task_completed': cls._on_task_completed,
            'task_updated':   cls._on_task_updated,
        }
        handler = handlers.get(event_type)
        if handler:
            handler(task, actor_user)

    @classmethod
    def _on_task_assigned(cls, task, creator_user):
        title   = f"New Task Assigned: {task.title}"
        message = (
            f"{creator_user.get_full_name() or creator_user.username} assigned you a task "
            f"due on {task.due_date.strftime('%d %b %Y, %I:%M %p')}."
        )
        # In-app for platform user
        if task.assigned_to:
            cls.create_inapp(task.assigned_to, task, 'task_assigned', title, message)

        # Email notification
        if task.notify_assignee:
            email = task.assigned_to_email or (task.assigned_to.email if task.assigned_to else None)
            name  = task.assigned_to_name  or (task.assigned_to.get_full_name() if task.assigned_to else '')
            if email:
                cls.send_email(email, name, title,
                    build_email_template(title, message, task, 'View Task'))

        # CC emails
        if task.cc_emails:
            for cc in [e.strip() for e in task.cc_emails.split(',') if e.strip()]:
                cls.send_email(cc, '', f"[CC] {title}",
                    build_email_template(title, message, task, 'View Task'))

    @classmethod
    def _on_task_reminder(cls, task, _actor):
        title   = f"Reminder: \"{task.title}\" is due soon"
        message = f"Your task is due on {task.due_date.strftime('%d %b %Y')}. Please complete it on time."

        if task.assigned_to:
            cls.create_inapp(task.assigned_to, task, 'task_reminder', title, message)
        email = task.assigned_to_email or (task.assigned_to.email if task.assigned_to else None)
        name  = task.assigned_to_name  or (task.assigned_to.get_full_name() if task.assigned_to else '')
        if task.notify_assignee and email:
            cls.send_email(email, name, title,
                build_email_template(title, message, task, 'View Task'))

    @classmethod
    def _on_task_overdue(cls, task, _actor):
        title   = f"OVERDUE: \"{task.title}\""
        message = f"This task passed its due date of {task.due_date.strftime('%d %b %Y')} without completion."

        if task.assigned_to and task.notify_on_overdue:
            cls.create_inapp(task.assigned_to, task, 'task_overdue', title, message)

        # Escalate to task creator
        if task.created_by and task.notify_on_overdue and task.created_by != task.assigned_to:
            cls.create_inapp(
                task.created_by, task, 'task_overdue',
                f"OVERDUE ALERT: \"{task.title}\" not completed",
                f"A task you created has passed its due date. Assigned to: {task.assigned_to_name or 'a team member'}."
            )

        email = task.assigned_to_email or (task.assigned_to.email if task.assigned_to else None)
        name  = task.assigned_to_name  or (task.assigned_to.get_full_name() if task.assigned_to else '')
        if task.notify_on_overdue and email:
            cls.send_email(email, name, title,
                build_email_template(title, message, task, 'View Task', urgency='urgent'))

    @classmethod
    def _on_task_completed(cls, task, completed_by_user):
        title   = f"Task Completed: \"{task.title}\""
        message = f"{completed_by_user.get_full_name() or completed_by_user.username} marked this task as complete."

        if task.notify_creator and task.created_by:
            cls.create_inapp(task.created_by, task, 'task_completed', title, message)

    @classmethod
    def _on_task_updated(cls, task, updater_user):
        title   = f"Task Updated: \"{task.title}\""
        message = f"{updater_user.get_full_name() or updater_user.username} made changes to a task assigned to you."

        if task.assigned_to:
            cls.create_inapp(task.assigned_to, task, 'task_updated', title, message)


def build_email_template(title, message, task, cta_text, urgency='normal'):
    urgency_color = '#DC2626' if urgency == 'urgent' else '#2563EB'
    app_url = getattr(settings, 'APP_URL', 'https://sankalphub.in')
    factory_row = f"""
        <tr>
          <td style="padding:6px 0;font-weight:600;width:140px;">Factory</td>
          <td>{task.factory.name if task.factory else '—'}</td>
        </tr>""" if task.factory else ''
    order_row = f"""
        <tr>
          <td style="padding:6px 0;font-weight:600;">Order No</td>
          <td>{task.order_id or '—'}</td>
        </tr>""" if task.order_id else ''

    return f"""
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;">
      <div style="background:{urgency_color};padding:24px 32px;">
        <h1 style="color:white;margin:0;font-size:20px;">SankalpHub</h1>
        <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">
          Production Intelligence Platform
        </p>
      </div>
      <div style="background:white;padding:32px;border-left:4px solid {urgency_color};">
        <h2 style="color:#1e293b;margin:0 0 12px;font-size:18px;">{title}</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;">{message}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <table style="width:100%;font-size:14px;color:#475569;">
          <tr>
            <td style="padding:6px 0;font-weight:600;width:140px;">Task</td>
            <td>{task.title}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Type</td>
            <td>{task.get_task_type_display()}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Priority</td>
            <td>{task.priority.upper()}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-weight:600;">Due Date</td>
            <td>{task.due_date.strftime('%a, %d %b %Y %I:%M %p')}</td>
          </tr>
          {factory_row}
          {order_row}
        </table>
        <div style="margin-top:28px;text-align:center;">
          <a href="{app_url}/tasks/{task.id}"
             style="background:{urgency_color};color:white;text-decoration:none;
                    padding:12px 28px;border-radius:6px;font-weight:600;
                    font-size:14px;display:inline-block;">
            {cta_text} →
          </a>
        </div>
      </div>
      <div style="padding:16px 32px;text-align:center;font-size:12px;color:#94a3b8;">
        You are receiving this because you are assigned to this task on SankalpHub.in<br>
        Manage your preferences in Settings → Notifications
      </div>
    </div>"""
```

### 3.1 Email Settings (settings.py)

Verify these are present in your Django settings — update with your actual credentials:

```python
# settings.py — confirm these exist, update values as needed
EMAIL_BACKEND    = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST       = 'smtp.gmail.com'
EMAIL_PORT       = 587
EMAIL_USE_TLS    = True
EMAIL_HOST_USER  = 'your-gmail@gmail.com'       # your Gmail address
EMAIL_HOST_PASSWORD = 'your-app-password'        # Gmail App Password (already configured)
DEFAULT_FROM_EMAIL = 'SankalpHub <your-gmail@gmail.com>'
APP_URL          = 'https://sankalphub.in'
```

### 3.2 Overdue Task Cron (Django Management Command)

If **Celery is available**, use `celery beat`. If not, use a Django management command called via system cron.

Create `tasks/management/commands/check_overdue_tasks.py`:

```python
from django.core.management.base import BaseCommand
from django.utils import timezone
from tasks.models import Task
from tasks.services import NotificationService
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Mark overdue tasks and send reminder notifications'

    def handle(self, *args, **options):
        now = timezone.now()

        # 1. Mark tasks as overdue
        overdue_tasks = Task.objects.filter(
            due_date__lt=now,
            status__in=['open', 'in_progress']
        ).select_related('assigned_to', 'created_by', 'factory')

        for task in overdue_tasks:
            task.status = 'overdue'
            task.save(update_fields=['status', 'updated_at'])
            NotificationService.trigger('task_overdue', task)
            logger.info(f"Marked task {task.id} as overdue")

        self.stdout.write(f"Overdue: {overdue_tasks.count()} tasks")

        # 2. Send reminders
        from datetime import timedelta
        from django.db.models import F, ExpressionWrapper, DateTimeField
        from django.db.models.functions import Now

        reminder_tasks = Task.objects.filter(
            status__in=['open', 'in_progress']
        ).select_related('assigned_to', 'factory')

        sent_count = 0
        for task in reminder_tasks:
            reminder_date = task.due_date - timedelta(days=task.reminder_days)
            if reminder_date.date() == now.date():
                NotificationService.trigger('task_reminder', task)
                sent_count += 1

        self.stdout.write(f"Reminders: {sent_count} sent")
        self.stdout.write(self.style.SUCCESS("check_overdue_tasks completed"))
```

Add to system crontab on VPS (runs daily at 00:05):

```bash
# Run: crontab -e on your VPS and add:
5 0 * * * cd /path/to/your/project && python manage.py check_overdue_tasks >> /var/log/sankalphub_cron.log 2>&1
```

---

## PART 4 — DRF API Views & Serializers

### 4.1 Serializers — `tasks/serializers.py`

```python
from rest_framework import serializers
from .models import Task, Notification, TaskActivity

class TaskSerializer(serializers.ModelSerializer):
    created_by_name     = serializers.CharField(source='created_by.get_full_name', read_only=True)
    assigned_to_name_display = serializers.SerializerMethodField()
    factory_name        = serializers.CharField(source='factory.name', read_only=True, default=None)
    status_display      = serializers.CharField(source='get_status_display', read_only=True)
    task_type_display   = serializers.CharField(source='get_task_type_display', read_only=True)
    priority_display    = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'completed_at']

    def get_assigned_to_name_display(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return obj.assigned_to_name


class TaskStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.Status.choices)


class NotificationSerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True, default=None)

    class Meta:
        model = Notification
        fields = ['id', 'task', 'task_title', 'type', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']


class NotificationPreferencesSerializer(serializers.Serializer):
    task_assigned   = serializers.BooleanField(default=True)
    task_reminder   = serializers.BooleanField(default=True)
    task_overdue    = serializers.BooleanField(default=True)
    task_completed  = serializers.BooleanField(default=True)
    email_enabled   = serializers.BooleanField(default=True)
    inapp_enabled   = serializers.BooleanField(default=True)
```

### 4.2 ViewSet — `tasks/views.py`

```python
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Task, Notification, TaskActivity
from .serializers import *
from .services import NotificationService
from .mixins import RoleScopedTaskMixin
from users.permissions import IsAdminOrQCManager, HasPlatformAccess


class TaskViewSet(RoleScopedTaskMixin, viewsets.ModelViewSet):
    serializer_class    = TaskSerializer
    permission_classes  = [permissions.IsAuthenticated, HasPlatformAccess]

    def get_queryset(self):
        qs = Task.objects.select_related(
            'created_by', 'assigned_to', 'factory', 'order'
        )
        return self.get_role_scoped_queryset(qs, self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminOrQCManager()]
        return super().get_permissions()

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)

        # Auto-populate assignee email/name from platform user if assigned_to is set
        if task.assigned_to and not task.assigned_to_email:
            task.assigned_to_email = task.assigned_to.email
            task.assigned_to_name  = task.assigned_to.get_full_name()
            task.save(update_fields=['assigned_to_email', 'assigned_to_name'])

        # Log activity
        TaskActivity.objects.create(
            task=task,
            user=self.request.user,
            action='task_created',
            detail=f"Task created and assigned to {task.assigned_to_name or 'unassigned'}"
        )

        # Fire notification
        NotificationService.trigger('task_assigned', task, self.request.user)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        task = self.get_object()
        serializer = TaskStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']

        # Non-managers can only update their own tasks
        from users.constants import UserRole
        if request.user.role not in [UserRole.ADMIN, UserRole.QC_MANAGER]:
            if task.assigned_to != request.user:
                return Response(
                    {'error': 'You can only update tasks assigned to you.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        old_status  = task.status
        task.status = new_status
        if new_status == Task.Status.COMPLETED:
            task.completed_at = timezone.now()
        task.save(update_fields=['status', 'completed_at', 'updated_at'])

        TaskActivity.objects.create(
            task=task,
            user=request.user,
            action='status_changed',
            detail=f"Status changed from {old_status} to {new_status}"
        )

        if new_status == Task.Status.COMPLETED:
            NotificationService.trigger('task_completed', task, request.user)

        return Response({'success': True, 'status': new_status})

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Quick summary counts for the dashboard widget."""
        qs = self.get_queryset()
        return Response({
            'open':        qs.filter(status='open').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'overdue':     qs.filter(status='overdue').count(),
            'completed':   qs.filter(status='completed').count(),
        })


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class    = NotificationSerializer
    permission_classes  = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).select_related('task')[:50]

    @action(detail=False, methods=['patch'], url_path='read-all')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'success': True})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class NotificationPreferencesView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        prefs = request.user.notification_preferences or {}
        serializer = NotificationPreferencesSerializer(prefs)
        return Response(serializer.data)

    def create(self, request):
        serializer = NotificationPreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.notification_preferences = serializer.validated_data
        request.user.save(update_fields=['notification_preferences'])
        return Response({'success': True, 'preferences': serializer.validated_data})
```

### 4.3 URL Registration — `tasks/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, NotificationViewSet, NotificationPreferencesView

router = DefaultRouter()
router.register(r'tasks',             TaskViewSet,                basename='task')
router.register(r'notifications',     NotificationViewSet,        basename='notification')
router.register(r'notification-prefs',NotificationPreferencesView, basename='notif-prefs')

urlpatterns = [path('', include(router.urls))]
```

In your main `urls.py`:

```python
path('api/', include('tasks.urls')),
```

---

## PART 5 — Next.js Frontend

### 5.1 API Utility (check if this already exists — adapt, don't duplicate)

`lib/api.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://sankalphub.in/api';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}
```

### 5.2 Task Types

`types/task.ts`:

```typescript
export type TaskStatus   = 'open' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType     = 'inspection' | 'lab_test' | 'audit' | 'document_submission' | 'follow_up' | 'other';

export interface Task {
  id:                   number;
  title:                string;
  task_type:            TaskType;
  task_type_display:    string;
  priority:             TaskPriority;
  priority_display:     string;
  description:          string | null;
  status:               TaskStatus;
  status_display:       string;
  created_by:           number;
  created_by_name:      string;
  assigned_to:          number | null;
  assigned_to_name_display: string | null;
  assigned_to_email:    string | null;
  factory:              number | null;
  factory_name:         string | null;
  order:                number | null;
  due_date:             string;
  reminder_days:        number;
  notify_assignee:      boolean;
  notify_creator:       boolean;
  notify_on_overdue:    boolean;
  cc_emails:            string | null;
  created_at:           string;
  completed_at:         string | null;
}

export interface AppNotification {
  id:         number;
  task:       number | null;
  task_title: string | null;
  type:       string;
  title:      string;
  message:    string;
  is_read:    boolean;
  created_at: string;
}

export type UserRole =
  | 'admin' | 'qc_manager' | 'qc_inspector'
  | 'factory_manager' | 'factory_qc' | 'third_party';

export const CAN_CREATE_TASK: UserRole[] = ['admin', 'qc_manager'];
```

### 5.3 Create Task Button on Dashboard

Add to your dashboard component — gated by role:

```tsx
// Show only if user has permission
{CAN_CREATE_TASK.includes(currentUser.role) && (
  <button
    onClick={() => setShowTaskModal(true)}
    className="create-task-btn"
    style={{
      background: '#2563EB', color: 'white',
      padding: '10px 20px', borderRadius: '8px',
      fontWeight: 600, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '8px'
    }}
  >
    + Create Task
  </button>
)}
```

### 5.4 Task Form — All Sections

The form modal collects data in 6 clear sections:

```
SECTION 1 — Task Details
  Task Title*          text input (required)
  Task Type*           select: Inspection / Lab Test / Audit /
                               Document Submission / Follow Up / Other
  Priority*            select: Low / Medium / High / Urgent (color coded)
  Description          textarea (optional)

SECTION 2 — Assignment
  Assignee Type        radio: Platform User | External / Guest
    IF Platform User → User dropdown (fetch /api/users/, exclude admin)
    IF External      → Name (text) + Email (email input)
  CC Emails            text input, comma separated (optional)

SECTION 3 — Link to Work
  Order No             select from existing orders (optional)
  Factory              select from existing factories (optional)

SECTION 4 — Schedule
  Due Date*            datetime-local input (required)
  Reminder             select: 1 day / 3 days / 1 week before due date

SECTION 5 — Notification Settings
  Notify assignee      toggle (default ON)
  Notify me on complete toggle (default ON)
  Alert if overdue     toggle (default ON)

SECTION 6 — Attachments
  File upload          (optional, multiple files)
```

Submit calls: `POST /api/tasks/`

### 5.5 Notification Bell Component

```tsx
'use client'; // if using App Router

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { AppNotification } from '@/types/task';

export function NotificationBell() {
  const [notifications, setNotifications]   = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [isOpen, setIsOpen]                 = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/notifications/');
      setNotifications(data.results || data);
      const unread = await apiFetch('/notifications/unread-count/');
      setUnreadCount(unread.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    await apiFetch('/notifications/read-all/', { method: 'PATCH' });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const TYPE_ICONS: Record<string, string> = {
    task_assigned:  '📋',
    task_reminder:  '⏰',
    task_overdue:   '🔴',
    task_completed: '✅',
    task_updated:   '✏️',
    task_cancelled: '❌',
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)   return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'none', border: 'none', cursor: 'pointer',
                 fontSize: '22px', position: 'relative' }}>
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#DC2626', color: 'white', borderRadius: '50%',
            width: '18px', height: '18px', fontSize: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', right: 0, top: '40px',
          width: '360px', maxHeight: '480px', overflowY: 'auto',
          background: 'white', borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0', zIndex: 1000
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '15px' }}>Notifications</strong>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                style={{ fontSize: '12px', color: '#2563EB', background: 'none',
                         border: 'none', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              No notifications yet
            </div>
          ) : notifications.map(n => (
            <div key={n.id} style={{
              padding: '14px 16px',
              borderLeft: n.is_read ? '4px solid transparent' : '4px solid #2563EB',
              background: n.is_read ? 'white' : '#f0f7ff',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '18px' }}>{TYPE_ICONS[n.type] || '📌'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## PART 6 — Notification Settings Page (Fix & Wire Up)

The page exists but is not functional. Wire it up:

```tsx
'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

const PREF_LABELS = {
  task_assigned:  'Task assigned to me',
  task_reminder:  'Reminder before due date',
  task_overdue:   'Task overdue alert',
  task_completed: 'Task completed (for tasks I created)',
  email_enabled:  'Email notifications',
  inapp_enabled:  'In-app notifications',
};

export default function NotificationSettingsPage() {
  const [prefs, setPrefs]     = useState<Record<string, boolean>>({});
  const [saved, setSaved]     = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/notification-prefs/')
      .then(data => { setPrefs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key: string) =>
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const save = async () => {
    await apiFetch('/notification-prefs/', {
      method: 'POST',
      body: JSON.stringify(prefs),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <p>Loading preferences...</p>;

  const taskPrefs    = ['task_assigned', 'task_reminder', 'task_overdue', 'task_completed'];
  const deliveryPrefs = ['email_enabled', 'inapp_enabled'];

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto', padding: '32px 16px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>
        Notification Preferences
      </h2>

      {[
        { label: 'Task Notifications', keys: taskPrefs },
        { label: 'Delivery Method', keys: deliveryPrefs },
      ].map(group => (
        <div key={group.label} style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#64748b',
                       textTransform: 'uppercase', letterSpacing: '0.05em',
                       marginBottom: '12px' }}>
            {group.label}
          </h3>
          {group.keys.map(key => (
            <div key={key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0', borderBottom: '1px solid #f1f5f9'
            }}>
              <span style={{ fontSize: '14px', color: '#1e293b' }}>
                {PREF_LABELS[key as keyof typeof PREF_LABELS]}
              </span>
              <button
                onClick={() => toggle(key)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none',
                  cursor: 'pointer', transition: 'background 0.2s',
                  background: prefs[key] ? '#2563EB' : '#cbd5e1',
                  position: 'relative'
                }}
              >
                <span style={{
                  position: 'absolute', top: '3px',
                  left: prefs[key] ? '22px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  display: 'block'
                }} />
              </button>
            </div>
          ))}
        </div>
      ))}

      <button onClick={save} style={{
        background: '#2563EB', color: 'white', padding: '12px 28px',
        borderRadius: '8px', border: 'none', cursor: 'pointer',
        fontWeight: 600, fontSize: '14px', width: '100%'
      }}>
        Save Preferences
      </button>
      {saved && (
        <p style={{ textAlign: 'center', color: '#16a34a', marginTop: '12px', fontSize: '14px' }}>
          ✓ Preferences saved successfully
        </p>
      )}
    </div>
  );
}
```

---

## PART 7 — Final Checklist

### Backend
- [ ] Part 0 codebase exploration complete — all questions answered
- [ ] `UserRole` choices added to user model (with migration)
- [ ] `notification_preferences` JSON field added (with migration)
- [ ] `users/permissions.py` created with all permission classes
- [ ] `tasks` app created and added to `INSTALLED_APPS`
- [ ] All 3 models created and migrated (`Task`, `Notification`, `TaskActivity`)
- [ ] `tasks/services.py` created with full `NotificationService`
- [ ] Email settings verified in `settings.py`
- [ ] `tasks/serializers.py` complete
- [ ] `tasks/views.py` complete with all ViewSets
- [ ] `tasks/urls.py` registered in main `urls.py`
- [ ] Management command `check_overdue_tasks` created
- [ ] Cron job registered on VPS via `crontab -e`

### Frontend
- [ ] `lib/api.ts` utility confirmed/created
- [ ] `types/task.ts` types file created
- [ ] "Create Task" button on dashboard — visible only to Admin + QC Manager
- [ ] Task form modal with all 6 sections
- [ ] Task list/table on dashboard with status badges and filters
- [ ] `NotificationBell` component added to navigation
- [ ] Notification Settings page wired to `/api/notification-prefs/`
- [ ] All new UI is mobile responsive

### Testing
- [ ] Create task as Admin → assignee receives in-app notification
- [ ] Create task with external email → email is delivered
- [ ] Mark task complete → creator receives notification
- [ ] Run `python manage.py check_overdue_tasks` manually → verify overdue tasks processed
- [ ] Log in as QC Inspector → confirm only their tasks are visible
- [ ] Log in as Factory Manager → confirm only their factory's tasks visible
- [ ] Disable email in Settings → create task → confirm no email sent
- [ ] Confirm Notification Settings page saves and reloads preferences correctly

---

## Summary Table

| Part | Feature | Stack Component |
|------|---------|----------------|
| 0 | Codebase Exploration | — read only |
| 1 | Role Hierarchy + Permissions | Django models + DRF permissions |
| 2 | Database Models (3 tables) | Django ORM → PostgreSQL |
| 3 | Notification Engine + Email + Cron | Django service + management command |
| 4 | API ViewSets + Serializers + URLs | Django REST Framework |
| 5 | Task Button + Form + Bell | Next.js (App or Pages Router) |
| 6 | Notification Settings Page | Next.js |
| 7 | Integration Testing | Full stack |

---

*SankalpHub.in — Task & Notification System*  
*Stack: Django/DRF + PostgreSQL + Next.js*  
*Architecture: Role-scoped, multi-party (Brand / Factory / 3rd Party)*
