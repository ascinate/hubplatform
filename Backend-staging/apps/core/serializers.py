from rest_framework import serializers
from .models import (
    Factory, ProductionOrder, Inspection, LabTest, ChatMessage, DemoLead,
    OrderCollaborator, InspectionSection, InspectionItem, InspectionDefect,
)


class FactorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Factory
        fields = ['id', 'name', 'location', 'city', 'country',
                  'certifications', 'audit_compliance', 'last_audit_date',
                  'production_capacity', 'total_manpower', 'infrastructure',
                  'contact_person', 'contact_email',
                  'contact_phone', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class OrderCollaboratorSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = OrderCollaborator
        fields = ['id', 'user', 'user_name', 'user_email', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProductionOrderSerializer(serializers.ModelSerializer):
    factory_name = serializers.CharField(source='factory.name', read_only=True)
    completion_percent = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    collaborators = OrderCollaboratorSerializer(many=True, read_only=True)

    class Meta:
        model = ProductionOrder
        fields = ['id', 'po_number', 'factory', 'factory_name', 'product_name',
                  'color', 'gender',
                  'quantity', 'completed_quantity', 'completion_percent',
                  'status', 'status_display', 'due_date', 'notes', 'description',
                  'order_image_url', 'master_order', 'country', 'progress_percent',
                  'created_by', 'created_by_name', 'collaborators',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'completion_percent', 'created_by', 'created_at', 'updated_at']


class InspectionSerializer(serializers.ModelSerializer):
    factory_name = serializers.CharField(source='factory.name', read_only=True)
    inspection_type_display = serializers.CharField(source='get_inspection_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True, default='')
    template_code = serializers.CharField(source='template.code', read_only=True, default='')
    auditor_display = serializers.SerializerMethodField()

    def get_auditor_display(self, obj):
        return obj.auditor_name or (obj.created_by.full_name if obj.created_by else 'Unknown')

    class Meta:
        model = Inspection
        fields = ['id', 'production_order', 'factory', 'factory_name',
                  'inspection_no', 'inspection_type', 'inspection_type_display',
                  'aql_level', 'template', 'template_name', 'template_code',
                  'status', 'status_display',
                  'auditor_name', 'auditor_display', 'inspection_date',
                  'quantity_inspected', 'defects_found', 'defect_rate',
                  'result', 'result_display', 'overall_result',
                  'signature_url', 'email_recipients',
                  'notes', 'submitted_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'defect_rate', 'created_at', 'updated_at']


class LabTestSerializer(serializers.ModelSerializer):
    passed = serializers.ReadOnlyField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LabTest
        fields = ['id', 'production_order', 'sample_id', 'test_name', 'test_type',
                  'status', 'status_display', 'score', 'pass_threshold', 'passed',
                  'notes', 'report_file', 'submitted_at', 'completed_at']
        read_only_fields = ['id', 'passed', 'submitted_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.CharField(source='sender.email', read_only=True)

    def get_sender_name(self, obj):
        return obj.sender.full_name or obj.sender.email.split('@')[0]

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_name', 'sender_email', 'message', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']


class DemoLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoLead
        fields = ['name', 'email', 'company', 'phone', 'role', 'factories_count', 'monthly_inspections', 'message']

    def validate_email(self, value):
        return value.lower()


class InspectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionItem
        fields = ['id', 'label', 'type', 'spec_value', 'tolerance',
                  'actual_value', 'result', 'photo_url', 'comment']
        read_only_fields = ['id']


class InspectionSectionSerializer(serializers.ModelSerializer):
    items = InspectionItemSerializer(many=True, read_only=True)

    class Meta:
        model = InspectionSection
        fields = ['id', 'name', 'result', 'sort_order', 'items']
        read_only_fields = ['id']


class InspectionDefectSerializer(serializers.ModelSerializer):
    class Meta:
        model = InspectionDefect
        fields = ['id', 'section_name', 'item_name', 'defect_code',
                  'defect_name', 'severity', 'quantity', 'photo_url']
        read_only_fields = ['id']


class InspectionDetailSerializer(InspectionSerializer):
    sections = InspectionSectionSerializer(many=True, read_only=True)
    defects = InspectionDefectSerializer(many=True, read_only=True)
    production_order_number = serializers.CharField(
        source='production_order.po_number', read_only=True
    )

    class Meta(InspectionSerializer.Meta):
        fields = InspectionSerializer.Meta.fields + [
            'sections', 'defects', 'production_order_number',
        ]


class DashboardSummarySerializer(serializers.Serializer):
    total_orders = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    completed_orders = serializers.IntegerField()
    total_inspections = serializers.IntegerField()
    failed_inspections = serializers.IntegerField()
    passed_inspections = serializers.IntegerField()
    avg_defect_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_lab_tests = serializers.IntegerField()
    passed_lab_tests = serializers.IntegerField()
    active_factories = serializers.IntegerField()
    recent_activity = serializers.ListField()
