from django.contrib import admin
from .models import (
    Department, WorkflowTemplate, WorkflowTemplateStage,
    WorkflowStage, WorkflowTask,
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'organization', 'head_user', 'created_at']
    list_filter = ['organization']
    search_fields = ['name', 'code']


class WorkflowTemplateStageInline(admin.TabularInline):
    model = WorkflowTemplateStage
    extra = 0
    ordering = ['sequence_number']


@admin.register(WorkflowTemplate)
class WorkflowTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'product_category', 'is_default', 'created_at']
    list_filter = ['organization', 'product_category', 'is_default']
    inlines = [WorkflowTemplateStageInline]


@admin.register(WorkflowTemplateStage)
class WorkflowTemplateStageAdmin(admin.ModelAdmin):
    list_display = ['sequence_number', 'stage_name', 'stage_code', 'department', 'approver_role', 'typical_duration_days']
    list_filter = ['template', 'department']


class WorkflowTaskInline(admin.TabularInline):
    model = WorkflowTask
    extra = 0


@admin.register(WorkflowStage)
class WorkflowStageAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'sequence_number', 'status', 'department', 'assigned_to', 'approver', 'is_delayed']
    list_filter = ['status', 'is_delayed', 'department']
    inlines = [WorkflowTaskInline]


@admin.register(WorkflowTask)
class WorkflowTaskAdmin(admin.ModelAdmin):
    list_display = ['name', 'stage', 'status', 'assignee', 'plan_end', 'is_completed']
    list_filter = ['status', 'is_completed']
