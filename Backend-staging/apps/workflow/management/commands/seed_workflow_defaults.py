from django.core.management.base import BaseCommand
from apps.workflow.models import Department, WorkflowTemplate, WorkflowTemplateStage
from apps.accounts.models import Organization


# 26-stage master sequence (blueprint Section 2.1)
DEFAULT_STAGES = [
    (1, 'DESIGN', 'Design', 'DESIGN', 'Design Head', 5, None),
    (2, 'DEVELOPMENT', 'Development', 'DEVELOPMENT', 'Dev Manager', 7, 1),
    (3, 'SAMPLE_MATERIAL_SOURCING', 'Sample Material Sourcing', 'SOURCING', 'Sourcing Manager', 5, 2),
    (4, 'PROTOTYPE_SAMPLE', 'Prototype Sample', 'SAMPLING', 'Sampling Head', 7, 3),
    (5, 'COSTING_INITIAL', 'Initial Costing', 'COSTING', 'Costing Manager', 3, 4),
    (6, 'MATERIAL_TESTING', 'Material Testing', 'QUALITY', 'QC Manager', 5, 3),
    (7, 'FINAL_SAMPLE', 'Final Sample Approval', 'DEVELOPMENT', 'Dev Manager', 5, 4),
    (8, 'COSTING_FINAL', 'Final Costing', 'COSTING', 'Costing Manager', 3, 7),
    (9, 'PURCHASE_ORDER', 'Purchase Order', 'SALES', 'Sales Head', 2, None),
    (10, 'MERCHANDISING', 'Merchandising', 'MERCHANDISING', 'Merchandiser', 5, None),
    (11, 'BULK_MATERIAL_ORDER', 'Bulk Material Ordering', 'PROCUREMENT', 'Procurement Head', 7, 10),
    (12, 'TOOLING_PREP', 'Tooling Preparation', 'PRODUCTION', 'Production Manager', 5, 11),
    (13, 'SOP_CREATION', 'SOP Creation', 'QUALITY', 'QC Manager', 3, 12),
    (14, 'IQC', 'Incoming Material Inspection', 'QUALITY', 'QC Inspector', 3, 11),
    (15, 'PRODUCTION_PLANNING', 'Production Planning', 'PRODUCTION', 'Production Manager', 3, 14),
    (16, 'CUTTING', 'Cutting', 'PRODUCTION', 'Cutting Supervisor', 5, 15),
    (17, 'STITCHING', 'Stitching / Sewing', 'PRODUCTION', 'Line Supervisor', 7, 16),
    (18, 'ASSEMBLY', 'Assembly / Finishing', 'PRODUCTION', 'Production Manager', 5, 17),
    (19, 'INLINE_INSPECTION', 'Inline Inspection', 'QUALITY', 'QC Inspector', 3, 17),
    (20, 'PACKING', 'Packing', 'PACKING', 'Packing Supervisor', 3, 19),
    (21, 'FINAL_INSPECTION', 'Final Inspection (AQL)', 'QUALITY', 'QC Manager', 3, 18),
    (22, 'DISPATCH', 'Dispatch', 'LOGISTICS', 'Logistics Head', 2, 21),
    (23, 'CONTAINER_LOADING', 'Container Loading', 'LOGISTICS', 'Logistics Head', 2, 22),
    (24, 'SHIPMENT', 'Shipment / Handover to Port', 'LOGISTICS', 'Logistics Head', 2, None),
    (25, 'WAREHOUSING', 'Warehousing', 'WAREHOUSE', 'Warehouse Manager', 3, None),
    (26, 'DISTRIBUTION', 'Distribution', 'WAREHOUSE', 'Warehouse Manager', 3, None),
]

DEPARTMENTS = [
    ('DESIGN', 'Design'),
    ('DEVELOPMENT', 'Development'),
    ('SOURCING', 'Sourcing'),
    ('SAMPLING', 'Sampling'),
    ('COSTING', 'Costing'),
    ('QUALITY', 'Quality'),
    ('SALES', 'Sales'),
    ('MERCHANDISING', 'Merchandising'),
    ('PROCUREMENT', 'Procurement'),
    ('PRODUCTION', 'Production'),
    ('PACKING', 'Packing'),
    ('LOGISTICS', 'Logistics'),
    ('WAREHOUSE', 'Warehouse'),
]

# Category overrides (blueprint Section 2.2)
CATEGORY_OVERRIDES = {
    'footwear': {
        'rename': {'STITCHING': 'Lasting & Stitching'},
        'add_after': {
            'ASSEMBLY': {
                'stage_code': 'SOLE_ATTACHING',
                'stage_name': 'Sole Attaching',
                'department': 'PRODUCTION',
                'approver_role': 'Production Manager',
                'duration': 5,
            }
        },
    },
    'gloves': {
        'rename': {'STITCHING': 'Glove Stitching / Dipping'},
    },
    'accessories': {
        'skip_stages': ['PROTOTYPE_SAMPLE', 'FINAL_SAMPLE', 'TOOLING_PREP'],
    },
}


class Command(BaseCommand):
    help = 'Seed default departments, workflow templates, and 26-stage sequence for all organizations'

    def handle(self, *args, **options):
        orgs = Organization.objects.all()
        if not orgs.exists():
            self.stdout.write(self.style.WARNING('No organizations found. Skipping.'))
            return

        for org in orgs:
            self.stdout.write(f'\nOrganization: {org.name}')

            # Create departments
            dept_map = {}
            for code, name in DEPARTMENTS:
                dept, created = Department.objects.get_or_create(
                    organization=org, code=code,
                    defaults={'name': name}
                )
                dept_map[code] = dept
                if created:
                    self.stdout.write(f'  + Department: {name}')

            # Create default template (all categories)
            template, created = WorkflowTemplate.objects.get_or_create(
                organization=org, name='Default 26-Stage Workflow', is_default=True,
                defaults={'product_category': ''}
            )
            if created:
                self.stdout.write('  + Default template created')

                for seq, code, name, dept_code, approver, duration, fail_seq in DEFAULT_STAGES:
                    WorkflowTemplateStage.objects.create(
                        template=template,
                        stage_name=name,
                        stage_code=code,
                        sequence_number=seq,
                        department=dept_map.get(dept_code),
                        approver_role=approver,
                        typical_duration_days=duration,
                        on_fail_go_to_seq=fail_seq,
                    )

                self.stdout.write(f'  + {len(DEFAULT_STAGES)} stages seeded')
            else:
                self.stdout.write('  = Default template already exists')

            # Create category-specific templates
            for category, overrides in CATEGORY_OVERRIDES.items():
                cat_name = f'{category.title()} Workflow'
                cat_template, created = WorkflowTemplate.objects.get_or_create(
                    organization=org, name=cat_name,
                    defaults={'product_category': category, 'is_default': False}
                )
                if not created:
                    self.stdout.write(f'  = {cat_name} already exists')
                    continue

                self.stdout.write(f'  + {cat_name} template created')
                skip_stages = overrides.get('skip_stages', [])
                rename_map = overrides.get('rename', {})
                add_after = overrides.get('add_after', {})

                seq_offset = 0
                for seq, code, name, dept_code, approver, duration, fail_seq in DEFAULT_STAGES:
                    is_required = code not in skip_stages
                    stage_name = rename_map.get(code, name)
                    adjusted_seq = seq + seq_offset

                    WorkflowTemplateStage.objects.create(
                        template=cat_template,
                        stage_name=stage_name,
                        stage_code=code,
                        sequence_number=adjusted_seq,
                        department=dept_map.get(dept_code),
                        approver_role=approver,
                        typical_duration_days=duration,
                        on_fail_go_to_seq=fail_seq,
                        is_required=is_required,
                    )

                    # Add extra stages after specific stages
                    if code in add_after:
                        extra = add_after[code]
                        seq_offset += 1
                        WorkflowTemplateStage.objects.create(
                            template=cat_template,
                            stage_name=extra['stage_name'],
                            stage_code=extra['stage_code'],
                            sequence_number=adjusted_seq + 1,
                            department=dept_map.get(extra['department']),
                            approver_role=extra['approver_role'],
                            typical_duration_days=extra['duration'],
                            on_fail_go_to_seq=adjusted_seq,
                        )

                stage_count = cat_template.template_stages.count()
                self.stdout.write(f'  + {stage_count} stages seeded for {cat_name}')

        self.stdout.write(self.style.SUCCESS('\nDone! Workflow defaults seeded.'))
