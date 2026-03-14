from django.contrib import admin
from .models import (
    InspectionTemplate, TemplateSection, TemplateField,
    TemplateRecord, TemplateFieldValue,
)


class TemplateSectionInline(admin.TabularInline):
    model = TemplateSection
    extra = 0
    ordering = ['sort_order']


class TemplateFieldInline(admin.TabularInline):
    model = TemplateField
    extra = 0
    ordering = ['sort_order']


@admin.register(InspectionTemplate)
class InspectionTemplateAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'phase', 'phase_sequence', 'organization', 'is_active', 'is_builtin']
    list_filter = ['phase', 'is_active', 'is_builtin', 'organization']
    search_fields = ['code', 'name']
    inlines = [TemplateSectionInline]


@admin.register(TemplateSection)
class TemplateSectionAdmin(admin.ModelAdmin):
    list_display = ['template', 'block_type', 'name', 'sort_order', 'is_visible']
    list_filter = ['block_type', 'is_visible']
    inlines = [TemplateFieldInline]


@admin.register(TemplateField)
class TemplateFieldAdmin(admin.ModelAdmin):
    list_display = ['label', 'field_key', 'field_type', 'is_required', 'sort_order', 'section']
    list_filter = ['field_type', 'is_required']
    search_fields = ['label', 'field_key']


@admin.register(TemplateRecord)
class TemplateRecordAdmin(admin.ModelAdmin):
    list_display = ['template', 'order', 'status', 'submitted_by', 'created_at']
    list_filter = ['status']


@admin.register(TemplateFieldValue)
class TemplateFieldValueAdmin(admin.ModelAdmin):
    list_display = ['record', 'field', 'value_text', 'value_number', 'value_boolean']
