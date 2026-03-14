from django.urls import path
from . import views

urlpatterns = [
    path('', views.document_list_upload, name='document-list-upload'),
    path('stats/', views.document_stats, name='document-stats'),
    path('<uuid:doc_id>/', views.document_detail, name='document-detail'),
    path('<uuid:doc_id>/download/', views.document_download, name='document-download'),
    path('<uuid:doc_id>/audit/', views.document_audit_log, name='document-audit'),
    # Phase 2: Share links
    path('<uuid:doc_id>/share/', views.document_share, name='document-share'),
    path('shares/<uuid:link_id>/revoke/', views.share_link_revoke, name='share-link-revoke'),
    # Phase 3: Bulk export
    path('bulk-export/', views.bulk_export, name='document-bulk-export'),
    # Phase 4: Contextual action logging
    path('log-action/', views.log_document_action, name='document-log-action'),
]
