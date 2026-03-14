"""
Utility functions for the collaboration app.
"""
import logging

logger = logging.getLogger(__name__)


def process_mentions(message, sender, room):
    """Create in-app notifications for mentioned users in a chat message."""
    mentions = (message.metadata or {}).get('mentions', [])
    if not mentions:
        return

    from apps.common.models import Notification

    sender_name = sender.full_name or sender.email.split('@')[0]
    mentioned_ids = list(set(
        m['user_id'] for m in mentions
        if m.get('user_id') and m['user_id'] != str(sender.id)
    ))

    if not mentioned_ids:
        return

    preview = message.text[:100]
    notifications = [
        Notification(
            user_id=uid,
            type='mention',
            title=f'{sender_name} mentioned you',
            message=f'{sender_name} mentioned you in {room.name}: "{preview}"',
            entity_type='collaboration_room',
            entity_id=str(room.id),
        )
        for uid in mentioned_ids
    ]
    Notification.objects.bulk_create(notifications)
    logger.info(f'Created {len(notifications)} mention notifications for message {message.id}')
