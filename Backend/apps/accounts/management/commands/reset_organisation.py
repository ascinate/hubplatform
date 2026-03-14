from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import Organization, User


class Command(BaseCommand):
    help = 'Reset (delete) an organisation and optionally a user for a fresh onboarding start'

    def add_arguments(self, parser):
        parser.add_argument('--org', required=True, help='Organization slug to delete')
        parser.add_argument('--email', help='Specific user email to also delete')
        parser.add_argument('--confirm', action='store_true', help='Actually perform deletion (omit for dry-run)')

    def handle(self, *args, **options):
        org_slug = options['org']
        user_email = options.get('email')
        confirm = options['confirm']

        # --- Fetch org ---
        try:
            org = Organization.objects.get(slug=org_slug)
        except Organization.DoesNotExist:
            raise CommandError(f'Organization with slug "{org_slug}" not found.')

        # --- Fetch user ---
        user = None
        if user_email:
            try:
                user = User.objects.get(email=user_email)
            except User.DoesNotExist:
                raise CommandError(f'User with email "{user_email}" not found.')

        # --- Count related data ---
        from apps.core.models import Factory, ProductionOrder, Inspection, LabTest, ChatMessage
        from apps.workflow.models import WorkflowTemplate
        from apps.tasks.models import Task
        from apps.collaboration.models import CollaborationRoom

        factories_count = Factory.objects.filter(organization=org).count()
        orders_count = ProductionOrder.objects.filter(organization=org).count()
        inspections_count = Inspection.objects.filter(organization=org).count()
        labtests_count = LabTest.objects.filter(organization=org).count()
        workflows_count = WorkflowTemplate.objects.filter(organization=org).count()
        tasks_count = Task.objects.filter(organization=org).count()
        rooms_count = CollaborationRoom.objects.filter(organization=org).count()
        org_users_count = User.objects.filter(organization=org).count()

        # --- Print summary ---
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('=' * 55))
        self.stdout.write(self.style.WARNING('  ORGANISATION RESET SUMMARY'))
        self.stdout.write(self.style.WARNING('=' * 55))
        self.stdout.write(f'  Organization : {org.name} (slug: {org.slug})')
        self.stdout.write(f'  Plan         : {org.plan}')
        self.stdout.write(f'  Trial end    : {org.trial_end}')
        self.stdout.write(f'  Members      : {org_users_count}')
        self.stdout.write('')
        self.stdout.write('  Data to be deleted (CASCADE):')
        self.stdout.write(f'    Factories          : {factories_count}')
        self.stdout.write(f'    Production Orders  : {orders_count}')
        self.stdout.write(f'    Inspections        : {inspections_count}')
        self.stdout.write(f'    Lab Tests          : {labtests_count}')
        self.stdout.write(f'    Workflow Templates : {workflows_count}')
        self.stdout.write(f'    Tasks              : {tasks_count}')
        self.stdout.write(f'    Collaboration Rooms: {rooms_count}')

        if user:
            self.stdout.write('')
            self.stdout.write(f'  User to delete : {user.full_name} ({user.email})')
            self.stdout.write(f'  User role      : {user.role}')

        self.stdout.write(self.style.WARNING('=' * 55))
        self.stdout.write('')

        if not confirm:
            self.stdout.write(self.style.SUCCESS('DRY RUN — no data was deleted.'))
            self.stdout.write('Pass --confirm to execute the deletion.')
            self.stdout.write('')
            return

        # --- Execute deletion ---
        self.stdout.write(self.style.ERROR('Deleting... this is irreversible.'))

        with transaction.atomic():
            org_name = org.name

            # Delete organisation — Django CASCADE handles all related data
            org.delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted organisation: {org_name}'))

            # Delete user if specified
            if user:
                user_name = user.full_name
                user_email_str = user.email
                user.delete()
                self.stdout.write(self.style.SUCCESS(f'Deleted user: {user_name} ({user_email_str})'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Reset complete! Fresh start is ready.'))
        if user:
            self.stdout.write(f'"{user_email}" can now re-register at https://sankalphub.in/')
        self.stdout.write('')
