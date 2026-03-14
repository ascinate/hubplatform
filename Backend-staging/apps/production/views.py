from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import timedelta

from .models import ProductionPlan, ProductionDay
from .serializers import ProductionPlanSerializer, ProductionDaySerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def order_production(request, order_id):
    if request.method == 'GET':
        try:
            plan = ProductionPlan.objects.get(
                order_id=order_id,
                order__organization=request.user.organization,
            )
            days = plan.days.all()
            return Response({
                'plan': ProductionPlanSerializer(plan).data,
                'days': ProductionDaySerializer(days, many=True).data,
            })
        except ProductionPlan.DoesNotExist:
            return Response({'plan': None, 'days': []})

    elif request.method == 'POST':
        data = request.data.copy()
        data['order'] = order_id
        serializer = ProductionPlanSerializer(data=data)
        if serializer.is_valid():
            plan = serializer.save(created_by=request.user)
            # Generate ProductionDay rows for each business day
            current = plan.start_date
            while current <= plan.end_date:
                if current.weekday() < 5:
                    ProductionDay.objects.create(plan=plan, date=current)
                current += timedelta(days=1)
            days = plan.days.all()
            return Response({
                'plan': ProductionPlanSerializer(plan).data,
                'days': ProductionDaySerializer(days, many=True).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_production_plan(request, order_id):
    try:
        plan = ProductionPlan.objects.get(
            order_id=order_id,
            order__organization=request.user.organization,
        )
    except ProductionPlan.DoesNotExist:
        return Response({'error': 'Plan not found'}, status=404)

    serializer = ProductionPlanSerializer(plan, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(ProductionPlanSerializer(plan).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_production_day(request, day_id):
    try:
        day = ProductionDay.objects.select_related('plan__order').get(
            id=day_id,
            plan__order__organization=request.user.organization,
        )
    except ProductionDay.DoesNotExist:
        return Response({'error': 'Day not found'}, status=404)

    serializer = ProductionDaySerializer(day, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(updated_by=request.user)
        return Response(ProductionDaySerializer(day).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
