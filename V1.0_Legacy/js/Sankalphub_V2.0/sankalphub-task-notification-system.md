# SankalpHub.in — Task Management, Role Hierarchy & Notification Engine
## Definitive Build Instructions — Django/DRF + PostgreSQL + Next.js 14

> **Stack:** Django 5.1.6 + DRF + PostgreSQL | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand + Axios
> **Backend:** `/opt/sankalp-backend/` | **Frontend:** `/var/www/Sankalphub_V2.0/`
> **Goal:** Build a standalone Task Assignment system with role-based access and a live Notification Engine
> covering in-app alerts and email delivery across Brand, Factory, and 3rd Party users.
> **Audience:** Director-level review — production quality expected at every layer.

---

## PART 0 — Codebase Audit (Pre-Answered)

### 0.1 What Already Exists — DO NOT Rebuild

| Feature | Location | Status |
|---------|----------|--------|
| **User model** (UUID, email auth, 6 roles) | `apps/accounts/models.py` | Done |
| **Organization model** (plan, trial) | `apps/accounts/models.py` | Done |
| **Notification model** (generic) | `apps/common/models.py` — `user`, `type`, `title`, `message`, `read`, `entity_type`, `entity_id` | Done |
| **Notification API** (list, unread-count, mark-read) | `apps/common/views.py` + `apps/common/urls.py` | Done |
| **Notification bell + dropdown** | `src/components/layout/TopBar.tsx` — bell icon, red badge, 30s polling, Lucide icons | Done |
| **Branded email system** | `apps/accounts/emails.py` — `_base_html()` + `_send()` helpers | Done |
| **WorkflowTask** (stage-coupled) | `apps/workflow/models.py` — tied to WorkflowStage, NOT standalone | Keep as-is |
| **Tasks page** | `src/app/(dashboard)/tasks/page.tsx` — shows WorkflowTasks | **Rewrite** |
| **Settings tab 6 "Notifications"** | `src/app/(dashboard)/settings/page.tsx` — "Coming Soon" placeholder | **Wire up** |
| **API client** | `src/lib/api.ts` — Axios + JWT auto-refresh + interceptors | Done |
| **Auth store** | `src/lib/auth-store.ts` — Zustand with user/role/org | Done |
| **Comment model** (generic) | `apps/common/models.py` — entity_type/entity_id pattern | Done |
| **Document model** (generic) | `apps/common/models.py` — file upload pattern | Done |
| **Department model** | `apps/workflow/models.py` — org-scoped departments | Done |
| **Delay check cron** | `apps/workflow/management/commands/check_workflow_delays.py` — runs 02:30 UTC | Done |

### 0.2 Existing Stack Details

| Component | Detail |
|-----------|--------|
| **Custom User Model** | `apps.accounts.User` — `AbstractBaseUser`, UUID PK, `email` login, `full_name`, `role`, `organization` FK, `department` FK |
| **User roles** | `admin`, `org_admin`, `user`, `brand`, `factory`, `third_party` (CharField choices) |
| **Auth** | JWT via `djangorestframework-simplejwt` — access + refresh tokens stored in localStorage |
| **Email** | Gmail SMTP — `naveenkool786@gmail.com` with App Password, `DEFAULT_FROM_EMAIL = 'SANKALP <...>'` |
| **Celery** | NOT installed — use Django management commands + system crontab |
| **API base URL** | `https://app.sankalphub.in/api/` (no `/v1/`) |
| **Frontend router** | Next.js 14 App Router (`src/app/`) |
| **State management** | Zustand (`useAuthStore`) + React hooks |
| **Icons** | Lucide React (`lucide-react`) |
| **Toasts** | `sonner` library |
| **CSS** | Tailwind CSS 3 with custom design tokens (primary: #E67E22, sidebar: #1A1A2E) |

### 0.3 What Needs to Be Built

| # | Feature | Where |
|---|---------|-------|
| 1 | `notification_preferences` JSONField on User | `apps/accounts/models.py` + migration |
| 2 | New `apps/tasks/` Django app (Task, TaskActivity models) | Backend |
| 3 | Task notification service | `apps/tasks/services.py` |
| 4 | Task email template | `apps/accounts/emails.py` (add function) |
| 5 | Task CRUD API endpoints | `apps/tasks/views.py` + `urls.py` |
| 6 | Mark-all-read endpoint | `apps/common/views.py` (add function) |
| 7 | Notification preferences endpoint | `apps/accounts/views.py` (add function) |
| 8 | Overdue task cron | `apps/tasks/management/commands/check_task_overdue.py` |
| 9 | CreateTaskModal component | `src/components/tasks/CreateTaskModal.tsx` |
| 10 | TaskDetailPanel component | `src/components/tasks/TaskDetailPanel.tsx` |
| 11 | Tasks page rewrite | `src/app/(dashboard)/tasks/page.tsx` |
| 12 | NotificationSettings component | `src/components/settings/NotificationSettings.tsx` |
| 13 | TopBar enhancements (mark-all, task icons) | `src/components/layout/TopBar.tsx` |

### 0.4 Ground Rules
- Preserve ALL existing functionality — this is additive work only
- Every new field must have a safe default (no breaking migrations)
- Every API endpoint must validate the logged-in user's role before returning data
- All frontend components use Tailwind CSS + Lucide icons + sonner toasts (no inline styles)
- Mobile responsive from day one

---

## PART 1 — Role Hierarchy & User Model Updates

### 1.1 Existing Roles (No Changes Needed)

The User model at `apps/accounts/models.py` already defines 6 roles:

```python
ROLE_CHOICES = [
    ('admin', 'Admin'),
    ('org_admin', 'Org Admin'),
    ('user', 'User'),
    ('brand', 'Brand'),
    ('factory', 'Factory'),
    ('third_party', 'Third Party'),
]
```

### 1.2 Role → Task Permission Mapping

| Role | Create Tasks | View Tasks | Update Status | Manage Users |
|------|-------------|------------|---------------|-------------|
| `admin` | All tasks | All org tasks | Any task | Yes |
| `org_admin` | All tasks | All org tasks | Any task | Yes |
| `user` | No | Assigned to them + created by them | Own tasks only | No |
| `brand` | No | Tasks on orders they collaborate on | Own tasks only | No |
| `factory` | No | Tasks linked to their factory | Own tasks only | No |
| `third_party` | No | Email-only (no platform access) | N/A | No |

### 1.3 Add `notification_preferences` to User Model

**File:** `/opt/sankalp-backend/apps/accounts/models.py`

Add this field to the existing `User` class:

```python
notification_preferences = models.JSONField(
    default=dict,
    blank=True,
    help_text="Per-user notification toggle preferences"
)
```

**Default structure** (populated at read-time by the service layer, not `save()`):

```python
DEFAULT_NOTIFICATION_PREFERENCES = {
    "task_assigned":    {"in_app": True, "email": True},
    "task_reminder":    {"in_app": True, "email": True},
    "task_overdue":     {"in_app": True, "email": True},
    "task_completed":   {"in_app": True, "email": False},
    "task_updated":     {"in_app": True, "email": False},
    "task_cancelled":   {"in_app": True, "email": False},
    "stage_submitted":  {"in_app": True, "email": False},
    "stage_approved":   {"in_app": True, "email": False},
    "stage_rejected":   {"in_app": True, "email": True},
    "delay_alert":      {"in_app": True, "email": True},
}
```

Run: `cd /opt/sankalp-backend && venv/bin/python manage.py makemigrations accounts && venv/bin/python manage.py migrate`

### 1.4 DRF Permission Helpers

**File:** `/opt/sankalp-backend/apps/tasks/permissions.py`

```python
from rest_framework.permissions import BasePermission


TASK_CREATOR_ROLES = ['admin', 'org_admin']


class CanCreateTask(BasePermission):
    """Only admin and org_admin can create/assign tasks."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in TASK_CREATOR_ROLES
        )


class IsTaskOwnerOrAdmin(BasePermission):
    """Task assignee can update status. Admin/org_admin can update anything."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in TASK_CREATOR_ROLES:
            return True
        return obj.assigned_to == request.user
```

### 1.5 Role-Based Query Scoping

Used in task list views to filter queryset by role:

```python
def scope_tasks_for_user(queryset, user):
    """Return tasks visible to this user based on their role."""
    if user.role in ('admin', 'org_admin'):
        return queryset.filter(organization=user.organization)
    elif user.role == 'factory':
        return queryset.filter(
            models.Q(assigned_to=user) | models.Q(factory__in=user.organization.factories.all())
        ).filter(organization=user.organization)
    elif user.role == 'brand':
        return queryset.filter(
            models.Q(assigned_to=user) | models.Q(order__collaborators=user)
        ).filter(organization=user.organization).distinct()
    else:  # user, third_party
        return queryset.filter(
            models.Q(assigned_to=user) | models.Q(created_by=user)
        ).filter(organization=user.organization)
```

---

## PART 2 — Database Models

### 2.1 Create Tasks App

```bash
cd /opt/sankalp-backend
mkdir -p apps/tasks/management/commands
touch apps/tasks/__init__.py apps/tasks/apps.py apps/tasks/models.py
touch apps/tasks/serializers.py apps/tasks/views.py apps/tasks/urls.py
touch apps/tasks/services.py apps/tasks/permissions.py apps/tasks/admin.py
touch apps/tasks/management/__init__.py apps/tasks/management/commands/__init__.py
```

**`apps/tasks/apps.py`:**
```python
from django.apps import AppConfig

class TasksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tasks'
    verbose_name = 'Tasks'
```

Add to `INSTALLED_APPS` in `/opt/sankalp-backend/config/settings.py`:
```python
INSTALLED_APPS = [
    ...
    'apps.tasks.apps.TasksConfig',
]
```

### 2.2 Task Model

**File:** `/opt/sankalp-backend/apps/tasks/models.py`

```python
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
                          null=True, blank=True, related_name='assigned_tasks'
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
    action     = models.CharField(max_length=50)  # created, status_changed, assigned, attachment_added
    old_value  = models.CharField(max_length=100, blank=True)
    new_value  = models.CharField(max_length=100, blank=True)
    note       = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} on {self.task.title}"
```

### 2.3 Notification Model — REUSE EXISTING

The `Notification` model at `apps/common/models.py` already supports task notifications via its generic `entity_type` / `entity_id` pattern:

```python
# EXISTING — no changes needed to the model
class Notification(models.Model):
    user        = models.ForeignKey(...)
    type        = models.CharField(max_length=255)  # Free text — add new types below
    title       = models.CharField(max_length=255)
    message     = models.TextField()
    read        = models.BooleanField(default=False)
    entity_type = models.CharField(max_length=50, blank=True)  # e.g. 'task'
    entity_id   = models.CharField(max_length=100, blank=True) # e.g. task UUID
    created_at  = models.DateTimeField(auto_now_add=True)
```

**New notification types** (just string values — no migration needed):
- `task_assigned`, `task_reminder`, `task_overdue`, `task_completed`, `task_updated`, `task_cancelled`

Run migrations:
```bash
cd /opt/sankalp-backend
venv/bin/python manage.py makemigrations tasks
venv/bin/python manage.py migrate
```

---

## PART 3 — Notification Engine

### 3.1 Task Notification Service

**File:** `/opt/sankalp-backend/apps/tasks/services.py`

```python
import logging
from datetime import date, timedelta
from apps.common.models import Notification
from apps.accounts.emails import send_task_notification_email

logger = logging.getLogger(__name__)

DEFAULT_NOTIFICATION_PREFERENCES = {
    "task_assigned":   {"in_app": True, "email": True},
    "task_reminder":   {"in_app": True, "email": True},
    "task_overdue":    {"in_app": True, "email": True},
    "task_completed":  {"in_app": True, "email": False},
    "task_updated":    {"in_app": True, "email": False},
    "task_cancelled":  {"in_app": True, "email": False},
}


def _get_prefs(user, event_type):
    """Get user's preference for a notification type, falling back to defaults."""
    prefs = user.notification_preferences or {}
    defaults = DEFAULT_NOTIFICATION_PREFERENCES.get(event_type, {"in_app": True, "email": False})
    type_prefs = prefs.get(event_type, defaults)
    # Support both flat (legacy) and nested format
    if isinstance(type_prefs, bool):
        return {"in_app": type_prefs, "email": type_prefs}
    return type_prefs


def _create_inapp(user, task, event_type, title, message):
    """Create in-app notification if user preferences allow."""
    try:
        prefs = _get_prefs(user, event_type)
        if not prefs.get("in_app", True):
            return
        Notification.objects.create(
            user=user,
            type=event_type,
            title=title,
            message=message,
            entity_type='task',
            entity_id=str(task.id),
        )
    except Exception as e:
        logger.error(f"[TaskNotification] create_inapp error: {e}")


def _send_email(user_or_email, task, event_type, title, message, urgency='normal'):
    """Send email notification if user preferences allow."""
    try:
        email = None
        name = ''
        if hasattr(user_or_email, 'email'):
            prefs = _get_prefs(user_or_email, event_type)
            if not prefs.get("email", False):
                return
            email = user_or_email.email
            name = user_or_email.full_name
        else:
            email = user_or_email
        if email:
            send_task_notification_email(email, name, task, event_type, title, message, urgency)
    except Exception as e:
        logger.error(f"[TaskNotification] send_email error: {e}")


def notify_task_event(task, event_type, actor=None):
    """
    Central dispatcher — call for every task event.
    Handles in-app + email notifications based on user preferences.
    """
    handlers = {
        'task_assigned':  _on_task_assigned,
        'task_reminder':  _on_task_reminder,
        'task_overdue':   _on_task_overdue,
        'task_completed': _on_task_completed,
        'task_updated':   _on_task_updated,
        'task_cancelled': _on_task_cancelled,
    }
    handler = handlers.get(event_type)
    if handler:
        try:
            handler(task, actor)
        except Exception as e:
            logger.error(f"[TaskNotification] {event_type} error: {e}")


def _on_task_assigned(task, actor):
    actor_name = actor.full_name if actor else 'System'
    title = f"New Task Assigned: {task.title}"
    message = f"{actor_name} assigned you a task due on {task.due_date.strftime('%d %b %Y')}."

    if task.assigned_to and task.notify_assignee:
        _create_inapp(task.assigned_to, task, 'task_assigned', title, message)
        _send_email(task.assigned_to, task, 'task_assigned', title, message)

    # External assignee (email only)
    if not task.assigned_to and task.assigned_to_email and task.notify_assignee:
        _send_email(task.assigned_to_email, task, 'task_assigned', title, message)

    # CC emails
    for cc in (task.cc_emails or []):
        cc = cc.strip() if isinstance(cc, str) else ''
        if cc:
            _send_email(cc, task, 'task_assigned', f"[CC] {title}", message)


def _on_task_reminder(task, _actor):
    title = f'Reminder: "{task.title}" is due soon'
    message = f"Your task is due on {task.due_date.strftime('%d %b %Y')}. Please complete it on time."

    if task.assigned_to:
        _create_inapp(task.assigned_to, task, 'task_reminder', title, message)
        _send_email(task.assigned_to, task, 'task_reminder', title, message)
    elif task.assigned_to_email:
        _send_email(task.assigned_to_email, task, 'task_reminder', title, message)


def _on_task_overdue(task, _actor):
    title = f'OVERDUE: "{task.title}"'
    message = f"This task passed its due date of {task.due_date.strftime('%d %b %Y')} without completion."

    # Notify assignee
    if task.assigned_to and task.notify_on_overdue:
        _create_inapp(task.assigned_to, task, 'task_overdue', title, message)
        _send_email(task.assigned_to, task, 'task_overdue', title, message, urgency='urgent')

    # Escalate to creator
    if task.created_by and task.notify_on_overdue and task.created_by != task.assigned_to:
        escalation = f'A task you created ("{task.title}") has passed its due date.'
        _create_inapp(task.created_by, task, 'task_overdue', f'OVERDUE ALERT: {task.title}', escalation)


def _on_task_completed(task, actor):
    actor_name = actor.full_name if actor else 'Someone'
    title = f'Task Completed: "{task.title}"'
    message = f"{actor_name} marked this task as complete."

    if task.notify_creator and task.created_by:
        _create_inapp(task.created_by, task, 'task_completed', title, message)
        _send_email(task.created_by, task, 'task_completed', title, message)


def _on_task_updated(task, actor):
    actor_name = actor.full_name if actor else 'Someone'
    title = f'Task Updated: "{task.title}"'
    message = f"{actor_name} made changes to a task assigned to you."

    if task.assigned_to:
        _create_inapp(task.assigned_to, task, 'task_updated', title, message)


def _on_task_cancelled(task, actor):
    actor_name = actor.full_name if actor else 'System'
    title = f'Task Cancelled: "{task.title}"'
    message = f"{actor_name} cancelled this task."

    if task.assigned_to:
        _create_inapp(task.assigned_to, task, 'task_cancelled', title, message)
```

### 3.2 Task Email Template

**File:** `/opt/sankalp-backend/apps/accounts/emails.py` — ADD this function (uses existing `_base_html()` + `_send()` pattern):

```python
def send_task_notification_email(to_email, to_name, task, event_type, title, message, urgency='normal'):
    """Branded task notification email."""
    urgency_color = '#DC2626' if urgency == 'urgent' else '#E67E22'
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://sankalphub.in')

    factory_row = ''
    if task.factory:
        factory_row = f'<tr><td style="padding:6px 0;font-weight:600;width:140px;">Factory</td><td>{task.factory.name}</td></tr>'

    order_row = ''
    if task.order:
        order_row = f'<tr><td style="padding:6px 0;font-weight:600;">Order No</td><td>{task.order.po_number}</td></tr>'

    body = f"""
    <h2 style="color:#1e293b;margin:0 0 12px;font-size:18px;">{title}</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">{message}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <table style="width:100%;font-size:14px;color:#475569;">
      <tr><td style="padding:6px 0;font-weight:600;width:140px;">Task</td><td>{task.title}</td></tr>
      <tr><td style="padding:6px 0;font-weight:600;">Type</td><td>{task.get_task_type_display()}</td></tr>
      <tr><td style="padding:6px 0;font-weight:600;">Priority</td><td>{task.get_priority_display()}</td></tr>
      <tr><td style="padding:6px 0;font-weight:600;">Due Date</td><td>{task.due_date.strftime('%a, %d %b %Y')}</td></tr>
      {factory_row}
      {order_row}
    </table>
    <div style="margin-top:28px;text-align:center;">
      <a href="{frontend_url}/tasks"
         style="background:{urgency_color};color:white;text-decoration:none;
                padding:12px 28px;border-radius:6px;font-weight:600;
                font-size:14px;display:inline-block;">
        View Task →
      </a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center;">
      Manage your notification preferences in Settings → Notifications
    </p>
    """
    html = _base_html(body)
    _send(to_email, title, html)
```

### 3.3 Overdue Task Cron (Management Command)

**File:** `/opt/sankalp-backend/apps/tasks/management/commands/check_task_overdue.py`

```python
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
```

**Register cron** (add to VPS crontab via `crontab -e`):
```bash
0 3 * * * cd /opt/sankalp-backend && /opt/sankalp-backend/venv/bin/python manage.py check_task_overdue >> /var/log/sankalp-task-overdue.log 2>&1
```

---

## PART 4 — Backend API (DRF Views + Serializers + URLs)

### 4.1 Serializers

**File:** `/opt/sankalp-backend/apps/tasks/serializers.py`

```python
from rest_framework import serializers
from .models import Task, TaskActivity


class TaskSerializer(serializers.ModelSerializer):
    created_by_name      = serializers.CharField(source='created_by.full_name', read_only=True)
    assigned_to_name_display = serializers.SerializerMethodField()
    order_po_number      = serializers.CharField(source='order.po_number', read_only=True, default='')
    factory_name         = serializers.CharField(source='factory.name', read_only=True, default='')
    status_display       = serializers.CharField(source='get_status_display', read_only=True)
    task_type_display    = serializers.CharField(source='get_task_type_display', read_only=True)
    priority_display     = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'organization', 'title', 'task_type', 'task_type_display',
            'priority', 'priority_display', 'description', 'status', 'status_display',
            'created_by', 'created_by_name',
            'assigned_to', 'assigned_to_name_display', 'assigned_to_email', 'assigned_to_name',
            'order', 'order_po_number', 'factory', 'factory_name',
            'due_date', 'reminder_days',
            'notify_assignee', 'notify_creator', 'notify_on_overdue', 'cc_emails',
            'attachments', 'completed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'created_by', 'created_at', 'updated_at', 'completed_at']

    def get_assigned_to_name_display(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.full_name or obj.assigned_to.email
        return obj.assigned_to_name or ''


class TaskActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True, default='')

    class Meta:
        model = TaskActivity
        fields = ['id', 'task', 'user', 'user_name', 'action', 'old_value', 'new_value', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']
```

### 4.2 Views

**File:** `/opt/sankalp-backend/apps/tasks/views.py`

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import Task, TaskActivity
from .serializers import TaskSerializer, TaskActivitySerializer
from .services import notify_task_event
from .permissions import CanCreateTask, TASK_CREATOR_ROLES


def _scope_tasks(queryset, user):
    """Filter tasks based on user role."""
    from django.db.models import Q
    qs = queryset.filter(organization=user.organization)
    if user.role in TASK_CREATOR_ROLES:
        return qs
    return qs.filter(Q(assigned_to=user) | Q(created_by=user))


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list_create(request):
    if request.method == 'GET':
        qs = Task.objects.select_related(
            'created_by', 'assigned_to', 'factory', 'order'
        )
        qs = _scope_tasks(qs, request.user)

        # Filters
        if s := request.query_params.get('status'):
            qs = qs.filter(status=s)
        if p := request.query_params.get('priority'):
            qs = qs.filter(priority=p)
        if t := request.query_params.get('task_type'):
            qs = qs.filter(task_type=t)
        if f := request.query_params.get('factory'):
            qs = qs.filter(factory_id=f)
        if q := request.query_params.get('search'):
            from django.db.models import Q
            qs = qs.filter(Q(title__icontains=q) | Q(assigned_to_name__icontains=q))

        serializer = TaskSerializer(qs, many=True)
        return Response(serializer.data)

    # POST — create task
    if request.user.role not in TASK_CREATOR_ROLES:
        return Response({'error': 'Only admins can create tasks.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = TaskSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    task = serializer.save(
        created_by=request.user,
        organization=request.user.organization,
    )

    # Auto-populate assignee email/name from platform user
    if task.assigned_to and not task.assigned_to_email:
        task.assigned_to_email = task.assigned_to.email
        task.assigned_to_name = task.assigned_to.full_name
        task.save(update_fields=['assigned_to_email', 'assigned_to_name'])

    TaskActivity.objects.create(
        task=task, user=request.user, action='created',
        new_value=f"Assigned to {task.assigned_to_name or 'unassigned'}"
    )
    notify_task_event(task, 'task_assigned', actor=request.user)

    return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_stats(request):
    qs = _scope_tasks(Task.objects.all(), request.user)
    return Response({
        'open':        qs.filter(status='open').count(),
        'in_progress': qs.filter(status='in_progress').count(),
        'overdue':     qs.filter(status='overdue').count(),
        'completed':   qs.filter(status='completed').count(),
        'cancelled':   qs.filter(status='cancelled').count(),
        'total':       qs.count(),
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):
    try:
        task = Task.objects.select_related(
            'created_by', 'assigned_to', 'factory', 'order'
        ).get(id=task_id, organization=request.user.organization)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(TaskSerializer(task).data)

    # PATCH — update task fields
    if request.user.role not in TASK_CREATOR_ROLES and task.created_by != request.user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    serializer = TaskSerializer(task, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    notify_task_event(task, 'task_updated', actor=request.user)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def task_status_update(request, task_id):
    try:
        task = Task.objects.get(id=task_id, organization=request.user.organization)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    valid = [c[0] for c in Task.Status.choices]
    if new_status not in valid:
        return Response({'error': f'Invalid status. Must be one of: {valid}'}, status=status.HTTP_400_BAD_REQUEST)

    # Permission check
    is_privileged = request.user.role in TASK_CREATOR_ROLES
    if not is_privileged and task.assigned_to != request.user:
        return Response({'error': 'You can only update your own tasks.'}, status=status.HTTP_403_FORBIDDEN)

    old_status = task.status
    task.status = new_status
    if new_status == 'completed':
        task.completed_at = timezone.now()
    task.save(update_fields=['status', 'completed_at', 'updated_at'])

    TaskActivity.objects.create(
        task=task, user=request.user, action='status_changed',
        old_value=old_status, new_value=new_status,
        note=request.data.get('note', '')
    )

    if new_status == 'completed':
        notify_task_event(task, 'task_completed', actor=request.user)
    elif new_status == 'cancelled':
        notify_task_event(task, 'task_cancelled', actor=request.user)

    return Response({'success': True, 'status': new_status})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_activities(request, task_id):
    activities = TaskActivity.objects.filter(
        task_id=task_id, task__organization=request.user.organization
    ).select_related('user')
    return Response(TaskActivitySerializer(activities, many=True).data)
```

### 4.3 Task URLs

**File:** `/opt/sankalp-backend/apps/tasks/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.task_list_create, name='task-list-create'),
    path('stats/', views.task_stats, name='task-stats'),
    path('<uuid:task_id>/', views.task_detail, name='task-detail'),
    path('<uuid:task_id>/status/', views.task_status_update, name='task-status'),
    path('<uuid:task_id>/activities/', views.task_activities, name='task-activities'),
]
```

### 4.4 URL Registration

**File:** `/opt/sankalp-backend/config/urls.py` — add BEFORE core include:

```python
path('api/tasks/', include('apps.tasks.urls')),
```

**File:** `/opt/sankalp-backend/apps/core/urls.py` — REMOVE these old routes:

```python
# DELETE these lines — they served WorkflowTask data, now replaced by standalone tasks:
path('tasks/', views.tasks_cross_order, name='tasks-cross-order'),
path('tasks/stats/', views.tasks_stats, name='tasks-stats'),
```

### 4.5 New Endpoints on Existing Apps

**File:** `/opt/sankalp-backend/apps/common/views.py` — ADD:

```python
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read(request):
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({'success': True})
```

**File:** `/opt/sankalp-backend/apps/common/urls.py` — ADD:

```python
path('notifications/read-all/', views.notification_mark_all_read, name='notifications-read-all'),
```

**File:** `/opt/sankalp-backend/apps/accounts/views.py` — ADD:

```python
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def notification_preferences(request):
    if request.method == 'GET':
        from apps.tasks.services import DEFAULT_NOTIFICATION_PREFERENCES
        prefs = request.user.notification_preferences or {}
        # Merge with defaults so new types always appear
        merged = {**DEFAULT_NOTIFICATION_PREFERENCES, **prefs}
        return Response(merged)

    # PATCH
    request.user.notification_preferences = request.data
    request.user.save(update_fields=['notification_preferences'])
    return Response({'success': True, 'preferences': request.data})
```

**File:** `/opt/sankalp-backend/apps/accounts/urls.py` — ADD:

```python
path('notification-preferences/', views.notification_preferences, name='notification-preferences'),
```

### 4.6 Django Admin Registration

**File:** `/opt/sankalp-backend/apps/tasks/admin.py`

```python
from django.contrib import admin
from .models import Task, TaskActivity


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'task_type', 'priority', 'status', 'assigned_to', 'due_date', 'organization', 'created_at']
    list_filter = ['status', 'priority', 'task_type', 'organization']
    search_fields = ['title', 'assigned_to__email', 'assigned_to_name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'completed_at']


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    list_display = ['task', 'action', 'user', 'created_at']
    list_filter = ['action']
    ordering = ['-created_at']
```

---

## PART 5 — Frontend (Next.js 14 + TypeScript + Tailwind)

### 5.1 TypeScript Interfaces

**File:** `/var/www/Sankalphub_V2.0/src/types/task.ts`

```typescript
export type TaskStatus   = 'open' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType     = 'inspection' | 'lab_test' | 'audit' | 'document_submission' | 'follow_up' | 'other'

export interface Task {
  id:                      string  // UUID
  title:                   string
  task_type:               TaskType
  task_type_display:       string
  priority:                TaskPriority
  priority_display:        string
  description:             string
  status:                  TaskStatus
  status_display:          string
  created_by:              string
  created_by_name:         string
  assigned_to:             string | null
  assigned_to_name_display: string
  assigned_to_email:       string
  assigned_to_name:        string
  order:                   string | null
  order_po_number:         string
  factory:                 string | null
  factory_name:            string
  due_date:                string
  reminder_days:           number
  notify_assignee:         boolean
  notify_creator:          boolean
  notify_on_overdue:       boolean
  cc_emails:               string[]
  attachments:             string[]
  completed_at:            string | null
  created_at:              string
  updated_at:              string
}

export interface TaskStats {
  open:        number
  in_progress: number
  overdue:     number
  completed:   number
  cancelled:   number
  total:       number
}

export interface TaskActivity {
  id:         string
  user_name:  string
  action:     string
  old_value:  string
  new_value:  string
  note:       string
  created_at: string
}

// Roles that can create tasks
export const CAN_CREATE_TASK = ['admin', 'org_admin']

// Status badge colors (Tailwind classes)
export const STATUS_COLORS: Record<TaskStatus, string> = {
  open:        'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed:   'bg-green-100 text-green-700',
  overdue:     'bg-red-100 text-red-700 font-bold',
  cancelled:   'bg-gray-100 text-gray-500 line-through',
}

// Priority indicator colors
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    'bg-gray-400',
  medium: 'bg-blue-500',
  high:   'bg-orange-500',
  urgent: 'bg-red-500 animate-pulse',
}
```

### 5.2 Create Task Modal

**File:** `/var/www/Sankalphub_V2.0/src/components/tasks/CreateTaskModal.tsx`

A modal component with 6 sections:

```
SECTION 1 — Task Details
  Title*              text input (required)
  Task Type*          dropdown: Inspection / Lab Test / Audit / Document Submission / Follow Up / Other
  Priority*           dropdown: Low / Medium / High / Urgent (with color dot)
  Description         textarea (optional)

SECTION 2 — Assignment
  Assign To           toggle: Platform User | External / Guest
    Platform User →   dropdown (fetch org members from /api/auth/users/)
    External →        Name (text) + Email (email input)
  CC Emails           tag input (comma separated)

SECTION 3 — Link to Work
  Order No            searchable dropdown (fetch from /api/production-orders/)
  Factory             dropdown (fetch from /api/factories/)

SECTION 4 — Schedule
  Due Date*           date input (required)
  Reminder            dropdown: 1 day / 3 days / 7 days before

SECTION 5 — Notifications
  Notify assignee     toggle (default ON)
  Notify me on complete  toggle (default ON)
  Alert if overdue    toggle (default ON)

SECTION 6 — Attachments
  File upload         optional, multiple files
```

**Key implementation details:**
- Use `api.post('/tasks/', formData)` for submission (from `src/lib/api.ts`)
- Use `useAuthStore()` for current user role check
- Use Lucide icons: `Plus`, `X`, `Upload`, `Calendar`, `User`, `Mail`
- Use `toast.success('Task created')` from sonner on success
- Tailwind modal: `fixed inset-0 z-50 bg-black/50` overlay + `max-w-2xl max-h-[90vh] overflow-y-auto` panel

### 5.3 Task Detail Panel

**File:** `/var/www/Sankalphub_V2.0/src/components/tasks/TaskDetailPanel.tsx`

Side drawer (same pattern as existing side panels in the codebase):
- Header: task title + type badge + priority dot + status badge
- Body sections:
  - Assignment info (avatar placeholder, name, email)
  - Linked order/factory (clickable)
  - Due date with overdue indicator (red text if overdue)
  - Description
  - Attachments list
  - Status action buttons:
    - "Start" (open → in_progress) — for assignee
    - "Complete" (in_progress → completed) — for assignee
    - "Cancel" — for creator/admin
  - Activity timeline (fetch from `/tasks/<id>/activities/`)

### 5.4 Tasks Page Rewrite

**File:** `/var/www/Sankalphub_V2.0/src/app/(dashboard)/tasks/page.tsx`

Complete rewrite replacing WorkflowTask-based view with standalone tasks:

**Layout:**
1. **Status cards row** — 5 cards showing counts from `/tasks/stats/`:
   - Open (blue), In Progress (amber), Overdue (red), Completed (green), Cancelled (gray)
2. **Toolbar:**
   - Search input (debounced, searches title/assignee)
   - Status filter dropdown
   - Priority filter dropdown
   - Task type filter dropdown
   - "+ Create Task" button (visible only for `admin`/`org_admin` via `useAuthStore()`)
3. **Task table:**
   | Title | Type | Priority | Assigned To | Order | Factory | Due Date | Status |
   - Priority shown as colored dot
   - Status as colored badge
   - Row click opens `TaskDetailPanel`
4. **Empty state** — Lucide `ClipboardList` icon + "No tasks yet" message

**API calls:**
- `api.get('/tasks/', { params: { status, priority, task_type, search } })`
- `api.get('/tasks/stats/')`

---

## PART 6 — Notification Settings (Wire Up Settings Tab 6)

### 6.1 NotificationSettings Component

**File:** `/var/www/Sankalphub_V2.0/src/components/settings/NotificationSettings.tsx`

A toggle grid showing notification types × channels:

| Notification Type | In-App | Email |
|---|---|---|
| Task Assigned | toggle | toggle |
| Task Reminder | toggle | toggle |
| Task Overdue | toggle | toggle |
| Task Completed | toggle | toggle |
| Task Updated | toggle | toggle |
| Stage Submitted | toggle | toggle |
| Stage Approved | toggle | toggle |
| Stage Rejected | toggle | toggle |
| Delay Alert | toggle | toggle |

**Implementation:**
- Load from: `api.get('/api/auth/notification-preferences/')`
- Save on change: `api.patch('/api/auth/notification-preferences/', prefs)`
- Use sonner toast for success feedback
- Tailwind toggle switches (not HTML checkboxes)

### 6.2 Wire into Settings Page

**File:** `/var/www/Sankalphub_V2.0/src/app/(dashboard)/settings/page.tsx`

Replace the "Coming Soon" placeholder at `activeTab === 6` with:

```tsx
import NotificationSettings from '@/components/settings/NotificationSettings'

// In the render:
{activeTab === 6 && <NotificationSettings />}
```

---

## PART 7 — Notification Bell Enhancements

### 7.1 Extend Existing TopBar.tsx

**File:** `/var/www/Sankalphub_V2.0/src/components/layout/TopBar.tsx`

Changes to make:

1. **Add "Mark All as Read" button** in notification dropdown header:
   ```tsx
   <button onClick={markAllRead} className="text-xs text-primary hover:underline">
     Mark all read
   </button>
   ```
   Calls: `api.patch('/notifications/read-all/')`

2. **Add icon mapping for task notification types** (Lucide, not emojis):
   ```tsx
   import { ClipboardCheck, Clock, AlertTriangle, CheckCircle, Edit3, XCircle } from 'lucide-react'

   const NOTIF_ICONS: Record<string, React.ComponentType> = {
     task_assigned:   ClipboardCheck,
     task_reminder:   Clock,
     task_overdue:    AlertTriangle,
     task_completed:  CheckCircle,
     task_updated:    Edit3,
     task_cancelled:  XCircle,
     // Existing workflow types keep their current icons
   }
   ```

3. **Click-through navigation**: clicking a task notification with `entity_type === 'task'` navigates to `/tasks`

---

## PART 8 — Integration Checklist

### Backend
- [ ] `notification_preferences` JSONField added to User model (migration `0007`)
- [ ] `apps/tasks/` app created with all files
- [ ] App added to `INSTALLED_APPS` in `config/settings.py`
- [ ] Models migrated (`Task`, `TaskActivity`)
- [ ] `apps/tasks/services.py` — notification engine complete
- [ ] `apps/accounts/emails.py` — `send_task_notification_email()` added
- [ ] `apps/tasks/views.py` — all 5 endpoints working
- [ ] `apps/tasks/urls.py` registered in `config/urls.py`
- [ ] Old `/api/tasks/` routes removed from `apps/core/urls.py`
- [ ] `mark_all_read` endpoint added to `apps/common/views.py`
- [ ] `notification_preferences` endpoint added to `apps/accounts/views.py`
- [ ] Management command `check_task_overdue` created
- [ ] Admin registration complete
- [ ] `systemctl restart sankalp`

### Frontend
- [ ] `src/types/task.ts` created
- [ ] `CreateTaskModal.tsx` component built
- [ ] `TaskDetailPanel.tsx` component built
- [ ] `tasks/page.tsx` rewritten for standalone tasks
- [ ] `NotificationSettings.tsx` component built
- [ ] Settings tab 6 wired to `NotificationSettings`
- [ ] `TopBar.tsx` enhanced (mark-all, task icons)
- [ ] `npx next build` succeeds
- [ ] `pm2 restart sankalphub-v2`

### Cron
- [ ] `check_task_overdue` registered in crontab at `0 3 * * *`

### Deployment
```bash
# Backend
cd /opt/sankalp-backend
venv/bin/python manage.py makemigrations accounts tasks
venv/bin/python manage.py migrate
systemctl restart sankalp

# Frontend
cd /var/www/Sankalphub_V2.0
npx next build
pm2 restart sankalphub-v2

# Cron
(crontab -l; echo "0 3 * * * cd /opt/sankalp-backend && /opt/sankalp-backend/venv/bin/python manage.py check_task_overdue >> /var/log/sankalp-task-overdue.log 2>&1") | crontab -
```

### Testing
- [ ] Create task as `admin` → assignee receives in-app notification + email
- [ ] Create task with external email → email is delivered via Gmail SMTP
- [ ] Mark task complete → creator receives in-app notification
- [ ] Run `python manage.py check_task_overdue` manually → verify overdue tasks processed
- [ ] Log in as `user` role → confirm only assigned/created tasks visible
- [ ] Log in as `factory` role → confirm only factory-linked tasks visible
- [ ] Disable email in Notification Settings → create task → confirm no email sent
- [ ] Test notification bell: mark-all-read clears badges, task icons show correctly
- [ ] Mobile responsive: test tasks page and create modal on 375px width

---

## Summary

| Part | Feature | Files |
|------|---------|-------|
| 0 | Codebase Audit (answered) | — |
| 1 | Roles + User Model Update | `accounts/models.py`, `tasks/permissions.py` |
| 2 | Task + TaskActivity Models | `tasks/models.py` |
| 3 | Notification Engine + Email + Cron | `tasks/services.py`, `accounts/emails.py`, `tasks/management/commands/` |
| 4 | API Views + Serializers + URLs | `tasks/views.py`, `tasks/serializers.py`, `tasks/urls.py`, `config/urls.py` |
| 5 | Frontend: Tasks Page + Modal + Panel | `tasks/page.tsx`, `CreateTaskModal.tsx`, `TaskDetailPanel.tsx` |
| 6 | Notification Settings | `NotificationSettings.tsx`, `settings/page.tsx` |
| 7 | Notification Bell Enhancements | `TopBar.tsx` |
| 8 | Integration Checklist | All |

---

## FUTURE: Inspection Templates Integration (Settings Tab 3)

> **Status:** Settings tab 3 ("Inspection Templates") is currently "Coming Soon".
> When this section is built, the Task & Notification system MUST integrate with it.

### How They Connect

When Inspection Templates are built, each template will define:
- **Department** → which department owns this inspection type
- **Role & Permissions** → who can create/view/approve inspections from this template
- **Access Control** → which roles can access which template
- **Notifications** → auto-notify relevant users when an inspection is triggered from a template
- **Auto-Task Creation** → selecting a template can auto-generate tasks for:
  - The inspector (assigned task: "Complete inspection at Factory X")
  - The approver (assigned task: "Review & approve inspection report")
  - Factory QC (assigned task: "Prepare samples for inspection")

### Integration Points

| System | Connects To | How |
|--------|-------------|-----|
| Inspection Template | Task Model | Auto-create tasks when inspection is initiated from template |
| Inspection Template | Department | Template belongs to a department; tasks inherit department scope |
| Inspection Template | User Roles | Template defines which roles see/execute/approve; tasks auto-assign based on role |
| Inspection Template | Notification Engine | `notify_task_event()` fires for auto-created tasks |
| Inspection Template | Workflow Engine | Template can link to a WorkflowStage, creating both a stage task and standalone tasks |
| Task Status | Inspection Status | Completing a task can auto-update linked inspection status |

### Suggested Task Model Addition (when templates ship)

```python
# Add to Task model when Inspection Templates are built:
inspection_template = models.ForeignKey(
    'core.InspectionTemplate', on_delete=models.SET_NULL,
    null=True, blank=True, related_name='generated_tasks',
    help_text='Template that auto-generated this task'
)
inspection = models.ForeignKey(
    'core.Inspection', on_delete=models.SET_NULL,
    null=True, blank=True, related_name='tasks',
    help_text='Linked inspection instance'
)
```

This ensures the Task system is the **central assignment & notification layer** across all SankalpHub modules — orders, inspections, workflows, and templates all flow through it.

---

*SankalpHub.in — Task Management & Notification Engine*
*Stack: Django 5.1.6 + DRF + PostgreSQL + Next.js 14 + TypeScript + Tailwind CSS*
*Architecture: Role-scoped, multi-party (Brand / Factory / 3rd Party)*
*All code references actual SankalpHub codebase paths and existing patterns*
