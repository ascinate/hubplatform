from django.urls import path
from . import views

urlpatterns = [
    path('comments/', views.comments_view, name='comments'),
    path('history/', views.history_view, name='history'),
    path('documents/', views.documents_view, name='documents'),
    path('notifications/', views.notifications_list, name='notifications'),
    path('notifications/unread-count/', views.notifications_unread_count, name='notifications-unread'),
    path('notifications/read-all/', views.notification_mark_all_read, name='notifications-read-all'),
    path('notifications/<uuid:notification_id>/', views.notification_mark_read, name='notification-read'),
]
