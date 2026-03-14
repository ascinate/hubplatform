"""
Django signals for core app.
Sends email alerts when key events occur (e.g. inspection fails).
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender='core.Inspection')
def on_inspection_saved(sender, instance, created, **kwargs):
    """Send alert email when an inspection is marked as failed."""
    if instance.result != 'fail':
        return

    # Only alert on newly-failed inspections (created=True OR result just changed)
    # We use a simple approach: send on every save where result='fail'
    # In production you'd track previous state to avoid duplicate emails
    try:
        from apps.accounts.emails import send_inspection_fail_alert
        send_inspection_fail_alert(instance)
    except Exception as e:
        logger.error(f"Failed to send inspection alert email: {e}")
