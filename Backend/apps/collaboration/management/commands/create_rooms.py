from django.core.management.base import BaseCommand
from apps.core.models import ProductionOrder, Factory
from apps.collaboration.models import CollaborationRoom


class Command(BaseCommand):
    help = 'Create collaboration rooms for existing POs and Factories'

    def handle(self, *args, **options):
        po_created = 0
        for po in ProductionOrder.objects.select_related('organization').all():
            if not po.organization:
                continue
            _, created = CollaborationRoom.objects.get_or_create(
                organization=po.organization,
                room_type='po',
                production_order=po,
                defaults={
                    'name': f"PO {po.po_number or str(po.id)[:8]}",
                }
            )
            if created:
                po_created += 1

        factory_created = 0
        for factory in Factory.objects.select_related('organization').all():
            if not factory.organization:
                continue
            _, created = CollaborationRoom.objects.get_or_create(
                organization=factory.organization,
                room_type='factory',
                factory=factory,
                defaults={
                    'name': f"Factory: {factory.name}",
                }
            )
            if created:
                factory_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Created {po_created} PO rooms and {factory_created} Factory rooms'
        ))
