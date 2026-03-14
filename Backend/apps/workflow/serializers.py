from rest_framework import serializers
from .models import (
    Department, WorkflowTemplate, WorkflowTemplateStage,
    WorkflowStage, WorkflowTask,
)
from apps.common.models import Comment


class DepartmentSerializer(serializers.ModelSerializer):
    head_user_name = serializers.CharField(source='head_user.full_name', read_only=True, default='')
    head_user_email = serializers.CharField(source='head_user.email', read_only=True, default='')
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'head_user', 'head_user_name', 'head_user_email',
            'member_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()


class WorkflowTemplateStageSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, default='')
    department_code = serializers.CharField(source='department.code', read_only=True, default='')

    class Meta:
        model = WorkflowTemplateStage
        fields = [
            'id', 'template', 'stage_name', 'stage_code', 'sequence_number',
            'department', 'department_name', 'department_code', 'approver_role',
            'is_required', 'typical_duration_days', 'description', 'on_fail_go_to_seq',
        ]
        read_only_fields = ['id']


class WorkflowTaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source='assignee.full_name', read_only=True, default='')
    assignee_email = serializers.CharField(source='assignee.email', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = WorkflowTask
        fields = [
            'id', 'stage', 'name', 'plan_start', 'plan_end', 'actual_date',
            'assignee', 'assignee_name', 'assignee_email', 'status', 'status_display',
            'sort_order', 'created_at', 'updated_at',
            'is_completed', 'completed_by', 'completed_at', 'output_type',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkflowStageSerializer(serializers.ModelSerializer):
    tasks = WorkflowTaskSerializer(many=True, read_only=True)
    completed_count = serializers.SerializerMethodField()
    total_count = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True, default='')
    department_code = serializers.CharField(source='department.code', read_only=True, default='')
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default='')
    approver_name = serializers.CharField(source='approver.full_name', read_only=True, default='')
    comment_count = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowStage
        fields = [
            'id', 'order', 'name', 'sort_order', 'tasks', 'completed_count', 'total_count',
            'status', 'status_display', 'stage_code', 'sequence_number',
            'department', 'department_name', 'department_code',
            'assigned_to', 'assigned_to_name', 'approver', 'approver_name',
            'planned_start_date', 'planned_end_date', 'actual_start_date', 'actual_end_date',
            'is_delayed', 'delay_days', 'is_required', 'on_fail_go_to_seq',
            'submitted_at', 'approved_at', 'rejected_at', 'comment_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_completed_count(self, obj):
        return obj.tasks.filter(status__in=['APPROVED', 'PASS']).count()

    def get_total_count(self, obj):
        return obj.tasks.count()

    def get_comment_count(self, obj):
        return Comment.objects.filter(
            entity_type='workflow_stage', entity_id=str(obj.id)
        ).count()

    def get_status_display(self, obj):
        return obj.get_status_display()


class WorkflowTemplateSerializer(serializers.ModelSerializer):
    template_stages = WorkflowTemplateStageSerializer(many=True, read_only=True)
    stage_count = serializers.SerializerMethodField()

    class Meta:
        model = WorkflowTemplate
        fields = [
            'id', 'name', 'product_category', 'stages_json', 'is_default',
            'template_stages', 'stage_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_stage_count(self, obj):
        return obj.template_stages.count()


class WorkflowProgressSerializer(serializers.Serializer):
    percent = serializers.IntegerField()
    color = serializers.CharField()
    status_label = serializers.CharField()


class StageTransitionSerializer(serializers.Serializer):
    comment_text = serializers.CharField(required=True)


class StageCommentSerializer(serializers.Serializer):
    comment_type = serializers.ChoiceField(
        choices=['challenge', 'feedback', 'delay_reason', 'general']
    )
    text = serializers.CharField(required=True)
