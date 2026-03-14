"""
Seed all 35 inspection/department templates with fields from the QMS Master Plan.
Usage:
    python manage.py seed_inspection_templates              # all orgs
    python manage.py seed_inspection_templates --org_id=UUID  # specific org
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import Organization
from apps.templates_engine.models import (
    InspectionTemplate, TemplateSection, TemplateField,
)

# ── Shared block fields (identical across all templates) ─────────────────

HEADER_FIELDS = [
    ('Template ID', 'template_id', 'text', False, 'auto'),
    ('Template Version', 'template_version', 'text', False, 'auto'),
    ('Created By', 'created_by', 'text', False, 'auto.user'),
    ('Created Date', 'created_date', 'date', False, 'auto.now'),
    ('Status', 'status', 'dropdown', False, '', ['Draft', 'Submitted', 'In Review', 'Approved', 'Rejected', 'Completed']),
]

CONTEXT_FIELDS = [
    ('Brand', 'brand', 'dropdown', True, 'order.brand'),
    ('Product Category', 'product_category', 'dropdown', True, 'order.product_category'),
    ('Product Name', 'product_name', 'text', True, 'order.product_name'),
    ('Style Number', 'style_number', 'text', True, 'order.style_number'),
    ('Season', 'season', 'dropdown', True, 'order.season', ['SS', 'AW', 'FW', 'Carry-over']),
    ('Gender', 'gender', 'dropdown', True, 'order.gender', ['Male', 'Female', 'Unisex', 'Kids', 'Baby', 'Toddler']),
    ('Age Group', 'age_group', 'dropdown', True, 'order.age_group', ['Adult', 'Youth', 'Kids', 'Infant', 'Toddler']),
    ('Construction Type', 'construction_type', 'dropdown', True, 'order.construction_type', ['Woven', 'Knitted', 'Leather', 'Synthetic', 'Multi-layer', 'Composite']),
    ('Colorway', 'colorway', 'text', True, 'order.colorway'),
    ('Size Range', 'size_range', 'text', True, 'order.size_range'),
    ('Tech Pack Version', 'tech_pack_version', 'text', False, ''),
    ('Origin Country', 'origin_country', 'dropdown', True, 'order.origin_country', ['China', 'Cambodia', 'India', 'Bangladesh', 'Vietnam', 'Indonesia']),
    ('PO Number', 'po_number', 'text', True, 'order.po_number'),
]

APPROVAL_FIELDS = [
    ('Prepared By', 'prepared_by', 'text', False, 'auto.user'),
    ('Reviewed By', 'reviewed_by', 'dropdown', True, ''),
    ('Approved By', 'approved_by', 'dropdown', True, ''),
    ('Approval Date', 'approval_date', 'date', False, 'auto'),
    ('Handover Notes', 'handover_notes', 'textarea', False, ''),
]


def _f(label, key, ftype, required=False, auto='', options=None):
    """Shorthand for field tuple."""
    return (label, key, ftype, required, auto, options or [])


# ── 35 Template Definitions ──────────────────────────────────────────────

TEMPLATES = [
    # ── PHASE 1: Product Development (T01-T07) ──
    {
        'code': 'T01', 'name': 'Design', 'phase': 'product_development', 'seq': 1,
        'dept': 'Design', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T02',
        'description': 'Design concept, tech pack creation, material concept definition',
        'tasks': [
            _f('Concept Design Completed', 'concept_design_completed', 'checkbox', True),
            _f('Technical Sketch Created', 'technical_sketch_created', 'checkbox', True),
            _f('Tech Pack Drafted', 'tech_pack_drafted', 'checkbox', True),
            _f('Material Concept Defined', 'material_concept_defined', 'checkbox', True),
            _f('Color Palette Confirmed', 'color_palette_confirmed', 'checkbox', True),
            _f('Design Review Done', 'design_review_done', 'checkbox', True),
        ],
        'data': [
            _f('Design Concept Description', 'design_concept_description', 'textarea', True),
            _f('Color Palette Details', 'color_palette_details', 'text', True),
            _f('Material Notes', 'material_notes', 'text'),
            _f('Special Features / Requirements', 'special_features', 'textarea'),
            _f('Target Retail Price', 'target_retail_price', 'decimal'),
            _f('Design Reference Images', 'design_reference_images', 'file'),
        ],
        'attachments': [
            _f('Technical Sketch Upload', 'technical_sketch_upload', 'file', True),
            _f('Tech Pack Upload', 'tech_pack_upload', 'file', True),
            _f('Reference Images', 'reference_images', 'file'),
        ],
        'output': [
            _f('Approved Tech Pack', 'approved_tech_pack', 'file', True),
            _f('Design Status', 'design_status', 'dropdown', True, '', ['Pending', 'Approved', 'Revision Required']),
        ],
    },
    {
        'code': 'T02', 'name': 'Development', 'phase': 'product_development', 'seq': 2,
        'dept': 'Development', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T03',
        'description': 'Pattern creation, material selection, sample development planning',
        'tasks': [
            _f('Pattern Created', 'pattern_created', 'checkbox', True),
            _f('Pattern Version', 'pattern_version', 'text', True),
            _f('Material Selection Done', 'material_selection_done', 'checkbox', True),
            _f('Sample Plan Created', 'sample_plan_created', 'checkbox', True),
            _f('Tech Pack Reviewed', 'tech_pack_reviewed', 'checkbox', True),
        ],
        'data': [
            _f('Pattern Version Notes', 'pattern_version_notes', 'text'),
            _f('Material Selection Details', 'material_selection_details', 'textarea'),
            _f('Sample Development Plan', 'sample_development_plan', 'textarea', True),
            _f('Development Issues / Notes', 'development_issues', 'textarea'),
        ],
        'attachments': [
            _f('Pattern Files', 'pattern_files', 'file'),
            _f('Updated Tech Pack', 'updated_tech_pack', 'file'),
            _f('Material Swatches', 'material_swatches', 'file'),
        ],
        'output': [
            _f('Development Status', 'development_status', 'dropdown', True, '', ['Pending', 'Completed', 'On Hold']),
            _f('Sample Plan Document', 'sample_plan_document', 'file'),
        ],
    },
    {
        'code': 'T03', 'name': 'Sample Material Sourcing', 'phase': 'product_development', 'seq': 3,
        'dept': 'Sourcing', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T04',
        'description': 'Fabric, trim, and accessory sourcing for sample development',
        'tasks': [
            _f('Fabric Sourcing Completed', 'fabric_sourcing_completed', 'checkbox', True),
            _f('Trim Sourcing Completed', 'trim_sourcing_completed', 'checkbox', True),
            _f('Accessory Sourcing Completed', 'accessory_sourcing_completed', 'checkbox', True),
            _f('Samples Requested from Suppliers', 'samples_requested', 'checkbox', True),
            _f('Swatches Approved', 'swatches_approved', 'checkbox', True),
        ],
        'data': [
            _f('Fabric Supplier', 'fabric_supplier', 'dropdown', True),
            _f('Fabric Type', 'fabric_type', 'text', True),
            _f('Fabric Composition', 'fabric_composition', 'text', True),
            _f('Fabric GSM', 'fabric_gsm', 'number'),
            _f('Fabric Color', 'fabric_color', 'text'),
            _f('Trim Supplier', 'trim_supplier', 'dropdown'),
            _f('Trim Type', 'trim_type', 'text'),
            _f('Component Details', 'component_details', 'textarea'),
        ],
        'attachments': [
            _f('Fabric Swatches', 'fabric_swatches', 'file'),
            _f('Supplier Quotes', 'supplier_quotes', 'file'),
        ],
        'output': [
            _f('Material Approval Status', 'material_approval_status', 'dropdown', True, '', ['Approved', 'Rejected', 'Pending']),
        ],
    },
    {
        'code': 'T04', 'name': 'Prototype Sample', 'phase': 'product_development', 'seq': 4,
        'dept': 'Sampling', 'submit': 'Factory Manager', 'review': 'QC Manager', 'approve': 'Admin / Merchandiser', 'next': 'T05',
        'description': 'Prototype sample production, measurement check, brand review',
        'tasks': [
            _f('Pattern Cutting Completed', 'pattern_cutting_completed', 'checkbox', True),
            _f('Sample Sewing Completed', 'sample_sewing_completed', 'checkbox', True),
            _f('Sample Assembly Completed', 'sample_assembly_completed', 'checkbox', True),
            _f('Sample Reviewed vs Tech Pack', 'sample_reviewed_vs_techpack', 'checkbox', True),
            _f('Measurement Check Done', 'measurement_check_done', 'checkbox', True),
            _f('Brand Review Requested', 'brand_review_requested', 'checkbox', True),
        ],
        'data': [
            _f('Sample Reference Number', 'sample_reference_number', 'text', True),
            _f('Sample Date', 'sample_date', 'date', True),
            _f('Measurement Results', 'measurement_results', 'textarea'),
            _f('Fit Notes', 'fit_notes', 'textarea'),
            _f('Sample Review Comments', 'sample_review_comments', 'textarea'),
            _f('Issues Found', 'issues_found', 'textarea'),
            _f('Revision Required', 'revision_required', 'dropdown', False, '', ['Yes', 'No']),
        ],
        'attachments': [
            _f('Sample Images (Front / Back / Side)', 'sample_images', 'file', True),
            _f('Measurement Sheet', 'measurement_sheet', 'file'),
        ],
        'output': [
            _f('Sample Status', 'sample_status', 'dropdown', True, '', ['Approved', 'Rejected', 'Revision Required']),
        ],
    },
    {
        'code': 'T05', 'name': 'Costing', 'phase': 'product_development', 'seq': 5,
        'dept': 'Costing', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T06',
        'description': 'Initial cost breakdown — fabric, trim, labor, overhead, FOB calculation',
        'tasks': [],
        'data': [
            _f('Fabric Cost (per unit)', 'fabric_cost', 'decimal', True),
            _f('Trim Cost (per unit)', 'trim_cost', 'decimal', True),
            _f('Labor Cost (per unit)', 'labor_cost', 'decimal', True),
            _f('Overhead Cost (per unit)', 'overhead_cost', 'decimal', True),
            _f('Packaging Cost (per unit)', 'packaging_cost', 'decimal'),
            _f('Freight / Logistics Cost', 'freight_cost', 'decimal'),
            _f('Agent Commission', 'agent_commission', 'decimal'),
            _f('Total FOB Cost', 'total_fob_cost', 'decimal', False, 'auto.calculated'),
            _f('Target FOB', 'target_fob', 'decimal'),
            _f('Cost Margin', 'cost_margin', 'decimal', False, 'auto.calculated'),
            _f('Currency', 'currency', 'dropdown', False, '', ['USD', 'EUR', 'CNY', 'INR']),
            _f('BOM (Bill of Materials)', 'bom', 'textarea'),
        ],
        'attachments': [
            _f('Cost Sheet Upload', 'cost_sheet_upload', 'file', True),
            _f('BOM Document', 'bom_document', 'file'),
        ],
        'output': [
            _f('Costing Status', 'costing_status', 'dropdown', True, '', ['Pending', 'Approved', 'Revision Required']),
        ],
    },
    {
        'code': 'T06', 'name': 'Material / Sample Testing', 'phase': 'product_development', 'seq': 6,
        'dept': 'Quality', 'submit': 'QC Inspector', 'review': 'QC Manager', 'approve': 'QC Manager', 'next': 'T07',
        'description': 'Lab testing — GSM, color fastness, shrinkage, tensile strength, chemical compliance',
        'tasks': [
            _f('Lab Test Requested', 'lab_test_requested', 'checkbox', True),
            _f('Fabric GSM Test Done', 'fabric_gsm_test_done', 'checkbox', True),
            _f('Color Fastness Test Done', 'color_fastness_test_done', 'checkbox', True),
            _f('Shrinkage Test Done', 'shrinkage_test_done', 'checkbox'),
            _f('Tear / Tensile Strength Test Done', 'tear_tensile_test_done', 'checkbox'),
            _f('Function Test Done', 'function_test_done', 'checkbox'),
            _f('Chemical / Compliance Test Done', 'chemical_compliance_test_done', 'checkbox'),
        ],
        'data': [
            _f('Lab Name', 'lab_name', 'text'),
            _f('Test Report Reference', 'test_report_reference', 'text'),
            _f('Fabric GSM Result', 'fabric_gsm_result', 'number'),
            _f('Color Fastness Result', 'color_fastness_result', 'dropdown', False, '', ['Pass', 'Fail', 'Conditional']),
            _f('Shrinkage %', 'shrinkage_percent', 'number'),
            _f('Tear Strength Result', 'tear_strength_result', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Function Test Result', 'function_test_result', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Chemical Test Result', 'chemical_test_result', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Overall Test Result', 'overall_test_result', 'dropdown', True, '', ['Pass', 'Fail', 'Conditional']),
            _f('Test Notes / Comments', 'test_notes', 'textarea'),
        ],
        'attachments': [
            _f('Lab Test Report', 'lab_test_report', 'file', True),
        ],
        'output': [
            _f('Testing Status', 'testing_status', 'dropdown', True, '', ['Pending', 'Pass', 'Fail', 'Conditional']),
        ],
    },
    {
        'code': 'T07', 'name': 'Final Sample Approval', 'phase': 'product_development', 'seq': 7,
        'dept': 'QC', 'submit': 'QC Inspector', 'review': 'QC Manager', 'approve': 'Admin / Merchandiser', 'next': 'T08',
        'description': 'PP sample review — fit, appearance, function, label, measurement approval',
        'tasks': [
            _f('PP Sample Received', 'pp_sample_received', 'checkbox', True),
            _f('Fit Approval Completed', 'fit_approval_completed', 'checkbox', True),
            _f('Appearance Approval Completed', 'appearance_approval_completed', 'checkbox', True),
            _f('Function Test Completed', 'function_test_completed', 'checkbox', True),
            _f('Label / Trim Approval Completed', 'label_trim_approval_completed', 'checkbox', True),
            _f('Measurement Check Completed', 'measurement_check_completed', 'checkbox', True),
        ],
        'data': [
            _f('PP Sample Reference', 'pp_sample_reference', 'text', True),
            _f('PP Sample Date', 'pp_sample_date', 'date', True),
            _f('Fit Approved', 'fit_approved', 'dropdown', False, '', ['Yes', 'No', 'Conditional']),
            _f('Appearance Approved', 'appearance_approved', 'dropdown', False, '', ['Yes', 'No', 'Conditional']),
            _f('Function Test Result', 'function_test_result_final', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Measurement Result', 'measurement_result', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('PP Sample Comments', 'pp_sample_comments', 'textarea'),
            _f('Revisions Required', 'revisions_required', 'textarea'),
            _f('Top Sample Reference', 'top_sample_reference', 'text'),
            _f('Top Sample Result', 'top_sample_result', 'dropdown', False, '', ['Approved', 'Rejected', 'Pending']),
        ],
        'attachments': [
            _f('PP Sample Photos', 'pp_sample_photos', 'file', True),
            _f('Measurement Sheet', 'pp_measurement_sheet', 'file'),
        ],
        'output': [
            _f('Final Sample Status', 'final_sample_status', 'dropdown', True, '', ['Approved', 'Rejected', 'Conditional']),
        ],
    },

    # ── PHASE 2: Order Management (T08-T10) ──
    {
        'code': 'T08', 'name': 'Final Costing', 'phase': 'order_management', 'seq': 8,
        'dept': 'Merchandising', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T09',
        'description': 'Updated cost breakdown after sampling, confirmed pricing with brand',
        'tasks': [],
        'data': [
            _f('Updated Fabric Cost', 'updated_fabric_cost', 'decimal', True),
            _f('Updated Trim Cost', 'updated_trim_cost', 'decimal', True),
            _f('Updated Labor Cost', 'updated_labor_cost', 'decimal', True),
            _f('Updated Overhead', 'updated_overhead', 'decimal', True),
            _f('Final FOB Cost', 'final_fob_cost', 'decimal', False, 'auto.calculated'),
            _f('Confirmed Price with Brand', 'confirmed_price', 'decimal', True),
            _f('Profit Margin %', 'profit_margin', 'decimal', False, 'auto.calculated'),
            _f('Final Currency', 'final_currency', 'dropdown', True, '', ['USD', 'EUR', 'CNY', 'INR']),
        ],
        'attachments': [
            _f('Final Cost Sheet', 'final_cost_sheet', 'file', True),
        ],
        'output': [
            _f('Final Costing Status', 'final_costing_status', 'dropdown', True, '', ['Pending', 'Approved', 'Revision Required']),
        ],
    },
    {
        'code': 'T09', 'name': 'Purchase Order', 'phase': 'order_management', 'seq': 9,
        'dept': 'Sales', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T10',
        'description': 'Customer PO confirmation — quantity, pricing, delivery terms, destination',
        'tasks': [],
        'data': [
            _f('Customer PO Number', 'customer_po_number', 'text', True),
            _f('PO Date', 'po_date', 'date', True),
            _f('PO Quantity (per size/color)', 'po_quantity', 'table', True),
            _f('Unit Price', 'unit_price', 'decimal', True),
            _f('Total PO Value', 'total_po_value', 'decimal', False, 'auto.calculated'),
            _f('Delivery Terms', 'delivery_terms', 'dropdown', False, '', ['FOB', 'CIF', 'EXW']),
            _f('Payment Terms', 'payment_terms', 'text'),
            _f('Destination Country', 'destination_country', 'text', True),
            _f('Destination Port', 'destination_port', 'text'),
            _f('ETD', 'etd', 'date', True),
            _f('ETA', 'eta', 'date'),
        ],
        'attachments': [
            _f('Customer PO Document', 'customer_po_document', 'file', True),
            _f('Proforma Invoice', 'proforma_invoice', 'file'),
        ],
        'output': [
            _f('PO Status', 'po_status', 'dropdown', True, '', ['Draft', 'Confirmed', 'Cancelled']),
        ],
    },
    {
        'code': 'T10', 'name': 'Merchandising', 'phase': 'order_management', 'seq': 10,
        'dept': 'Merchandising', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T11',
        'description': 'Factory confirmation, production timeline, critical path issuance',
        'tasks': [
            _f('Factory Confirmed', 'factory_confirmed', 'checkbox', True),
            _f('Production Timeline Created', 'production_timeline_created', 'checkbox', True),
            _f('Critical Path Issued', 'critical_path_issued', 'checkbox', True),
            _f('Vendor Communication Sent', 'vendor_communication_sent', 'checkbox', True),
        ],
        'data': [
            _f('Production Start Date', 'production_start_date', 'date', True),
            _f('Production End Date', 'production_end_date', 'date', True),
            _f('Delivery Date', 'delivery_date', 'date', True),
            _f('Critical Path Milestones', 'critical_path_milestones', 'textarea'),
            _f('Vendor Contacts Confirmed', 'vendor_contacts_confirmed', 'text'),
        ],
        'attachments': [
            _f('Critical Path Document', 'critical_path_document', 'file', True),
            _f('Factory Acknowledgment', 'factory_acknowledgment', 'file'),
        ],
        'output': [
            _f('Merchandising Status', 'merchandising_status', 'dropdown', True, '', ['Pending', 'Completed']),
        ],
    },

    # ── PHASE 3: Production Preparation (T11-T15) ──
    {
        'code': 'T11', 'name': 'Bulk Material Ordering', 'phase': 'production_prep', 'seq': 11,
        'dept': 'Procurement', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T12',
        'description': 'Fabric, trim, accessory, and packaging material ordering for bulk production',
        'tasks': [
            _f('Fabric Order Placed', 'fabric_order_placed', 'checkbox', True),
            _f('Trim Order Placed', 'trim_order_placed', 'checkbox', True),
            _f('Accessories Order Placed', 'accessories_order_placed', 'checkbox', True),
            _f('Packaging Material Ordered', 'packaging_material_ordered', 'checkbox', True),
            _f('ETA Confirmed from Suppliers', 'eta_confirmed', 'checkbox', True),
        ],
        'data': [
            _f('Fabric Supplier', 'bulk_fabric_supplier', 'dropdown', True),
            _f('Fabric Order Qty (meters/kg)', 'fabric_order_qty', 'number', True),
            _f('Fabric ETA', 'fabric_eta', 'date', True),
            _f('Trim Supplier', 'bulk_trim_supplier', 'dropdown'),
            _f('Trim ETA', 'trim_eta', 'date'),
            _f('Packaging Supplier', 'packaging_supplier', 'dropdown'),
            _f('Packaging ETA', 'packaging_eta', 'date'),
        ],
        'attachments': [
            _f('Purchase Orders to Suppliers', 'po_to_suppliers', 'file'),
        ],
        'output': [
            _f('Materials Order Status', 'materials_order_status', 'dropdown', True, '', ['Ordered', 'Partial', 'Received', 'Delayed']),
        ],
    },
    {
        'code': 'T12', 'name': 'Tooling', 'phase': 'production_prep', 'seq': 12,
        'dept': 'Production', 'submit': 'Factory Manager', 'review': 'Production Manager', 'approve': 'Production Manager', 'next': 'T13',
        'description': 'Cutting tools, molds, sewing machine setup, assembly equipment, calibration',
        'tasks': [
            _f('Cutting Tools Prepared', 'cutting_tools_prepared', 'checkbox', True),
            _f('Molds / Dies Ready', 'molds_dies_ready', 'checkbox'),
            _f('Sewing Machines Set Up', 'sewing_machines_setup', 'checkbox', True),
            _f('Assembly Equipment Ready', 'assembly_equipment_ready', 'checkbox', True),
            _f('Tool Calibration Done', 'tool_calibration_done', 'checkbox', True),
        ],
        'data': [
            _f('Machine Count', 'machine_count', 'number'),
            _f('Line Setup Notes', 'line_setup_notes', 'textarea'),
            _f('Tooling Issues', 'tooling_issues', 'textarea'),
        ],
        'attachments': [
            _f('Tooling Evidence Photos', 'tooling_evidence', 'file'),
        ],
        'output': [
            _f('Tooling Status', 'tooling_status', 'dropdown', True, '', ['Ready', 'In Progress', 'Not Started']),
        ],
    },
    {
        'code': 'T13', 'name': 'SOP', 'phase': 'production_prep', 'seq': 13,
        'dept': 'QC', 'submit': 'QC Manager', 'review': 'Production Manager', 'approve': 'Admin', 'next': 'T14',
        'description': 'Standard Operating Procedures — production, quality, packing, safety SOPs',
        'tasks': [
            _f('Production SOP Created', 'production_sop_created', 'checkbox', True),
            _f('Quality SOP Created', 'quality_sop_created', 'checkbox', True),
            _f('Packing SOP Created', 'packing_sop_created', 'checkbox', True),
            _f('Safety SOP Created', 'safety_sop_created', 'checkbox'),
            _f('SOPs Issued to Floor', 'sops_issued', 'checkbox', True),
        ],
        'data': [
            _f('SOP Version', 'sop_version', 'text', True),
            _f('Key Quality Points', 'key_quality_points', 'textarea', True),
            _f('Critical Operations', 'critical_operations', 'textarea', True),
            _f('AQL Level for this Order', 'aql_level', 'dropdown', False, '', ['Level I', 'Level II', 'Level III']),
        ],
        'attachments': [
            _f('Production SOP Document', 'production_sop_doc', 'file', True),
            _f('Quality SOP Document', 'quality_sop_doc', 'file', True),
            _f('Packing SOP Document', 'packing_sop_doc', 'file', True),
        ],
        'output': [
            _f('SOP Status', 'sop_status', 'dropdown', True, '', ['Issued', 'Draft', 'Pending Review']),
        ],
    },
    {
        'code': 'T14', 'name': 'IQC / Material In-housing', 'phase': 'production_prep', 'seq': 14,
        'dept': 'Quality', 'submit': 'QC Inspector', 'review': 'QC Manager', 'approve': 'QC Manager', 'next': 'T15',
        'description': 'Incoming quality control — fabric, trim, packaging inspection on receipt',
        'tasks': [
            _f('Fabric Received and Counted', 'fabric_received', 'checkbox', True),
            _f('Fabric Inspection Done', 'fabric_inspection_done', 'checkbox', True),
            _f('Trim Inspection Done', 'trim_inspection_done', 'checkbox', True),
            _f('Packaging Inspection Done', 'packaging_inspection_done', 'checkbox', True),
            _f('Approved / Rejected Decision Made', 'iqc_decision_made', 'checkbox', True),
        ],
        'data': [
            _f('Fabric Received Qty (meters/kg)', 'fabric_received_qty', 'number', True),
            _f('Fabric Inspected Qty', 'fabric_inspected_qty', 'number', True),
            _f('Fabric Defect Rate %', 'fabric_defect_rate', 'decimal'),
            _f('Fabric Inspection Result', 'fabric_inspection_result', 'dropdown', False, '', ['Pass', 'Fail', 'Conditional']),
            _f('Trim Inspection Result', 'trim_inspection_result', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Packaging Inspection Result', 'packaging_inspection_result', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('IQC Overall Result', 'iqc_overall_result', 'dropdown', True, '', ['Pass', 'Fail', 'Conditional']),
            _f('IQC Comments', 'iqc_comments', 'textarea'),
        ],
        'attachments': [
            _f('IQC Inspection Photos', 'iqc_photos', 'file'),
            _f('Fabric Test Reports', 'iqc_fabric_reports', 'file'),
        ],
        'output': [
            _f('IQC Status', 'iqc_status', 'dropdown', True, '', ['Accepted', 'Rejected', 'Conditional']),
        ],
    },
    {
        'code': 'T15', 'name': 'Production Planning', 'phase': 'production_prep', 'seq': 15,
        'dept': 'Production', 'submit': 'Production Manager', 'review': 'Admin', 'approve': 'Production Manager', 'next': 'T16',
        'description': 'Production line allocation, worker assignment, daily output planning, size/color breakdown',
        'tasks': [],
        'data': [
            _f('Production Start Date', 'prod_start_date', 'date', True),
            _f('Production End Date', 'prod_end_date', 'date', True),
            _f('Production Line', 'production_line', 'text', True),
            _f('Line Supervisor', 'line_supervisor', 'dropdown', True),
            _f('Total Workers Assigned', 'total_workers', 'number', True),
            _f('Machines Assigned', 'machines_assigned', 'number'),
            _f('Planned Daily Output (units)', 'planned_daily_output', 'number', True),
            _f('Total Order Quantity', 'total_order_qty', 'number', False, 'order.quantity'),
            _f('Production Days Required', 'production_days', 'number', False, 'auto.calculated'),
            _f('Size Breakdown Plan', 'size_breakdown', 'textarea', True),
            _f('Color Breakdown Plan', 'color_breakdown', 'textarea', True),
            _f('Production Issues / Risks', 'production_risks', 'textarea'),
        ],
        'attachments': [
            _f('Production Schedule', 'production_schedule', 'file'),
        ],
        'output': [
            _f('Planning Status', 'planning_status', 'dropdown', True, '', ['Planned', 'Confirmed', 'Pending']),
        ],
    },

    # ── PHASE 4: Production Execution (T16-T18) ──
    {
        'code': 'T16', 'name': 'Cutting', 'phase': 'production_execution', 'seq': 16,
        'dept': 'Production', 'submit': 'Factory QC', 'review': 'Factory Manager', 'approve': 'Factory Manager', 'next': 'T17',
        'description': 'Fabric spreading, marker planning, cutting, panel counting, QC check',
        'tasks': [
            _f('Fabric Spreading Completed', 'fabric_spreading', 'checkbox', True),
            _f('Marker Planning Done', 'marker_planning', 'checkbox', True),
            _f('Cutting Completed', 'cutting_completed', 'checkbox', True),
            _f('Cut Panels Counted and Bundled', 'panels_counted', 'checkbox', True),
            _f('Cutting QC Check Done', 'cutting_qc_check', 'checkbox', True),
        ],
        'data': [
            _f('Cutting Date', 'cutting_date', 'date', True),
            _f('Fabric Layers', 'fabric_layers', 'number'),
            _f('Panels Cut', 'panels_cut', 'number', True),
            _f('Wastage %', 'wastage_percent', 'decimal'),
            _f('Cutting Defects Found', 'cutting_defects', 'number'),
            _f('Cutting Notes', 'cutting_notes', 'textarea'),
        ],
        'attachments': [
            _f('Cutting Evidence Photos', 'cutting_evidence', 'file'),
        ],
        'output': [
            _f('Cutting Status', 'cutting_status', 'dropdown', True, '', ['Completed', 'In Progress', 'Pending']),
        ],
    },
    {
        'code': 'T17', 'name': 'Sewing / Stitching', 'phase': 'production_execution', 'seq': 17,
        'dept': 'Production', 'submit': 'Factory QC', 'review': 'Factory Manager', 'approve': 'Factory Manager', 'next': 'T18',
        'description': 'Panel joining, seam quality, SPI verification, inline inspection at sewing',
        'tasks': [
            _f('Panel Joining Completed', 'panel_joining', 'checkbox', True),
            _f('Seam Quality Checked', 'seam_quality_checked', 'checkbox', True),
            _f('SPI (Stitches Per Inch) Verified', 'spi_verified', 'checkbox', True),
            _f('Measurement Check Done', 'sewing_measurement_check', 'checkbox', True),
            _f('Inline Inspection at Sewing Done', 'inline_at_sewing', 'checkbox', True),
        ],
        'data': [
            _f('Sewing Line', 'sewing_line', 'text', True),
            _f('Daily Output — Input', 'sewing_input', 'number', True),
            _f('Daily Output — Output', 'sewing_output', 'number', True),
            _f('Rejection at Sewing', 'sewing_rejection', 'number'),
            _f('WIP at Sewing', 'sewing_wip', 'number'),
            _f('SPI Result', 'spi_result', 'number'),
            _f('Sewing Defects', 'sewing_defects', 'textarea'),
        ],
        'attachments': [
            _f('Sewing Evidence Photos', 'sewing_evidence', 'file'),
        ],
        'output': [
            _f('Sewing Status', 'sewing_status', 'dropdown', True, '', ['Completed', 'In Progress', 'Pending']),
        ],
    },
    {
        'code': 'T18', 'name': 'Assembly / Lasting', 'phase': 'production_execution', 'seq': 18,
        'dept': 'Production', 'submit': 'Factory QC', 'review': 'Factory Manager', 'approve': 'Factory Manager', 'next': 'T19',
        'description': 'Final assembly, trimming, finishing, label attachment, spot checks',
        'tasks': [
            _f('Final Assembly Completed', 'final_assembly', 'checkbox', True),
            _f('Trimming / Finishing Done', 'trimming_finishing', 'checkbox', True),
            _f('Label / Hang Tag Attached', 'label_attached', 'checkbox', True),
            _f('Spot Checks Done', 'spot_checks', 'checkbox', True),
        ],
        'data': [
            _f('Assembly Line', 'assembly_line', 'text', True),
            _f('Input Qty', 'assembly_input', 'number', True),
            _f('Output Qty', 'assembly_output', 'number', True),
            _f('Rejection at Assembly', 'assembly_rejection', 'number'),
            _f('WIP', 'assembly_wip', 'number'),
            _f('Assembly Notes', 'assembly_notes', 'textarea'),
        ],
        'attachments': [
            _f('Assembly Evidence Photos', 'assembly_evidence', 'file'),
        ],
        'output': [
            _f('Assembly Status', 'assembly_status', 'dropdown', True, '', ['Completed', 'In Progress', 'Pending']),
        ],
    },

    # ── PHASE 5: Quality Control (T19-T21) ──
    {
        'code': 'T19', 'name': 'Inline Inspection', 'phase': 'quality_control', 'seq': 19,
        'dept': 'QC', 'submit': 'QC Inspector / 3rd Party', 'review': 'QC Manager', 'approve': 'QC Manager', 'next': 'T20',
        'description': 'AQL-based inline inspection — workmanship, measurement, stitching, label, color checks',
        'tasks': [
            _f('Workmanship Check', 'workmanship_check', 'checkbox', True),
            _f('Measurement Verification', 'measurement_verification', 'checkbox', True),
            _f('Stitching Check', 'stitching_check', 'checkbox', True),
            _f('Label Check', 'label_check', 'checkbox', True),
            _f('Color Shade Check', 'color_shade_check', 'checkbox', True),
        ],
        'data': [
            _f('Inspector Type', 'inspector_type', 'dropdown', False, '', ['Internal', '3rd Party']),
            _f('Inspector Name', 'inspector_name', 'dropdown', True),
            _f('Inspection Date', 'inspection_date', 'date', True),
            _f('Inspection Stage', 'inspection_stage', 'dropdown', False, '', ['30%', '50%', 'Final']),
            _f('Lot Size', 'lot_size', 'number', True),
            _f('Sample Size', 'sample_size', 'number', False, 'auto.aql'),
            _f('AQL Level', 'aql_level', 'dropdown', True, '', ['Level I', 'Level II', 'Level III']),
            _f('Defects Found — Minor', 'defects_minor', 'number', True),
            _f('Defects Found — Major', 'defects_major', 'number', True),
            _f('Defects Found — Critical', 'defects_critical', 'number', True),
            _f('Defect Details', 'defect_details', 'table'),
            _f('Inspection Result', 'inline_result', 'dropdown', False, 'auto.aql', ['Pass', 'Fail']),
            _f('Inspector Comments', 'inspector_comments', 'textarea'),
        ],
        'attachments': [
            _f('Inspection Photos', 'inline_inspection_photos', 'file', True),
        ],
        'output': [
            _f('Inline Inspection Status', 'inline_status', 'dropdown', True, '', ['Pass', 'Fail', 'Pending']),
        ],
    },
    {
        'code': 'T20', 'name': 'Packing', 'phase': 'quality_control', 'seq': 20,
        'dept': 'Production', 'submit': 'Factory QC', 'review': 'Factory Manager', 'approve': 'Factory Manager', 'next': 'T21',
        'description': 'Polybag/carton packing, carton marking, barcode labels, packing list',
        'tasks': [
            _f('Polybag Packing Completed', 'polybag_packing', 'checkbox', True),
            _f('Carton Packing Completed', 'carton_packing', 'checkbox', True),
            _f('Carton Marking Done', 'carton_marking', 'checkbox', True),
            _f('Barcode Labels Applied', 'barcode_labels', 'checkbox', True),
            _f('Packing List Prepared', 'packing_list_prepared', 'checkbox', True),
        ],
        'data': [
            _f('Total Cartons Packed', 'total_cartons', 'number', True),
            _f('Pieces per Carton', 'pieces_per_carton', 'number', True),
            _f('Carton Length (cm)', 'carton_length', 'number', True),
            _f('Carton Width (cm)', 'carton_width', 'number', True),
            _f('Carton Height (cm)', 'carton_height', 'number', True),
            _f('Carton Weight (kg)', 'carton_weight', 'decimal', True),
            _f('Total Packed Qty', 'total_packed_qty', 'number', True),
            _f('Packing Notes', 'packing_notes', 'textarea'),
        ],
        'attachments': [
            _f('Packing Evidence Photos', 'packing_evidence', 'file', True),
            _f('Packing List Document', 'packing_list_doc', 'file', True),
        ],
        'output': [
            _f('Packing Status', 'packing_status', 'dropdown', True, '', ['Completed', 'In Progress', 'Pending']),
        ],
    },
    {
        'code': 'T21', 'name': 'Final Inspection', 'phase': 'quality_control', 'seq': 21,
        'dept': 'QC', 'submit': 'QC Inspector / 3rd Party', 'review': 'QC Manager', 'approve': 'QC Manager', 'next': 'T22',
        'description': 'Comprehensive final/pre-shipment inspection — AQL, carton, packaging, product, fitting checks',
        'tasks': [],
        'data': [
            _f('Inspection Type', 'fi_inspection_type', 'dropdown', False, '', ['Final', 'Pre-shipment']),
            _f('Inspection Times', 'fi_inspection_times', 'dropdown', False, '', ['1st', '2nd', '3rd']),
            _f('Inspector Type', 'fi_inspector_type', 'dropdown', False, '', ['Internal', '3rd Party']),
            _f('Inspector Name', 'fi_inspector_name', 'dropdown', True),
            _f('Inspection Date', 'fi_inspection_date', 'date', True),
            _f('Lot Size', 'fi_lot_size', 'number', True),
            _f('Sample Size', 'fi_sample_size', 'number', False, 'auto.aql'),
            _f('Minor Defects Found', 'fi_minor', 'number', True),
            _f('Major Defects Found', 'fi_major', 'number', True),
            _f('Critical Defects Found', 'fi_critical', 'number', True),
            _f('AQL Result', 'fi_aql_result', 'dropdown', False, 'auto.aql', ['Pass', 'Fail']),
            _f('Packing List Verified', 'packing_list_verified', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('PO Quantity Verified', 'po_qty_verified', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Carton Dimension Check', 'carton_dimension_check', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Carton Weight Check', 'carton_weight_check', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Carton Marking Check', 'carton_marking_check', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Drop Test', 'drop_test', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Moisture Test — Carton', 'moisture_test_carton', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Moisture Test — Goods', 'moisture_test_goods', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Metal / Needle Detection', 'metal_detection', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Barcode Readability', 'barcode_readability', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Labeling Check', 'labeling_check', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Packaging Check', 'packaging_check', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Smell Test', 'smell_test', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Weight / GSM Test', 'weight_gsm_test', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Pull Test', 'pull_test', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Adhesive Test', 'adhesive_test', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Hand Feel Check', 'hand_feel_check', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Color Shade Check', 'fi_color_shade', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Color Fastness', 'fi_color_fastness', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Function Test', 'fi_function_test', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Seam Strength Test', 'seam_strength', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Stitching SPI', 'fi_spi', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Home Launder Test', 'home_launder', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('PP Sample Fitting', 'pp_sample_fitting', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Bulk Fitting', 'bulk_fitting', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Printing / Embroidery Check', 'print_embroidery', 'dropdown', False, '', ['Pass', 'Fail']),
            _f('Defect Table', 'fi_defect_table', 'table'),
        ],
        'attachments': [
            _f('All Section Photos', 'fi_all_photos', 'file', True),
            _f('Inspector Signature', 'fi_inspector_signature', 'signature', True),
            _f('Factory Signature', 'fi_factory_signature', 'signature', True),
        ],
        'output': [
            _f('Final Inspection Result', 'fi_result', 'dropdown', True, '', ['Pass', 'Fail', 'Pending']),
        ],
    },

    # ── PHASE 6: Logistics (T22-T25) ──
    {
        'code': 'T22', 'name': 'Dispatch', 'phase': 'logistics', 'seq': 22,
        'dept': 'Logistics', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T23',
        'description': 'Packing list finalization, commercial invoice, export documents, forwarder handover',
        'tasks': [
            _f('Packing List Finalized', 'packing_list_finalized', 'checkbox', True),
            _f('Commercial Invoice Ready', 'commercial_invoice_ready', 'checkbox', True),
            _f('Export Documents Ready', 'export_docs_ready', 'checkbox', True),
            _f('Goods Handed to Forwarder', 'goods_to_forwarder', 'checkbox', True),
        ],
        'data': [
            _f('Dispatch Date', 'dispatch_date', 'date', True),
            _f('Forwarder Name', 'forwarder_name', 'text', True),
            _f('Total Cartons', 'dispatch_cartons', 'number', True),
            _f('Total CBM', 'total_cbm', 'decimal'),
            _f('Total Weight (kg)', 'dispatch_weight', 'decimal'),
            _f('Dispatch Notes', 'dispatch_notes', 'textarea'),
        ],
        'attachments': [
            _f('Packing List', 'dispatch_packing_list', 'file', True),
            _f('Commercial Invoice', 'commercial_invoice', 'file', True),
        ],
        'output': [
            _f('Dispatch Status', 'dispatch_status', 'dropdown', True, '', ['Dispatched', 'Pending', 'Delayed']),
        ],
    },
    {
        'code': 'T23', 'name': 'Container Loading', 'phase': 'logistics', 'seq': 23,
        'dept': 'Logistics', 'submit': 'Logistics / Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T24',
        'description': 'Container inspection, loading, sealing, loading report',
        'tasks': [
            _f('Container Inspected', 'container_inspected', 'checkbox', True),
            _f('Loading Started', 'loading_started', 'checkbox', True),
            _f('Loading Completed', 'loading_completed', 'checkbox', True),
            _f('Container Sealed', 'container_sealed', 'checkbox', True),
        ],
        'data': [
            _f('Container Number', 'container_number', 'text', True),
            _f('Container Size', 'container_size', 'dropdown', False, '', ['20ft', '40ft', '40HC', 'LCL']),
            _f('Container Seal Number', 'seal_number', 'text', True),
            _f('Loading Date', 'loading_date', 'date', True),
            _f('Cartons Loaded', 'cartons_loaded', 'number', True),
            _f('Total CBM Used', 'cbm_used', 'decimal'),
            _f('Loading Photos Count', 'loading_photos_count', 'number'),
            _f('Container Issues', 'container_issues', 'textarea'),
        ],
        'attachments': [
            _f('Container Loading Photos', 'loading_photos', 'file', True),
            _f('Container Inspection Report', 'container_report', 'file'),
        ],
        'output': [
            _f('Loading Status', 'loading_status', 'dropdown', True, '', ['Loaded', 'In Progress', 'Pending']),
        ],
    },
    {
        'code': 'T24', 'name': 'Shipment / Port Handover', 'phase': 'logistics', 'seq': 24,
        'dept': 'Logistics', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': 'T25',
        'description': 'Shipping line, vessel, ETD/ETA, bill of lading, customs documentation',
        'tasks': [],
        'data': [
            _f('Shipping Line', 'shipping_line', 'text', True),
            _f('Vessel Name', 'vessel_name', 'text'),
            _f('Voyage Number', 'voyage_number', 'text'),
            _f('ETD (Port of Loading)', 'ship_etd', 'date', True),
            _f('ETA (Port of Destination)', 'ship_eta', 'date', True),
            _f('Port of Loading', 'port_loading', 'text', True),
            _f('Port of Destination', 'port_destination', 'text', True),
            _f('Shipment Mode', 'shipment_mode', 'dropdown', False, '', ['Sea', 'Air']),
            _f('Bill of Lading Number', 'bl_number', 'text', True),
            _f('Airway Bill Number', 'awb_number', 'text'),
            _f('Forwarder Reference', 'forwarder_ref', 'text'),
        ],
        'attachments': [
            _f('Bill of Lading / AWB', 'bl_awb_doc', 'file', True),
            _f('Customs Documents', 'customs_docs', 'file'),
        ],
        'output': [
            _f('Shipment Status', 'shipment_status', 'dropdown', True, '', ['Departed', 'In Transit', 'Arrived', 'Pending']),
        ],
    },
    {
        'code': 'T25', 'name': 'Warehousing', 'phase': 'logistics', 'seq': 25,
        'dept': 'Warehouse', 'submit': 'Warehouse Manager', 'review': 'Admin', 'approve': 'Admin', 'next': '',
        'description': 'Goods receiving, packing list verification, damage assessment, storage allocation',
        'tasks': [
            _f('Goods Received and Counted', 'goods_received', 'checkbox', True),
            _f('Packing List Verified', 'wh_packing_verified', 'checkbox', True),
            _f('Damages Noted', 'damages_noted', 'checkbox', True),
            _f('Goods Stored in Location', 'goods_stored', 'checkbox', True),
        ],
        'data': [
            _f('Received Date', 'received_date', 'date', True),
            _f('Warehouse Location', 'warehouse_location', 'text', True),
            _f('Cartons Received', 'cartons_received', 'number', True),
            _f('Units Received', 'units_received', 'number', True),
            _f('Damaged Cartons', 'damaged_cartons', 'number'),
            _f('Damaged Units', 'damaged_units', 'number'),
            _f('Storage Rack / Bay', 'storage_rack', 'text'),
            _f('Receiving Notes', 'receiving_notes', 'textarea'),
        ],
        'attachments': [
            _f('Receiving Evidence Photos', 'receiving_evidence', 'file', True),
        ],
        'output': [
            _f('Receiving Status', 'receiving_status', 'dropdown', True, '', ['Received', 'Partial', 'Damaged']),
        ],
    },

    # ── PHASE 7: Combined Operational (OP01-OP02) ──
    {
        'code': 'OP01', 'name': 'Production Control (DPR)', 'phase': 'combined_operational', 'seq': 26,
        'dept': 'Production', 'submit': 'Factory Manager', 'review': 'Production Manager', 'approve': 'Admin', 'next': '',
        'description': 'Daily Production Report — process tracking, defect log, efficiency, cumulative progress',
        'tasks': [],
        'data': [
            _f('Report Date', 'dpr_date', 'date', True),
            _f('Factory', 'dpr_factory', 'dropdown', True),
            _f('Production Line', 'dpr_line', 'text', True),
            _f('Supervisor', 'dpr_supervisor', 'dropdown', True),
            _f('Shift', 'dpr_shift', 'dropdown', True, '', ['Morning', 'Evening', 'Night']),
            _f('Working Hours', 'dpr_working_hours', 'number', True),
            _f('Workers Present', 'dpr_workers_present', 'number', True),
            _f('Machine Count', 'dpr_machine_count', 'number'),
            _f('Cutting — Input', 'cutting_input', 'number'),
            _f('Cutting — Output', 'cutting_output', 'number'),
            _f('Cutting — Rejected', 'cutting_rejected', 'number'),
            _f('Sewing — Input', 'sewing_dpr_input', 'number'),
            _f('Sewing — Output', 'sewing_dpr_output', 'number'),
            _f('Sewing — Rejected', 'sewing_dpr_rejected', 'number'),
            _f('Assembly — Input', 'assembly_dpr_input', 'number'),
            _f('Assembly — Output', 'assembly_dpr_output', 'number'),
            _f('Assembly — Rejected', 'assembly_dpr_rejected', 'number'),
            _f('Packing — Input', 'packing_dpr_input', 'number'),
            _f('Packing — Output', 'packing_dpr_output', 'number'),
            _f('Packing — Rejected', 'packing_dpr_rejected', 'number'),
            _f('Planned Daily Output', 'dpr_planned', 'number', True),
            _f('Actual Daily Output', 'dpr_actual', 'number', True),
            _f('Efficiency %', 'dpr_efficiency', 'decimal', False, 'auto.calculated'),
            _f('Cumulative Completed', 'dpr_cumulative', 'number', False, 'auto.calculated'),
            _f('% Complete', 'dpr_percent_complete', 'decimal', False, 'auto.calculated'),
        ],
        'attachments': [
            _f('DPR Evidence', 'dpr_evidence', 'file'),
        ],
        'output': [
            _f('Production Issues Log', 'production_issues_log', 'table'),
            _f('DPR Status', 'dpr_status', 'dropdown', True, '', ['Submitted', 'Reviewed', 'Pending']),
        ],
    },
    {
        'code': 'OP02', 'name': 'Shipment Tracking', 'phase': 'combined_operational', 'seq': 27,
        'dept': 'Logistics', 'submit': 'Merchandiser', 'review': 'Admin', 'approve': 'Admin', 'next': '',
        'description': 'End-to-end shipment stage tracker — dispatch to warehouse delivery',
        'tasks': [],
        'data': [
            _f('Container Number', 'st_container', 'text', True),
            _f('Vessel / Flight', 'st_vessel', 'text'),
            _f('BL / AWB Number', 'st_bl_number', 'text', True),
            _f('ETD', 'st_etd', 'date', True),
            _f('ETA', 'st_eta', 'date', True),
            _f('Dispatch Status', 'st_dispatch_status', 'dropdown', False, '', ['Pending', 'Done']),
            _f('Loading Status', 'st_loading_status', 'dropdown', False, '', ['Pending', 'Loaded']),
            _f('Port Departure Status', 'st_departure_status', 'dropdown', False, '', ['Pending', 'Departed']),
            _f('In Transit Status', 'st_transit_status', 'dropdown', False, '', ['On Schedule', 'Delayed']),
            _f('Port Arrival Status', 'st_arrival_status', 'dropdown', False, '', ['Pending', 'Arrived', 'Customs Hold']),
            _f('Customs Clearance', 'st_customs', 'dropdown', False, '', ['Pending', 'Cleared', 'Held']),
            _f('Warehouse Delivery', 'st_warehouse', 'dropdown', False, '', ['Pending', 'Delivered']),
            _f('Current Stage', 'st_current_stage', 'text', False, 'auto'),
            _f('Tracking Notes', 'st_notes', 'textarea'),
        ],
        'attachments': [
            _f('Tracking Documents', 'st_tracking_docs', 'file'),
        ],
        'output': [
            _f('Overall Shipment Status', 'st_overall_status', 'dropdown', True, '', ['In Transit', 'Delivered', 'Delayed', 'Pending']),
        ],
    },

    # ── PHASE 8: Quality System (QS01-QS06, MW01-MW02) ──
    {
        'code': 'QS01', 'name': 'Defect Library', 'phase': 'quality_system', 'seq': 28,
        'dept': 'QC', 'submit': 'QC Manager', 'review': 'Admin', 'approve': 'Admin', 'next': '',
        'description': 'Standardized defect database — code, severity, category, cause, corrective action',
        'tasks': [],
        'data': [
            _f('Defect Code', 'dl_defect_code', 'text', True),
            _f('Defect Name', 'dl_defect_name', 'text', True),
            _f('Defect Category', 'dl_category', 'dropdown', True, '', ['Stitching', 'Fabric', 'Finishing', 'Labeling', 'Packing', 'Measurement', 'Color']),
            _f('Severity', 'dl_severity', 'dropdown', True, '', ['Critical', 'Major', 'Minor']),
            _f('Product Category', 'dl_product_cat', 'dropdown', False, '', ['GAR', 'GLV', 'FTW', 'HDW', 'ACC', 'BAG']),
            _f('Description', 'dl_description', 'textarea'),
            _f('Cause', 'dl_cause', 'textarea'),
            _f('Corrective Action', 'dl_corrective_action', 'textarea'),
            _f('Active', 'dl_active', 'checkbox'),
        ],
        'attachments': [_f('Defect Reference Image', 'dl_reference_image', 'file')],
        'output': [],
    },
    {
        'code': 'QS02', 'name': 'Inspection Builder', 'phase': 'quality_system', 'seq': 29,
        'dept': 'QC', 'submit': 'QC Manager', 'review': 'Admin', 'approve': 'Admin', 'next': '',
        'description': 'Custom inspection checklist builder — sections, measurement tables, defect counters, AQL config',
        'tasks': [],
        'data': [
            _f('Template Name', 'ib_name', 'text', True),
            _f('Product Category', 'ib_category', 'dropdown', True, '', ['GAR', 'GLV', 'FTW', 'HDW', 'ACC', 'BAG']),
            _f('Version', 'ib_version', 'text', True),
            _f('Checklist Items', 'ib_checklist', 'table', True),
            _f('Measurement Table', 'ib_measurements', 'table'),
            _f('Defect Counter Config', 'ib_defect_config', 'table'),
            _f('Photo Upload Requirements', 'ib_photo_config', 'textarea'),
            _f('AQL Configuration', 'ib_aql_config', 'dropdown', False, '', ['Level I', 'Level II', 'Level III']),
            _f('Result Calculation Logic', 'ib_result_logic', 'textarea'),
        ],
        'attachments': [],
        'output': [_f('Builder Status', 'ib_status', 'dropdown', True, '', ['Active', 'Draft', 'Archived'])],
    },
    {
        'code': 'QS03', 'name': 'Supplier Scorecard', 'phase': 'quality_system', 'seq': 30,
        'dept': 'QC', 'submit': 'QC Manager', 'review': 'Admin', 'approve': 'Admin', 'next': '',
        'description': '4-metric weighted scorecard — inspection pass rate, delivery, defect rate, audit compliance',
        'tasks': [],
        'data': [
            _f('Supplier / Factory', 'sc_supplier', 'dropdown', True),
            _f('Evaluation Period', 'sc_period', 'text', True),
            _f('Inspection Pass Rate (%)', 'sc_inspection_rate', 'decimal', True),
            _f('Delivery Performance (%)', 'sc_delivery_rate', 'decimal', True),
            _f('Defect Rate (per 1000 units)', 'sc_defect_rate', 'decimal', True),
            _f('Audit Compliance Score (0-100)', 'sc_audit_score', 'number', True),
            _f('Overall Score', 'sc_overall', 'decimal', False, 'auto.calculated'),
            _f('Rating', 'sc_rating', 'dropdown', False, 'auto', ['Excellent', 'Good', 'Acceptable', 'Poor', 'Critical']),
        ],
        'attachments': [_f('Supporting Documents', 'sc_docs', 'file')],
        'output': [_f('Scorecard Status', 'sc_status', 'dropdown', True, '', ['Published', 'Draft'])],
    },
    {
        'code': 'QS04', 'name': 'Factory Audit', 'phase': 'quality_system', 'seq': 31,
        'dept': 'QC', 'submit': 'QC Manager / 3rd Party', 'review': 'Admin', 'approve': 'Admin', 'next': '',
        'description': '7-section factory audit — safety, labor, production, quality, environmental, social compliance',
        'tasks': [],
        'data': [
            _f('Factory Name', 'fa_factory', 'dropdown', True),
            _f('Audit Date', 'fa_audit_date', 'date', True),
            _f('Auditor Name', 'fa_auditor', 'text', True),
            _f('Safety Compliance Score (0-100)', 'fa_safety', 'number', True),
            _f('Labor Compliance Score (0-100)', 'fa_labor', 'number', True),
            _f('Production Capability Score (0-100)', 'fa_production', 'number', True),
            _f('Quality System Score (0-100)', 'fa_quality', 'number', True),
            _f('Environmental Score (0-100)', 'fa_environmental', 'number', True),
            _f('Social Compliance Score (0-100)', 'fa_social', 'number', True),
            _f('Overall Score', 'fa_overall', 'number', False, 'auto.calculated'),
            _f('Audit Result', 'fa_result', 'dropdown', False, '', ['Pass', 'Conditional', 'Fail']),
            _f('Findings Summary', 'fa_findings', 'textarea'),
            _f('Corrective Actions Required', 'fa_corrective', 'textarea'),
        ],
        'attachments': [
            _f('Audit Report', 'fa_report', 'file', True),
            _f('Audit Photos', 'fa_photos', 'file'),
        ],
        'output': [_f('Audit Status', 'fa_status', 'dropdown', True, '', ['Completed', 'Pending Follow-up', 'Failed'])],
    },
    {
        'code': 'QS05', 'name': 'CAPA', 'phase': 'quality_system', 'seq': 32,
        'dept': 'QC', 'submit': 'QC Manager', 'review': 'Production Manager', 'approve': 'Admin', 'next': '',
        'description': 'Corrective & Preventive Action — issue tracking, root cause, actions, closure',
        'tasks': [],
        'data': [
            _f('Issue ID', 'capa_id', 'text', False, 'auto'),
            _f('Source', 'capa_source', 'dropdown', True, '', ['Inspection', 'Audit', 'DPR', 'Customer Complaint']),
            _f('Linked Inspection / Report ID', 'capa_linked_id', 'text'),
            _f('Issue Description', 'capa_description', 'textarea', True),
            _f('Defect Category', 'capa_defect_category', 'dropdown'),
            _f('Severity', 'capa_severity', 'dropdown', True, '', ['Critical', 'Major', 'Minor']),
            _f('Root Cause Analysis', 'capa_root_cause', 'textarea', True),
            _f('Immediate Corrective Action', 'capa_corrective', 'textarea', True),
            _f('Preventive Action', 'capa_preventive', 'textarea', True),
            _f('Responsible Person', 'capa_responsible', 'dropdown', True),
            _f('Due Date', 'capa_due_date', 'date', True),
            _f('Verification Method', 'capa_verification', 'textarea'),
            _f('Status', 'capa_status', 'dropdown', True, '', ['Open', 'In Progress', 'Closed', 'Overdue']),
            _f('Closure Date', 'capa_closure_date', 'date'),
        ],
        'attachments': [_f('Closure Evidence', 'capa_evidence', 'file')],
        'output': [],
    },
    {
        'code': 'QS06', 'name': 'Risk Assessment', 'phase': 'quality_system', 'seq': 33,
        'dept': 'QC', 'submit': 'QC Manager', 'review': 'Admin', 'approve': 'Admin', 'next': '',
        'description': 'Risk identification, probability/impact assessment, mitigation planning',
        'tasks': [],
        'data': [
            _f('Risk Area', 'ra_area', 'dropdown', True, '', ['Supplier', 'Production', 'Quality', 'Logistics', 'Compliance']),
            _f('Risk Description', 'ra_description', 'textarea', True),
            _f('Probability', 'ra_probability', 'dropdown', True, '', ['Low', 'Medium', 'High']),
            _f('Impact', 'ra_impact', 'dropdown', True, '', ['Low', 'Medium', 'High']),
            _f('Risk Level', 'ra_level', 'dropdown', False, 'auto', ['Low', 'Medium', 'High', 'Critical']),
            _f('Mitigation Plan', 'ra_mitigation', 'textarea', True),
            _f('Risk Owner', 'ra_owner', 'dropdown', True),
            _f('Review Date', 'ra_review_date', 'date', True),
            _f('Status', 'ra_status', 'dropdown', True, '', ['Open', 'Mitigated', 'Closed']),
        ],
        'attachments': [_f('Risk Documents', 'ra_docs', 'file')],
        'output': [],
    },
    {
        'code': 'MW01', 'name': 'Master Workflow', 'phase': 'quality_system', 'seq': 34,
        'dept': '', 'submit': '', 'review': '', 'approve': '', 'next': '',
        'description': 'Read-only aggregated workflow view — 25-stage tracker, production progress, inspection summary',
        'tasks': [],
        'data': [
            _f('Order Summary', 'mw_order_summary', 'text', False, 'auto'),
            _f('Workflow Progress %', 'mw_progress', 'decimal', False, 'auto.calculated'),
            _f('Current Stage', 'mw_current_stage', 'text', False, 'auto'),
            _f('Stages Completed', 'mw_completed', 'number', False, 'auto'),
            _f('Stages Pending', 'mw_pending', 'number', False, 'auto'),
            _f('Production Progress — Cutting', 'mw_cutting', 'text', False, 'auto'),
            _f('Production Progress — Sewing', 'mw_sewing', 'text', False, 'auto'),
            _f('Production Progress — Assembly', 'mw_assembly', 'text', False, 'auto'),
            _f('Production Progress — Packing', 'mw_packing', 'text', False, 'auto'),
            _f('IQC Result', 'mw_iqc', 'text', False, 'auto'),
            _f('Inline Inspection Result', 'mw_inline', 'text', False, 'auto'),
            _f('Final Inspection Result', 'mw_final', 'text', False, 'auto'),
            _f('Shipment Status', 'mw_shipment', 'text', False, 'auto'),
            _f('Quality Alerts', 'mw_alerts', 'textarea', False, 'auto'),
        ],
        'attachments': [],
        'output': [],
    },
    {
        'code': 'MW02', 'name': 'Master Production Dashboard', 'phase': 'quality_system', 'seq': 35,
        'dept': '', 'submit': '', 'review': '', 'approve': '', 'next': '',
        'description': 'Live production KPIs — order progress, efficiency charts, quality alerts, shipment tracker',
        'tasks': [],
        'data': [
            _f('Total Orders Active', 'mpd_active_orders', 'number', False, 'auto'),
            _f('Orders On Track', 'mpd_on_track', 'number', False, 'auto'),
            _f('Orders Delayed', 'mpd_delayed', 'number', False, 'auto'),
            _f('Average Efficiency %', 'mpd_avg_efficiency', 'decimal', False, 'auto'),
            _f('Inspection Pass Rate %', 'mpd_pass_rate', 'decimal', False, 'auto'),
            _f('Open CAPAs', 'mpd_open_capas', 'number', False, 'auto'),
            _f('Shipments In Transit', 'mpd_in_transit', 'number', False, 'auto'),
            _f('Shipments Delivered', 'mpd_delivered', 'number', False, 'auto'),
            _f('Production Alerts', 'mpd_alerts', 'textarea', False, 'auto'),
        ],
        'attachments': [],
        'output': [],
    },
]


class Command(BaseCommand):
    help = 'Seed 35 inspection/department templates with fields from the QMS Master Plan'

    def add_arguments(self, parser):
        parser.add_argument('--org_id', type=str, default='', help='Specific organization UUID')

    def handle(self, *args, **options):
        org_id = options.get('org_id', '')
        if org_id:
            orgs = Organization.objects.filter(id=org_id)
        else:
            orgs = Organization.objects.filter(is_active=True)

        if not orgs.exists():
            self.stdout.write(self.style.WARNING('No organizations found.'))
            return

        for org in orgs:
            self.stdout.write(f'Seeding templates for: {org.name}')
            total_fields = 0

            for tpl_data in TEMPLATES:
                template, created = InspectionTemplate.objects.get_or_create(
                    organization=org,
                    code=tpl_data['code'],
                    defaults={
                        'name': tpl_data['name'],
                        'phase': tpl_data['phase'],
                        'phase_sequence': tpl_data['seq'],
                        'product_category': '',
                        'submitted_by_role': tpl_data.get('submit', ''),
                        'reviewed_by_role': tpl_data.get('review', ''),
                        'approved_by_role': tpl_data.get('approve', ''),
                        'next_template_code': tpl_data.get('next', ''),
                        'is_builtin': True,
                        'is_active': True,
                        'description': tpl_data.get('description', ''),
                    },
                )

                if not created:
                    self.stdout.write(f'  {tpl_data["code"]} already exists, skipping.')
                    continue

                # Create 7 sections
                sections = {}
                section_defs = [
                    ('header', 'Template Header', 0),
                    ('context', 'Product / Order Context', 1),
                    ('tasks', 'Department Tasks', 2),
                    ('data', 'Technical Data', 3),
                    ('attachments', 'Attachments / Evidence', 4),
                    ('output', 'Department Output', 5),
                    ('approval', 'Approval & Handover', 6),
                ]
                for block_type, name, sort_order in section_defs:
                    sec = TemplateSection.objects.create(
                        template=template,
                        block_type=block_type,
                        name=name,
                        sort_order=sort_order,
                    )
                    sections[block_type] = sec

                # Shared fields: header, context, approval
                total_fields += self._create_fields(sections['header'], HEADER_FIELDS)
                total_fields += self._create_fields(sections['context'], CONTEXT_FIELDS)
                total_fields += self._create_fields(sections['approval'], APPROVAL_FIELDS)

                # Template-specific fields
                for block in ('tasks', 'data', 'attachments', 'output'):
                    field_defs = tpl_data.get(block, [])
                    total_fields += self._create_fields(sections[block], field_defs)

                field_count = sum(s.fields.count() for s in sections.values())
                self.stdout.write(f'  {tpl_data["code"]} {tpl_data["name"]} — {field_count} fields')

            self.stdout.write(self.style.SUCCESS(
                f'Done for {org.name}: {InspectionTemplate.objects.filter(organization=org).count()} templates, {total_fields} total fields'
            ))

    def _create_fields(self, section, field_defs):
        """Create fields from a list of tuples. Returns count created."""
        count = 0
        for i, fd in enumerate(field_defs):
            if len(fd) == 6:
                label, key, ftype, required, auto, options = fd
            elif len(fd) == 5:
                label, key, ftype, required, auto = fd
                options = []
            else:
                label, key, ftype = fd[0], fd[1], fd[2]
                required, auto, options = False, '', []

            TemplateField.objects.create(
                section=section,
                label=label,
                field_key=key,
                field_type=ftype,
                is_required=required,
                sort_order=i,
                options=options if options else [],
                auto_fill_source=auto if auto else '',
            )
            count += 1
        return count
