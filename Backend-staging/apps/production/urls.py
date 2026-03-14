from django.urls import path
from . import views

urlpatterns = [
    path('orders/<uuid:order_id>/production/', views.order_production, name='order-production'),
    path('orders/<uuid:order_id>/production/plan/', views.update_production_plan, name='update-production-plan'),
    path('production/days/<uuid:day_id>/', views.update_production_day, name='update-production-day'),
]
