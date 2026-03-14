from django.contrib import admin
from .models import ManagedDocument, DocumentAccessLog, ShareLink


@admin.register(ManagedDocument)
class ManagedDocumentAdmin(admin.ModelAdmin):
    list_display = ['name', 'file_type', 'department', 'doc_category', 'uploaded_by', 'visibility', 'is_deleted', 'created_at']
    list_filter = ['department', 'doc_category', 'visibility', 'is_deleted', 'file_type']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'file_size', 'mime_type', 'created_at', 'updated_at']
    raw_id_fields = ['uploaded_by', 'deleted_by', 'order', 'factory', 'organization']


@admin.register(DocumentAccessLog)
class DocumentAccessLogAdmin(admin.ModelAdmin):
    list_display = ['document', 'user', 'action', 'ip_address', 'timestamp']
    list_filter = ['action']
    readonly_fields = ['id', 'timestamp']
    raw_id_fields = ['document', 'user']


@admin.register(ShareLink)
class ShareLinkAdmin(admin.ModelAdmin):
    list_display = ['document', 'recipient_email', 'created_by', 'expires_at', 'access_count', 'max_access', 'is_revoked', 'created_at']
    list_filter = ['is_revoked', 'requires_watermark']
    search_fields = ['recipient_email', 'recipient_name', 'document__name']
    readonly_fields = ['id', 'token', 'access_count', 'created_at']
    raw_id_fields = ['document', 'created_by']
