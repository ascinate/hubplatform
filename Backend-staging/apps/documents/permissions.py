def can_upload(user):
    """All authenticated users can upload."""
    return user.is_authenticated


def can_view_document(user, document):
    """Check if user can view/list this document."""
    if user.organization_id != document.organization_id:
        return False

    role = user.role

    # Admin/org_admin see everything in their org
    if role in ('admin', 'org_admin'):
        return True

    # Regular users see all org documents
    if role == 'user':
        return True

    # Brand users see brand/shared visibility docs
    if role == 'brand':
        return document.visibility in ('brand', 'shared')

    # Factory users see docs linked to their factory
    if role == 'factory':
        if document.factory_id and hasattr(user, 'factory') and user.factory:
            return str(document.factory_id) == str(user.factory_id)
        return document.uploaded_by_id == user.id

    # Third party: only their own uploads
    if role == 'third_party':
        return document.uploaded_by_id == user.id

    return False


def can_download_document(user, document):
    """Check if user can download this document."""
    if not can_view_document(user, document):
        return False

    role = user.role

    # Third party cannot download, only upload
    if role == 'third_party':
        return False

    return True


def can_delete_document(user, document):
    """Check if user can delete this document."""
    if user.organization_id != document.organization_id:
        return False

    role = user.role

    # Admin/org_admin can delete anything
    if role in ('admin', 'org_admin'):
        return True

    # Others can only delete their own uploads
    return document.uploaded_by_id == user.id


def get_document_queryset(user, base_qs):
    """Filter documents queryset based on user role."""
    qs = base_qs.filter(organization=user.organization, is_deleted=False)

    role = user.role

    if role in ('admin', 'org_admin', 'user'):
        return qs

    if role == 'brand':
        return qs.filter(visibility__in=['brand', 'shared'])

    if role == 'factory':
        if hasattr(user, 'factory') and user.factory:
            return qs.filter(factory=user.factory) | qs.filter(uploaded_by=user)
        return qs.filter(uploaded_by=user)

    if role == 'third_party':
        return qs.filter(uploaded_by=user)

    return qs.none()
