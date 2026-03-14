import logging
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
    "stage_submitted": {"in_app": True, "email": False},
    "stage_approved":  {"in_app": True, "email": False},
    "stage_rejected":  {"in_app": True, "email": True},
    "delay_alert":     {"in_app": True, "email": True},
}


def _get_prefs(user, event_type):
    """Get user's preference for a notification type, falling back to defaults."""
    prefs = user.notification_preferences or {}
    defaults = DEFAULT_NOTIFICATION_PREFERENCES.get(event_type, {"in_app": True, "email": False})
    type_prefs = prefs.get(event_type, defaults)
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
