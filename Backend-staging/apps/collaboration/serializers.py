from rest_framework import serializers
from django.utils import timezone
from .models import (
    CollaborationRoom, RoomParticipant, CollaborationMessage,
    ApprovalRequest, InspectionActivationRequest,
)


class RoomParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = RoomParticipant
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_role',
            'participant_role', 'joined_at', 'last_read_at',
        ]
        read_only_fields = ['id', 'joined_at']


class CollaborationRoomSerializer(serializers.ModelSerializer):
    entity_name = serializers.SerializerMethodField()
    entity_id = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participant_count = serializers.IntegerField(
        source='participants.count', read_only=True
    )
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = CollaborationRoom
        fields = [
            'id', 'room_type', 'name', 'is_active', 'created_at',
            'entity_name', 'entity_id', 'unread_count',
            'participant_count', 'last_message',
        ]
        read_only_fields = ['id', 'created_at']

    def get_entity_name(self, obj):
        if obj.room_type == 'po' and obj.production_order:
            return obj.production_order.po_number or str(obj.production_order.id)[:8]
        if obj.room_type == 'factory' and obj.factory:
            return obj.factory.name
        if obj.room_type == 'inspection' and obj.inspection:
            return f"{obj.inspection.inspection_type} - {obj.inspection.id}"
        return obj.name

    def get_entity_id(self, obj):
        if obj.room_type == 'po' and obj.production_order:
            return str(obj.production_order.id)
        if obj.room_type == 'factory' and obj.factory:
            return str(obj.factory.id)
        if obj.room_type == 'inspection' and obj.inspection:
            return str(obj.inspection.id)
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        participant = obj.participants.filter(user=request.user).first()
        if not participant or not participant.last_read_at:
            return obj.messages.count()
        return obj.messages.filter(created_at__gt=participant.last_read_at).count()

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if not msg:
            return None
        return {
            'text': msg.text[:100] if msg.text else msg.message_type,
            'sender_name': msg.sender.full_name or msg.sender.email.split('@')[0],
            'created_at': msg.created_at.isoformat(),
            'message_type': msg.message_type,
        }


class CollaborationMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = CollaborationMessage
        fields = [
            'id', 'room', 'sender', 'sender_name', 'sender_email', 'sender_role',
            'message_type', 'text', 'attachment', 'attachment_name',
            'attachment_url', 'metadata', 'created_at',
        ]
        read_only_fields = ['id', 'sender', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.full_name or obj.sender.email.split('@')[0]

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None


class ApprovalRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'room', 'message', 'requested_by', 'requested_by_name',
            'assigned_to', 'assigned_to_name', 'title', 'description',
            'status', 'responded_at', 'response_note', 'created_at',
        ]
        read_only_fields = ['id', 'requested_by', 'created_at']

    def get_requested_by_name(self, obj):
        return obj.requested_by.full_name or obj.requested_by.email.split('@')[0]

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.full_name or obj.assigned_to.email.split('@')[0]


class InspectionActivationRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.SerializerMethodField()
    responded_by_name = serializers.SerializerMethodField()
    inspection_type = serializers.CharField(
        source='inspection.inspection_type', read_only=True
    )

    class Meta:
        model = InspectionActivationRequest
        fields = [
            'id', 'room', 'inspection', 'inspection_type',
            'requested_by', 'requested_by_name',
            'status', 'note', 'location_lat', 'location_lng',
            'responded_by', 'responded_by_name', 'responded_at',
            'created_at',
        ]
        read_only_fields = ['id', 'requested_by', 'created_at']

    def get_requested_by_name(self, obj):
        return obj.requested_by.full_name or obj.requested_by.email.split('@')[0]

    def get_responded_by_name(self, obj):
        if obj.responded_by:
            return obj.responded_by.full_name or obj.responded_by.email.split('@')[0]
        return None


class CreateRoomSerializer(serializers.Serializer):
    room_type = serializers.ChoiceField(choices=['po', 'factory', 'inspection'])
    entity_id = serializers.UUIDField()
