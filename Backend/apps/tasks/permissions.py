from rest_framework.permissions import BasePermission


TASK_CREATOR_ROLES = ['admin', 'org_admin']


class CanCreateTask(BasePermission):
    """Only admin and org_admin can create/assign tasks."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in TASK_CREATOR_ROLES
        )


class IsTaskOwnerOrAdmin(BasePermission):
    """Task assignee can update status. Admin/org_admin can update anything."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in TASK_CREATOR_ROLES:
            return True
        return obj.assigned_to == request.user
