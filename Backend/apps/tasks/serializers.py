from rest_framework import serializers
from .models import Task, TaskActivity


class TaskSerializer(serializers.ModelSerializer):
    created_by_name      = serializers.CharField(source='created_by.full_name', read_only=True)
    assigned_to_name_display = serializers.SerializerMethodField()
    order_po_number      = serializers.CharField(source='order.po_number', read_only=True, default='')
    factory_name         = serializers.CharField(source='factory.name', read_only=True, default='')
    status_display       = serializers.CharField(source='get_status_display', read_only=True)
    task_type_display    = serializers.CharField(source='get_task_type_display', read_only=True)
    priority_display     = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'organization', 'title', 'task_type', 'task_type_display',
            'priority', 'priority_display', 'description', 'status', 'status_display',
            'created_by', 'created_by_name',
            'assigned_to', 'assigned_to_name_display', 'assigned_to_email', 'assigned_to_name',
            'order', 'order_po_number', 'factory', 'factory_name',
            'due_date', 'reminder_days',
            'notify_assignee', 'notify_creator', 'notify_on_overdue', 'cc_emails',
            'attachments', 'completed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'organization', 'created_by', 'created_at', 'updated_at', 'completed_at']

    def get_assigned_to_name_display(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.full_name or obj.assigned_to.email
        return obj.assigned_to_name or ''


class TaskActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True, default='')

    class Meta:
        model = TaskActivity
        fields = ['id', 'task', 'user', 'user_name', 'action', 'old_value', 'new_value', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']
