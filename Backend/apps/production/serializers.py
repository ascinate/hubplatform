from rest_framework import serializers
from .models import ProductionPlan, ProductionDay


class ProductionPlanSerializer(serializers.ModelSerializer):
    production_days = serializers.IntegerField(read_only=True)
    total_planned = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProductionPlan
        fields = [
            'id', 'order', 'start_date', 'end_date', 'planned_lines',
            'daily_pieces_per_line', 'production_days', 'total_planned',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ProductionDaySerializer(serializers.ModelSerializer):
    actual_pieces = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProductionDay
        fields = [
            'id', 'plan', 'date', 'actual_lines', 'actual_pieces_per_line',
            'actual_pieces', 'packed_pieces', 'updated_by', 'updated_at',
        ]
        read_only_fields = ['id', 'plan', 'date', 'updated_by', 'updated_at']
