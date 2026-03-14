from django.urls import path
from . import founder_views

urlpatterns = [
    path('dashboard/', founder_views.founder_dashboard, name='founder-dashboard'),
    path('clients/', founder_views.client_list, name='founder-clients'),
    path('users/', founder_views.user_list, name='founder-users'),
    path('impersonate/<uuid:user_id>/', founder_views.impersonate_start, name='founder-impersonate-start'),
    path('impersonate/end/', founder_views.impersonate_end, name='founder-impersonate-end'),
    path('suspend/<uuid:user_id>/', founder_views.suspend_user, name='founder-suspend-user'),
    path('agents/', founder_views.agent_list_create, name='founder-agents'),
    path('agents/<uuid:assignment_id>/revoke/', founder_views.agent_revoke, name='founder-agent-revoke'),
    path('audit/', founder_views.audit_log, name='founder-audit'),
]
