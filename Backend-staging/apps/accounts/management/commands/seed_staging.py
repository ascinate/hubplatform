"""
Management command to seed the staging database with demo data.
Run: python manage.py seed_staging
"""
import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Seed staging database with demo users, orders, inspections, and defects'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding staging database...')
        self._create_org_and_users()
        self._create_factories()
        self._create_orders()
        self._create_inspections()
        self.stdout.write(self.style.SUCCESS('\n✅ Staging seed complete!'))
        self._print_summary()

    def _create_org_and_users(self):
        from apps.accounts.models import Organization, User
        from apps.billing.models import SubscriptionPlan, Subscription

        self.stdout.write('  Creating organization...')
        org, _ = Organization.objects.get_or_create(
            slug='sankalphub-demo',
            defaults={
                'name': 'SankalpHub Demo',
                'is_active': True,
                'max_users': 50,
            }
        )
        self.org = org

        # Ensure enterprise plan exists
        plan, _ = SubscriptionPlan.objects.get_or_create(
            slug='enterprise',
            defaults={
                'name': 'Enterprise',
                'price_inr': 9999,
                'price_usd': 99,
                'interval': 'monthly',
                'max_users': 50,
                'is_active': True,
            }
        )

        # Subscription
        Subscription.objects.get_or_create(
            organization=org,
            defaults={
                'plan': plan,
                'status': 'active',
                'gateway': 'manual',
                'current_period_start': timezone.now(),
                'current_period_end': timezone.now() + timedelta(days=365),
            }
        )

        self.stdout.write('  Creating users...')
        PASSWORD = 'Staging@123'
        users_data = [
            ('admin@staging.sankalphub.in',  'Staging Admin',        'org_admin', True,  True),
            ('brand@staging.sankalphub.in',   'Priya Sharma',         'brand',     False, False),
            ('brand2@staging.sankalphub.in',  'Rahul Mehta',          'brand',     False, False),
            ('brand3@staging.sankalphub.in',  'Sneha Patel',          'brand',     False, False),
            ('factory@staging.sankalphub.in', 'Ravi Kumar',           'factory',   False, False),
            ('factory2@staging.sankalphub.in','Anjali Singh',         'factory',   False, False),
            ('qc@staging.sankalphub.in',      'Vikram QC',            'third_party',False,False),
        ]
        self.users = {}
        for email, full_name, role, is_staff, is_superuser in users_data:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'full_name': full_name,
                    'role': role,
                    'organization': org,
                    'is_active': True,
                    'is_staff': is_staff,
                    'is_superuser': is_superuser,
                    'email_verified': True,
                }
            )
            if created:
                user.set_password(PASSWORD)
                user.save()
            self.users[role] = self.users.get(role) or user
            self.stdout.write(f'    {"Created" if created else "Exists"}: {email} ({role})')

        self.admin_user = User.objects.get(email='admin@staging.sankalphub.in')

    def _create_factories(self):
        from apps.core.models import Factory  # noqa

        self.stdout.write('  Creating factories...')
        factories_data = [
            {
                'name': 'Sunrise Manufacturing',
                'location': 'Tirupur Industrial Zone',
                'city': 'Tirupur',
                'country': 'India',
                'certifications': 'ISO 9001, GOTS, OEKO-TEX',
                'audit_compliance': 'compliant',
                'last_audit_date': date.today() - timedelta(days=90),
                'production_capacity': 50000,
                'total_manpower': 320,
                'contact_person': 'Suresh Rajan',
                'contact_email': 'suresh@sunrise-mfg.com',
                'contact_phone': '+91 98765 43210',
            },
            {
                'name': 'Royal Garments Ltd',
                'location': 'Sector 63, NOIDA',
                'city': 'Noida',
                'country': 'India',
                'certifications': 'ISO 9001, SA8000',
                'audit_compliance': 'compliant',
                'last_audit_date': date.today() - timedelta(days=45),
                'production_capacity': 35000,
                'total_manpower': 240,
                'contact_person': 'Deepak Verma',
                'contact_email': 'deepak@royalgarments.in',
                'contact_phone': '+91 98112 67890',
            },
        ]
        self.factories = []
        for data in factories_data:
            factory, created = Factory.objects.get_or_create(
                organization=self.org,
                name=data['name'],
                defaults={**data, 'is_active': True}
            )
            self.factories.append(factory)
            self.stdout.write(f'    {"Created" if created else "Exists"}: {factory.name}')

    def _create_orders(self):
        from apps.core.models import ProductionOrder  # noqa

        self.stdout.write('  Creating production orders...')
        today = date.today()
        orders_data = [
            ('PO-STG-001', "Men's Polo T-Shirt",    'garments',    'in_progress', 'men',   5000,  2100, 42, today + timedelta(days=30),  0),
            ('PO-STG-002', "Women's Hoodie",         'garments',    'on_track',    'women', 3000,  1800, 60, today + timedelta(days=45),  1),
            ('PO-STG-003', 'Leather Work Gloves',    'gloves',      'completed',   'unisex',8000,  8000,100, today - timedelta(days=10),  0),
            ('PO-STG-004', 'Canvas Sneakers',        'footwear',    'warning',     'unisex',4500,  1500, 33, today + timedelta(days=15),  1),
            ('PO-STG-005', 'Ankle Boots',            'footwear',    'pending',     'women', 2000,     0,  0, today + timedelta(days=60),  0),
            ('PO-STG-006', 'Baseball Caps',          'headwear',    'in_progress', 'unisex',6000,  3200, 53, today + timedelta(days=25),  1),
            ('PO-STG-007', 'Leather Belts',          'accessories', 'on_hold',     'men',   3500,   700, 20, today + timedelta(days=50),  0),
            ('PO-STG-008', 'Woven Scarves',          'accessories', 'on_track',    'women', 2500,  1750, 70, today + timedelta(days=20),  1),
            ('PO-STG-009', 'Canvas Tote Bags',       'bags',        'urgent',      'unisex',7000,  1400, 20, today + timedelta(days=7),   0),
            ('PO-STG-010', 'Nylon Backpacks',        'bags',        'in_progress', 'unisex',4000,  1600, 40, today + timedelta(days=35),  1),
        ]
        self.orders = []
        for po_num, name, category, status, gender, qty, completed, progress, due, factory_idx in orders_data:
            order, created = ProductionOrder.objects.get_or_create(
                organization=self.org,
                po_number=po_num,
                defaults={
                    'product_name': name,
                    'product_category': category,
                    'status': status,
                    'gender': gender,
                    'quantity': qty,
                    'completed_quantity': completed,
                    'progress_percent': progress,
                    'due_date': due,
                    'factory': self.factories[factory_idx],
                    'created_by': self.admin_user,
                    'country': 'India',
                    'color': random.choice(['Navy Blue', 'Black', 'White', 'Olive Green', 'Burgundy', 'Khaki']),
                }
            )
            self.orders.append(order)
            self.stdout.write(f'    {"Created" if created else "Exists"}: {po_num} - {name}')

    def _create_inspections(self):
        from apps.core.models import Inspection, InspectionDefect  # noqa

        self.stdout.write('  Creating inspections...')
        today = date.today()
        inspections_data = [
            # (order_idx, type, status, result, qty, defects, defect_rate, date_offset)
            (0, 'pre_production', 'submitted',   'pass',             1000,  3, '0.30', -15),
            (0, 'inline',        'in_progress',  'pending',          2000,  0, '0.00',  -3),
            (2, 'final',         'submitted',    'pass',             8000, 12, '0.15', -12),
            (3, 'final',         'submitted',    'fail',             1500, 47, '3.13',  -5),
            (5, 'inline',        'draft',        'pending',          3200,  0, '0.00',  -1),
            (8, 'pre_production','submitted',    'conditional_pass',  700, 18, '2.57',  -8),
        ]
        self.inspections = []
        insp_counter = 1
        for order_idx, insp_type, status, result, qty, defects, defect_rate, date_offset in inspections_data:
            order = self.orders[order_idx]
            insp_no = f'INSP-STG-{insp_counter:03d}'
            insp_counter += 1
            insp, created = Inspection.objects.get_or_create(
                organization=self.org,
                inspection_no=insp_no,
                defaults={
                    'production_order': order,
                    'factory': order.factory,
                    'inspection_type': insp_type,
                    'aql_level': '2.5',
                    'status': status,
                    'result': result,
                    'overall_result': result if status == 'submitted' else None,
                    'auditor_name': 'Vikram QC' if insp_type == 'final' else 'Ravi Kumar',
                    'inspection_date': today + timedelta(days=date_offset),
                    'quantity_inspected': qty,
                    'defects_found': defects,
                    'defect_rate': defect_rate,
                    'created_by': self.admin_user,
                    'submitted_at': timezone.now() + timedelta(days=date_offset) if status == 'submitted' else None,
                }
            )
            self.inspections.append(insp)
            self.stdout.write(f'    {"Created" if created else "Exists"}: {insp_no} ({order.po_number} {insp_type} → {result})')

        # Defects for INSP-STG-004 (PO-004 final, fail)
        self.stdout.write('  Creating defects...')
        fail_insp = self.inspections[3]
        defects_fail = [
            ('Stitching', 'Seam Strength',  'D-001', 'Loose Stitching',   'major',    12),
            ('Sole Unit', 'Sole Bonding',   'D-002', 'Sole Delamination', 'critical',  8),
            ('Upper',     'Color Fastness', 'D-003', 'Color Bleeding',    'minor',    27),
        ]
        for section, item, code, name, severity, qty in defects_fail:
            InspectionDefect.objects.get_or_create(
                inspection=fail_insp,
                defect_code=code,
                defaults={'section_name': section, 'item_name': item, 'defect_name': name, 'severity': severity, 'quantity': qty}
            )

        # Defects for INSP-STG-006 (PO-009 pre-prod, conditional_pass)
        cond_insp = self.inspections[5]
        defects_cond = [
            ('Handle', 'Handle Attachment', 'D-004', 'Handle Stitching Gap', 'minor',  11),
            ('Fabric',  'Surface Quality',  'D-005', 'Fabric Pilling',       'major',   7),
        ]
        for section, item, code, name, severity, qty in defects_cond:
            InspectionDefect.objects.get_or_create(
                inspection=cond_insp,
                defect_code=code,
                defaults={'section_name': section, 'item_name': item, 'defect_name': name, 'severity': severity, 'quantity': qty}
            )
        self.stdout.write('    Created defects for failed and conditional inspections')

    def _print_summary(self):
        self.stdout.write('\n' + '='*55)
        self.stdout.write('  STAGING TEST CREDENTIALS (password: Staging@123)')
        self.stdout.write('='*55)
        creds = [
            ('Admin',    'admin@staging.sankalphub.in'),
            ('Brand',    'brand@staging.sankalphub.in'),
            ('Brand 2',  'brand2@staging.sankalphub.in'),
            ('Brand 3',  'brand3@staging.sankalphub.in'),
            ('Factory',  'factory@staging.sankalphub.in'),
            ('Factory 2','factory2@staging.sankalphub.in'),
            ('QC',       'qc@staging.sankalphub.in'),
        ]
        for role, email in creds:
            self.stdout.write(f'  {role:<12} {email}')
        self.stdout.write('='*55)
        self.stdout.write('  URL: https://staging.sankalphub.in/login')
        self.stdout.write('  Admin: https://staging-api.sankalphub.in/admin/')
        self.stdout.write('='*55)
