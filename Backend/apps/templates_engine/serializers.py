from rest_framework import serializers
from .models import (
    InspectionTemplate, TemplateSection, TemplateField,
    TemplateRecord, TemplateFieldValue,
)


class TemplateFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = TemplateField
        fields = [
            'id', 'label', 'field_key', 'field_type', 'is_required',
            'sort_order', 'options', 'default_value', 'placeholder',
            'help_text', 'auto_fill_source',
        ]


class TemplateSectionSerializer(serializers.ModelSerializer):
    fields = TemplateFieldSerializer(many=True, read_only=True)
    field_count = serializers.SerializerMethodField()

    class Meta:
        model = TemplateSection
        fields = [
            'id', 'block_type', 'name', 'sort_order', 'is_visible',
            'fields', 'field_count',
        ]

    def get_field_count(self, obj):
        return obj.fields.count()


class InspectionTemplateListSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, default='')
    department_code = serializers.CharField(source='department.code', read_only=True, default='')
    field_count = serializers.SerializerMethodField()

    class Meta:
        model = InspectionTemplate
        fields = [
            'id', 'name', 'code', 'phase', 'phase_sequence',
            'department', 'department_name', 'department_code',
            'product_category', 'submitted_by_role', 'reviewed_by_role',
            'approved_by_role', 'next_template_code',
            'is_builtin', 'is_active', 'version', 'description',
            'field_count', 'created_at', 'updated_at',
        ]

    def get_field_count(self, obj):
        count = 0
        for section in obj.sections.all():
            count += section.fields.count()
        return count


class InspectionTemplateDetailSerializer(serializers.ModelSerializer):
    sections = TemplateSectionSerializer(many=True, read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default='')
    department_code = serializers.CharField(source='department.code', read_only=True, default='')
    field_count = serializers.SerializerMethodField()

    class Meta:
        model = InspectionTemplate
        fields = [
            'id', 'name', 'code', 'phase', 'phase_sequence',
            'department', 'department_name', 'department_code',
            'product_category', 'submitted_by_role', 'reviewed_by_role',
            'approved_by_role', 'next_template_code',
            'is_builtin', 'is_active', 'version', 'description',
            'sections', 'field_count',
            'created_at', 'updated_at',
        ]

    def get_field_count(self, obj):
        count = 0
        for section in obj.sections.all():
            count += section.fields.count()
        return count


class InspectionTemplateWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionTemplate
        fields = [
            'name', 'code', 'phase', 'phase_sequence',
            'department', 'product_category',
            'submitted_by_role', 'reviewed_by_role', 'approved_by_role',
            'next_template_code', 'is_active', 'version', 'description',
        ]
