import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import (
    CollaborationRoom, RoomParticipant, CollaborationMessage,
)


class CollaborationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group = f'room_{self.room_id}'
        self.user = self.scope.get('user')

        # Reject anonymous connections
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Verify room exists and user belongs to same org
        room = await self.get_room()
        if not room:
            await self.close()
            return

        # Auto-add as participant if not already
        await self.ensure_participant(room)

        # Join channel group
        await self.channel_layer.group_add(
            self.room_group, self.channel_name
        )
        await self.accept()

        # Notify others
        await self.channel_layer.group_send(
            self.room_group,
            {
                'type': 'user_joined',
                'user_id': str(self.user.id),
                'user_name': self.user.full_name or self.user.email.split('@')[0],
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(
                self.room_group, self.channel_name
            )

    async def receive_json(self, content):
        msg_type = content.get('type', 'message')

        if msg_type == 'message':
            text = content.get('text', '').strip()
            message_type = content.get('message_type', 'text')
            metadata = content.get('metadata', {})

            if not text and message_type == 'text':
                return

            msg_data = await self.save_message(text, message_type, metadata)
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type': 'chat_message',
                    **msg_data,
                }
            )

        elif msg_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type': 'typing_indicator',
                    'user_id': str(self.user.id),
                    'user_name': self.user.full_name or self.user.email.split('@')[0],
                    'is_typing': content.get('is_typing', True),
                }
            )

        elif msg_type == 'read_receipt':
            await self.update_last_read()

    # ─── Group message handlers ─────────────────────────────

    async def chat_message(self, event):
        await self.send_json({
            'type': 'message',
            'id': event.get('id'),
            'sender_id': event.get('sender_id'),
            'sender_name': event.get('sender_name'),
            'sender_email': event.get('sender_email'),
            'sender_role': event.get('sender_role'),
            'message_type': event.get('message_type'),
            'text': event.get('text'),
            'attachment_url': event.get('attachment_url'),
            'attachment_name': event.get('attachment_name'),
            'metadata': event.get('metadata'),
            'created_at': event.get('created_at'),
        })

    async def typing_indicator(self, event):
        # Don't send typing indicator back to the sender
        if event.get('user_id') == str(self.user.id):
            return
        await self.send_json({
            'type': 'typing',
            'user_id': event['user_id'],
            'user_name': event['user_name'],
            'is_typing': event['is_typing'],
        })

    async def user_joined(self, event):
        await self.send_json({
            'type': 'user_joined',
            'user_id': event['user_id'],
            'user_name': event['user_name'],
        })

    async def approval_update(self, event):
        await self.send_json({
            'type': 'approval_update',
            **{k: v for k, v in event.items() if k != 'type'},
        })

    async def activation_update(self, event):
        await self.send_json({
            'type': 'activation_update',
            **{k: v for k, v in event.items() if k != 'type'},
        })

    # ─── Database helpers ───────────────────────────────────

    @database_sync_to_async
    def get_room(self):
        try:
            room = CollaborationRoom.objects.get(id=self.room_id)
            if room.organization != self.user.organization:
                return None
            return room
        except CollaborationRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def ensure_participant(self, room):
        RoomParticipant.objects.get_or_create(
            room=room, user=self.user,
            defaults={'participant_role': 'member'}
        )

    @database_sync_to_async
    def save_message(self, text, message_type, metadata):
        msg = CollaborationMessage.objects.create(
            room_id=self.room_id,
            sender=self.user,
            message_type=message_type,
            text=text,
            metadata=metadata,
        )

        # Process @mentions and create notifications
        from .utils import process_mentions
        room = CollaborationRoom.objects.get(id=self.room_id)
        process_mentions(msg, self.user, room)

        return {
            'id': str(msg.id),
            'sender_id': str(self.user.id),
            'sender_name': self.user.full_name or self.user.email.split('@')[0],
            'sender_email': self.user.email,
            'sender_role': self.user.role,
            'message_type': message_type,
            'text': text,
            'attachment_url': None,
            'attachment_name': '',
            'metadata': metadata,
            'created_at': msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def update_last_read(self):
        RoomParticipant.objects.filter(
            room_id=self.room_id, user=self.user
        ).update(last_read_at=timezone.now())
