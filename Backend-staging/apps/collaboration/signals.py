from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.core.models import ProductionOrder, Factory
from .models import CollaborationRoom


@receiver(post_save, sender=ProductionOrder)
def create_po_room(sender, instance, created, **kwargs):
    if created and instance.organization:
        CollaborationRoom.objects.get_or_create(
            organization=instance.organization,
            room_type='po',
            production_order=instance,
            defaults={
                'name': f"PO {instance.po_number or str(instance.id)[:8]}",
                'created_by': None,
            }
        )


@receiver(post_save, sender=Factory)
def create_factory_room(sender, instance, created, **kwargs):
    if created and instance.organization:
        CollaborationRoom.objects.get_or_create(
            organization=instance.organization,
            room_type='factory',
            factory=instance,
            defaults={
                'name': f"Factory: {instance.name}",
                'created_by': None,
            }
        )
