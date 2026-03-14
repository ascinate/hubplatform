from rest_framework import serializers
from .models import ManagedDocument, DocumentAccessLog, ShareLink


class ManagedDocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    order_po_number = serializers.CharField(source='order.po_number', default='', read_only=True)
    factory_name = serializers.CharField(source='factory.name', default='', read_only=True)

    class Meta:
        model = ManagedDocument
        fields = [
            'id', 'name', 'file', 'file_type', 'file_size', 'mime_type',
            'order', 'order_po_number', 'factory', 'factory_name',
            'department', 'doc_category', 'visibility', 'description',
            'uploaded_by', 'uploaded_by_name',
            'is_deleted', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'file_type', 'file_size', 'mime_type',
            'uploaded_by', 'uploaded_by_name',
            'order_po_number', 'factory_name',
            'is_deleted', 'created_at', 'updated_at',
        ]


class DocumentUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    name = serializers.CharField(max_length=255, required=False)
    order = serializers.UUIDField(required=False, allow_null=True)
    factory = serializers.UUIDField(required=False, allow_null=True)
    department = serializers.CharField(max_length=50, required=False, allow_blank=True)
    doc_category = serializers.CharField(max_length=50, required=False, default='other')
    visibility = serializers.CharField(max_length=20, required=False, default='team')
    description = serializers.CharField(required=False, allow_blank=True, default='')


class DocumentAccessLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', default='Anonymous', read_only=True)
    user_email = serializers.CharField(source='user.email', default='', read_only=True)

    class Meta:
        model = DocumentAccessLog
        fields = [
            'id', 'document', 'user', 'user_name', 'user_email',
            'action', 'ip_address', 'user_agent', 'timestamp',
        ]
        read_only_fields = fields


class ShareLinkSerializer(serializers.ModelSerializer):
    document_name = serializers.CharField(source='document.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = ShareLink
        fields = [
            'id', 'document', 'document_name', 'token',
            'created_by', 'created_by_name',
            'recipient_email', 'recipient_name',
            'expires_at', 'is_revoked', 'access_count', 'max_access',
            'requires_watermark', 'is_expired', 'is_valid',
            'share_url', 'created_at',
        ]
        read_only_fields = [
            'id', 'token', 'created_by', 'created_by_name',
            'document_name', 'access_count', 'is_expired', 'is_valid',
            'share_url', 'created_at',
        ]

    def get_share_url(self, obj):
        from django.conf import settings
        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://sankalphub.in')
        return f'{frontend_url}/share/{obj.token}'


class CreateShareLinkSerializer(serializers.Serializer):
    recipient_email = serializers.EmailField(required=False, allow_blank=True, default='')
    recipient_name = serializers.CharField(max_length=255, required=False, allow_blank=True, default='')
    expires_hours = serializers.IntegerField(required=False, default=72, min_value=1, max_value=720)
    max_access = serializers.IntegerField(required=False, default=10, min_value=1, max_value=1000)
    requires_watermark = serializers.BooleanField(required=False, default=False)
    send_email = serializers.BooleanField(required=False, default=False)


class PublicShareDocumentSerializer(serializers.ModelSerializer):
    """Minimal document info for public share page (no sensitive data)."""
    class Meta:
        model = ManagedDocument
        fields = [
            'id', 'name', 'file_type', 'file_size', 'mime_type',
            'department', 'doc_category', 'created_at',
        ]
