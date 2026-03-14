from django.contrib import admin
from .models import (
    CollaborationRoom, RoomParticipant, CollaborationMessage,
    ApprovalRequest, InspectionActivationRequest,
)


@admin.register(CollaborationRoom)
class CollaborationRoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'room_type', 'organization', 'is_active', 'created_at']
    list_filter = ['room_type', 'is_active']
    search_fields = ['name']


@admin.register(RoomParticipant)
class RoomParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'room', 'participant_role', 'joined_at']
    list_filter = ['participant_role']


@admin.register(CollaborationMessage)
class CollaborationMessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'room', 'message_type', 'created_at']
    list_filter = ['message_type']
    search_fields = ['text']


@admin.register(ApprovalRequest)
class ApprovalRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'requested_by', 'assigned_to', 'status', 'created_at']
    list_filter = ['status']


@admin.register(InspectionActivationRequest)
class InspectionActivationRequestAdmin(admin.ModelAdmin):
    list_display = ['inspection', 'requested_by', 'status', 'created_at']
    list_filter = ['status']
