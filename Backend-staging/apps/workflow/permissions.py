from rest_framework.permissions import BasePermission


class CanStartStage(BasePermission):
    message = 'You do not have permission to start this stage.'

    def has_object_permission(self, request, view, stage):
        user = request.user
        if user.role in ('admin', 'org_admin'):
            return True
        if stage.department and user.department_id == stage.department_id:
            return True
        return False


class CanSubmitStage(BasePermission):
    message = 'Only the assigned user can submit this stage.'

    def has_object_permission(self, request, view, stage):
        user = request.user
        if user.role in ('admin', 'org_admin'):
            return True
        if stage.assigned_to_id == user.id:
            return True
        if stage.department and user.department_id == stage.department_id:
            return True
        return False


class CanApproveStage(BasePermission):
    message = 'You do not have permission to approve/reject this stage.'

    def has_object_permission(self, request, view, stage):
        user = request.user
        if user.role in ('admin', 'org_admin'):
            return True
        if stage.approver_id == user.id:
            return True
        # Department head can also approve
        if stage.department and stage.department.head_user_id == user.id:
            return True
        return False


class CanCommentOnStage(BasePermission):
    message = 'You do not have permission to comment on this stage.'

    def has_object_permission(self, request, view, stage):
        user = request.user
        if user.role in ('admin', 'org_admin'):
            return True
        if stage.department and user.department_id == stage.department_id:
            return True
        # Order collaborators can comment
        if stage.order.collaborators.filter(user=user).exists():
            return True
        return False
