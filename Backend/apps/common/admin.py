from django.contrib import admin
from .models import Comment, History, Document, Notification


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['user', 'entity_type', 'entity_id', 'created_at']
    list_filter = ['entity_type']


@admin.register(History)
class HistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'entity_type', 'field', 'changed_at']
    list_filter = ['entity_type']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'entity_type', 'uploaded_by', 'created_at']
    list_filter = ['entity_type']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'type', 'read', 'created_at']
    list_filter = ['type', 'read']
