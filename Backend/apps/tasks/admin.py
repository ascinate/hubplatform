from django.contrib import admin
from .models import Task, TaskActivity


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'task_type', 'priority', 'status', 'assigned_to', 'due_date', 'organization', 'created_at']
    list_filter = ['status', 'priority', 'task_type', 'organization']
    search_fields = ['title', 'assigned_to__email', 'assigned_to_name']
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'completed_at']


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    list_display = ['task', 'action', 'user', 'created_at']
    list_filter = ['action']
    ordering = ['-created_at']
