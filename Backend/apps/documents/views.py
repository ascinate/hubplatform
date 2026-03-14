import os
from django.http import FileResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import ManagedDocument, DocumentAccessLog, ShareLink
from .serializers import (
    ManagedDocumentSerializer,
    DocumentUploadSerializer,
    DocumentAccessLogSerializer,
    ShareLinkSerializer,
    CreateShareLinkSerializer,
    PublicShareDocumentSerializer,
)
from .validators import validate_file_extension, validate_file_size, get_mime_type
from .permissions import (
    can_view_document, can_download_document, can_delete_document,
    get_document_queryset,
)
from .share_service import create_share_link, validate_share_link, record_share_access, send_share_email
from .watermark import apply_watermark
from .storage import is_r2_configured, upload_to_r2, generate_storage_key, get_presigned_url, download_from_r2


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_access(document, user, action, request):
    DocumentAccessLog.objects.create(
        document=document,
        user=user,
        action=action,
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
    )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def document_list_upload(request):
    if request.method == 'GET':
        qs = get_document_queryset(request.user, ManagedDocument.objects.all())

        # Filters
        order_id = request.query_params.get('order')
        factory_id = request.query_params.get('factory')
        department = request.query_params.get('department')
        doc_category = request.query_params.get('doc_category')
        search = request.query_params.get('search')
        visibility = request.query_params.get('visibility')

        if order_id:
            qs = qs.filter(order_id=order_id)
        if factory_id:
            qs = qs.filter(factory_id=factory_id)
        if department:
            qs = qs.filter(department=department)
        if doc_category:
            qs = qs.filter(doc_category=doc_category)
        if visibility:
            qs = qs.filter(visibility=visibility)
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        qs = qs.select_related('uploaded_by', 'order', 'factory')
        serializer = ManagedDocumentSerializer(qs, many=True)
        return Response(serializer.data)

    # POST — upload
    upload_ser = DocumentUploadSerializer(data=request.data)
    if not upload_ser.is_valid():
        return Response(upload_ser.errors, status=status.HTTP_400_BAD_REQUEST)

    file = upload_ser.validated_data['file']

    # Validate
    try:
        ext = validate_file_extension(file)
        validate_file_size(file)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    mime = get_mime_type(file)
    name = upload_ser.validated_data.get('name') or os.path.splitext(file.name)[0]

    # Resolve FKs
    from apps.core.models import ProductionOrder, Factory
    order = None
    factory = None
    order_id = upload_ser.validated_data.get('order')
    factory_id = upload_ser.validated_data.get('factory')

    if order_id:
        order = ProductionOrder.objects.filter(
            id=order_id, organization=request.user.organization
        ).first()
    if factory_id:
        factory = Factory.objects.filter(
            id=factory_id, organization=request.user.organization
        ).first()

    # Generate R2 storage key if R2 is configured
    storage_key = ''
    if is_r2_configured():
        storage_key = generate_storage_key(
            str(request.user.organization_id), ext, file.name
        )

    doc = ManagedDocument.objects.create(
        organization=request.user.organization,
        name=name,
        file=file,
        file_type=ext,
        file_size=file.size,
        mime_type=mime,
        storage_key=storage_key,
        order=order,
        factory=factory,
        department=upload_ser.validated_data.get('department', ''),
        doc_category=upload_ser.validated_data.get('doc_category', 'other'),
        visibility=upload_ser.validated_data.get('visibility', 'team'),
        description=upload_ser.validated_data.get('description', ''),
        uploaded_by=request.user,
    )

    # Upload to R2 in addition to local storage
    if storage_key:
        upload_to_r2(file, storage_key, mime)

    log_access(doc, request.user, 'upload', request)

    return Response(
        ManagedDocumentSerializer(doc).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def document_detail(request, doc_id):
    try:
        doc = ManagedDocument.objects.select_related(
            'uploaded_by', 'order', 'factory'
        ).get(id=doc_id)
    except ManagedDocument.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        if not can_view_document(request.user, doc):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        return Response(ManagedDocumentSerializer(doc).data)

    # DELETE — soft delete
    if not can_delete_document(request.user, doc):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    doc.is_deleted = True
    doc.deleted_at = timezone.now()
    doc.deleted_by = request.user
    doc.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])

    log_access(doc, request.user, 'delete', request)

    return Response({'status': 'deleted'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def document_download(request, doc_id):
    try:
        doc = ManagedDocument.objects.get(id=doc_id, is_deleted=False)
    except ManagedDocument.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if not can_download_document(request.user, doc):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    log_access(doc, request.user, 'download', request)

    # Try R2 pre-signed URL first
    if doc.storage_key and is_r2_configured():
        presigned = get_presigned_url(
            doc.storage_key,
            expires_seconds=900,
            filename=f'{doc.name}.{doc.file_type}',
        )
        if presigned:
            from django.http import HttpResponseRedirect
            return HttpResponseRedirect(presigned)

    # Fallback to local file
    file_path = doc.file.path
    if not os.path.exists(file_path):
        return Response({'error': 'File not found on server'}, status=status.HTTP_404_NOT_FOUND)

    response = FileResponse(
        open(file_path, 'rb'),
        content_type=doc.mime_type or 'application/octet-stream',
    )
    response['Content-Disposition'] = f'attachment; filename="{doc.name}.{doc.file_type}"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def document_audit_log(request, doc_id):
    if request.user.role not in ('admin', 'org_admin', 'brand', 'super_owner'):
        return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)

    try:
        doc = ManagedDocument.objects.get(
            id=doc_id, organization=request.user.organization
        )
    except ManagedDocument.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    logs = doc.access_logs.select_related('user').all()[:100]
    return Response(DocumentAccessLogSerializer(logs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def document_stats(request):
    qs = get_document_queryset(request.user, ManagedDocument.objects.all())

    totals = qs.aggregate(
        total_count=Count('id'),
        total_size=Sum('file_size'),
    )

    by_department = list(
        qs.exclude(department='').values('department')
        .annotate(count=Count('id'), size=Sum('file_size'))
        .order_by('-count')
    )

    by_category = list(
        qs.values('doc_category')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    by_file_type = list(
        qs.values('file_type')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )

    return Response({
        'total_count': totals['total_count'] or 0,
        'total_size': totals['total_size'] or 0,
        'by_department': by_department,
        'by_category': by_category,
        'by_file_type': by_file_type,
    })


# ──────────────────────────────────────────────────────
# Phase 2: Share Links
# ──────────────────────────────────────────────────────

@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def document_share(request, doc_id):
    """POST: Create share link. GET: List share links for a document."""
    try:
        doc = ManagedDocument.objects.get(id=doc_id, is_deleted=False)
    except ManagedDocument.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if not can_view_document(request.user, doc):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        # Only admin/org_admin or the uploader can see share links
        if request.user.role not in ('admin', 'org_admin') and doc.uploaded_by_id != request.user.id:
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        links = doc.share_links.select_related('created_by').all()
        return Response(ShareLinkSerializer(links, many=True).data)

    # POST — create share link
    ser = CreateShareLinkSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    data = ser.validated_data
    link = create_share_link(
        document=doc,
        user=request.user,
        expires_hours=data['expires_hours'],
        recipient_email=data.get('recipient_email', ''),
        recipient_name=data.get('recipient_name', ''),
        max_access=data['max_access'],
        requires_watermark=data.get('requires_watermark', False),
    )

    # Send email if requested and recipient provided
    if data.get('send_email') and link.recipient_email:
        send_share_email(link, sender_name=request.user.full_name)

    return Response(ShareLinkSerializer(link).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def share_link_revoke(request, link_id):
    """Revoke a share link."""
    try:
        link = ShareLink.objects.select_related('document').get(id=link_id)
    except ShareLink.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    # Only creator or admin can revoke
    if link.created_by_id != request.user.id and request.user.role not in ('admin', 'org_admin'):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    link.is_revoked = True
    link.save(update_fields=['is_revoked'])

    return Response(ShareLinkSerializer(link).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_share_view(request, token):
    """Public endpoint to view shared document info (no auth required)."""
    link, error = validate_share_link(token)

    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    doc = link.document
    data = {
        'document': PublicShareDocumentSerializer(doc).data,
        'shared_by': link.created_by.full_name,
        'recipient_name': link.recipient_name,
        'expires_at': link.expires_at.isoformat(),
        'access_count': link.access_count,
        'max_access': link.max_access,
        'requires_watermark': link.requires_watermark,
    }

    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_share_download(request, token):
    """Public endpoint to download shared document (no auth required)."""
    link, error = validate_share_link(token)

    if error:
        return Response({'error': error}, status=status.HTTP_404_NOT_FOUND)

    doc = link.document

    # Record the access
    record_share_access(link, request)

    # For non-watermarked R2 files, redirect to pre-signed URL
    if not link.requires_watermark and doc.storage_key and is_r2_configured():
        presigned = get_presigned_url(
            doc.storage_key,
            expires_seconds=900,
            filename=f'{doc.name}.{doc.file_type}',
        )
        if presigned:
            from django.http import HttpResponseRedirect
            return HttpResponseRedirect(presigned)

    # Need local file for watermarking or local-only storage
    file_path = doc.file.path
    if not os.path.exists(file_path):
        # Try downloading from R2 to temp file
        if doc.storage_key and is_r2_configured():
            import tempfile
            r2_data = download_from_r2(doc.storage_key)
            if r2_data:
                fd, file_path = tempfile.mkstemp(suffix=f'.{doc.file_type}')
                with os.fdopen(fd, 'wb') as f:
                    f.write(r2_data)
            else:
                return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({'error': 'File not found on server'}, status=status.HTTP_404_NOT_FOUND)

    # Apply watermark if required
    serve_path = file_path
    is_watermarked = False
    if link.requires_watermark:
        try:
            serve_path, is_watermarked = apply_watermark(
                file_path, doc.file_type,
                recipient_name=link.recipient_name,
                recipient_email=link.recipient_email,
            )
        except Exception:
            serve_path = file_path

    response = FileResponse(
        open(serve_path, 'rb'),
        content_type=doc.mime_type or 'application/octet-stream',
    )
    response['Content-Disposition'] = f'attachment; filename="{doc.name}.{doc.file_type}"'

    # Clean up temp watermarked file after response is sent
    if is_watermarked and serve_path != file_path:
        import atexit
        atexit.register(lambda p=serve_path: os.unlink(p) if os.path.exists(p) else None)

    return response


# ──────────────────────────────────────────────────────
# Phase 3: Bulk Export
# ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_export(request):
    """
    Export selected documents as a ZIP file.
    Body: { "document_ids": ["uuid1", "uuid2", ...] }
    """
    import zipfile
    import tempfile

    doc_ids = request.data.get('document_ids', [])
    if not doc_ids:
        return Response({'error': 'No documents selected'}, status=status.HTTP_400_BAD_REQUEST)

    if len(doc_ids) > 50:
        return Response({'error': 'Maximum 50 documents per export'}, status=status.HTTP_400_BAD_REQUEST)

    # Get documents the user can access
    qs = get_document_queryset(request.user, ManagedDocument.objects.all())
    docs = list(qs.filter(id__in=doc_ids))

    if not docs:
        return Response({'error': 'No accessible documents found'}, status=status.HTTP_404_NOT_FOUND)

    # Create ZIP in temp file
    fd, zip_path = tempfile.mkstemp(suffix='.zip')
    try:
        with os.fdopen(fd, 'wb') as tmp_file:
            with zipfile.ZipFile(tmp_file, 'w', zipfile.ZIP_DEFLATED) as zf:
                seen_names = {}
                for doc in docs:
                    file_data = None
                    file_name = f'{doc.name}.{doc.file_type}'

                    # Deduplicate filenames
                    if file_name in seen_names:
                        seen_names[file_name] += 1
                        base, ext = os.path.splitext(file_name)
                        file_name = f'{base} ({seen_names[file_name]}){ext}'
                    else:
                        seen_names[file_name] = 0

                    # Try local file first
                    try:
                        local_path = doc.file.path
                        if os.path.exists(local_path):
                            zf.write(local_path, file_name)
                            continue
                    except ValueError:
                        pass

                    # Try R2
                    if doc.storage_key and is_r2_configured():
                        file_data = download_from_r2(doc.storage_key)
                        if file_data:
                            zf.writestr(file_name, file_data)
                            continue

                    # Skip if file not available

        # Log the export
        for doc in docs:
            log_access(doc, request.user, 'download', request)

        response = FileResponse(
            open(zip_path, 'rb'),
            content_type='application/zip',
        )
        response['Content-Disposition'] = f'attachment; filename="documents-export.zip"'

        # Clean up temp file
        import atexit
        atexit.register(lambda p=zip_path: os.unlink(p) if os.path.exists(p) else None)

        return response

    except Exception as e:
        # Clean up on error
        if os.path.exists(zip_path):
            os.unlink(zip_path)
        return Response({'error': 'Export failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ──────────────────────────────────────────────────────
# Phase 4: Contextual Document Action Logging
# ──────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_document_action(request):
    """
    Lightweight endpoint to log contextual document actions.
    Body: { "document_id": "uuid", "action": "export_pdf|email_share|save_draft|download|view" }
    """
    doc_id = request.data.get('document_id')
    action = request.data.get('action')

    if not doc_id or not action:
        return Response({'error': 'document_id and action are required'}, status=status.HTTP_400_BAD_REQUEST)

    valid_actions = ['export_pdf', 'email_share', 'save_draft', 'download', 'view']
    if action not in valid_actions:
        return Response({'error': f'Invalid action. Must be one of: {valid_actions}'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        doc = ManagedDocument.objects.get(id=doc_id)
    except ManagedDocument.DoesNotExist:
        return Response({'error': 'Document not found'}, status=status.HTTP_404_NOT_FOUND)

    log_access(doc, request.user, action, request)

    return Response({'status': 'logged'})
