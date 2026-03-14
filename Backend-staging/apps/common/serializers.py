from rest_framework import serializers
from .models import Comment, History, Document, Notification


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'entity_type', 'entity_id', 'user', 'user_name', 'user_email',
            'comment_type', 'text', 'attachment_url', 'mentions', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']


class HistorySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = History
        fields = [
            'id', 'entity_type', 'entity_id', 'user', 'user_name',
            'field', 'old_value', 'new_value', 'changed_at',
        ]
        read_only_fields = ['id', 'changed_at']


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = Document
        fields = [
            'id', 'entity_type', 'entity_id', 'file', 'file_name',
            'uploaded_by', 'uploaded_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'type', 'title', 'message', 'read',
            'entity_type', 'entity_id', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']
