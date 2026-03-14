from rest_framework.permissions import BasePermission


class IsFounder(BasePermission):
    """Only super_owner can access."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'super_owner'
        )


class IsFounderOrAgent(BasePermission):
    """super_owner or active sub_agent can access."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'super_owner':
            return True
        if request.user.role == 'sub_agent':
            from .founder_models import AgentAssignment
            return AgentAssignment.objects.filter(
                agent=request.user, is_active=True
            ).exists()
        return False


class AgentScopePermission(BasePermission):
    """For sub_agents, checks that the requested client_id is in their assignment."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == 'super_owner':
            return True
        if request.user.role != 'sub_agent':
            return False

        # Get the client_id from request (query param or body)
        client_id = (
            request.query_params.get('client_id')
            or request.data.get('client_id')
            or view.kwargs.get('client_id')
        )
        if not client_id:
            return True  # No specific client requested — filtering happens in view

        from .founder_models import AgentAssignment
        return AgentAssignment.objects.filter(
            agent=request.user,
            is_active=True,
            client_ids__contains=[str(client_id)],
        ).exists()
