from django.urls import path
from . import views

urlpatterns = [
    path('', views.task_list_create, name='task-list-create'),
    path('stats/', views.task_stats, name='task-stats'),
    path('<uuid:task_id>/', views.task_detail, name='task-detail'),
    path('<uuid:task_id>/status/', views.task_status_update, name='task-status'),
    path('<uuid:task_id>/activities/', views.task_activities, name='task-activities'),
]
