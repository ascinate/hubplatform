from django.db import models
from django.conf import settings
from datetime import timedelta
import uuid


class ProductionPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(
        'core.ProductionOrder', on_delete=models.CASCADE, related_name='production_plan'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    planned_lines = models.IntegerField()
    daily_pieces_per_line = models.IntegerField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def production_days(self):
        count = 0
        current = self.start_date
        while current <= self.end_date:
            if current.weekday() < 5:
                count += 1
            current += timedelta(days=1)
        return count

    @property
    def total_planned(self):
        return self.planned_lines * self.daily_pieces_per_line * self.production_days

    def __str__(self):
        return f"Plan for {self.order.po_number}"

    class Meta:
        ordering = ['-created_at']


class ProductionDay(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(ProductionPlan, on_delete=models.CASCADE, related_name='days')
    date = models.DateField()
    actual_lines = models.IntegerField(null=True, blank=True)
    actual_pieces_per_line = models.IntegerField(null=True, blank=True)
    packed_pieces = models.IntegerField(null=True, blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def actual_pieces(self):
        if self.actual_lines and self.actual_pieces_per_line:
            return self.actual_lines * self.actual_pieces_per_line
        return None

    def __str__(self):
        return f"{self.plan.order.po_number} — {self.date}"

    class Meta:
        ordering = ['date']
        unique_together = [['plan', 'date']]
