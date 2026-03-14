from django.contrib import admin
from .models import Factory, ProductionOrder, Inspection, LabTest, ChatMessage, DemoLead


@admin.register(Factory)
class FactoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'location', 'is_active', 'created_at']
    list_filter = ['is_active', 'organization']
    search_fields = ['name', 'location', 'contact_person']
    ordering = ['name']


@admin.register(ProductionOrder)
class ProductionOrderAdmin(admin.ModelAdmin):
    list_display = ['po_number', 'product_name', 'factory', 'organization',
                    'status', 'completion_percent', 'due_date', 'created_at']
    list_filter = ['status', 'organization', 'factory']
    search_fields = ['po_number', 'product_name']
    ordering = ['-created_at']
    readonly_fields = ['completion_percent', 'created_at', 'updated_at']


@admin.register(Inspection)
class InspectionAdmin(admin.ModelAdmin):
    list_display = ['factory', 'inspection_type', 'result', 'defect_rate',
                    'auditor_name', 'inspection_date', 'organization']
    list_filter = ['inspection_type', 'result', 'organization']
    search_fields = ['auditor_name', 'factory__name', 'production_order__po_number']
    ordering = ['-inspection_date']
    readonly_fields = ['defect_rate', 'created_at', 'updated_at']


@admin.register(LabTest)
class LabTestAdmin(admin.ModelAdmin):
    list_display = ['sample_id', 'test_name', 'status', 'score', 'passed', 'submitted_at']
    list_filter = ['status', 'organization']
    search_fields = ['sample_id', 'test_name']
    ordering = ['-submitted_at']
    readonly_fields = ['passed', 'submitted_at']


@admin.register(DemoLead)
class DemoLeadAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'company', 'phone', 'factories_count', 'monthly_inspections', 'status', 'created_at']
    list_filter = ['status', 'contacted']
    search_fields = ['name', 'email', 'company']
    ordering = ['-created_at']
    actions = ['mark_contacted']

    def mark_contacted(self, request, queryset):
        queryset.update(contacted=True)
    mark_contacted.short_description = 'Mark selected leads as contacted'
