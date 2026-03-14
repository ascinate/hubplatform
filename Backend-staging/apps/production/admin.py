from django.contrib import admin
from .models import ProductionPlan, ProductionDay


class ProductionDayInline(admin.TabularInline):
    model = ProductionDay
    extra = 0


@admin.register(ProductionPlan)
class ProductionPlanAdmin(admin.ModelAdmin):
    list_display = ['order', 'start_date', 'end_date', 'planned_lines', 'daily_pieces_per_line']
    inlines = [ProductionDayInline]


@admin.register(ProductionDay)
class ProductionDayAdmin(admin.ModelAdmin):
    list_display = ['plan', 'date', 'actual_lines', 'actual_pieces_per_line', 'packed_pieces']
    list_filter = ['date']
