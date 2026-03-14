"""
Share link service for DMS Phase 2.
Create/validate share links and send notification emails.
"""

from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from .models import ShareLink, DocumentAccessLog


def create_share_link(document, user, expires_hours=72, recipient_email='',
                      recipient_name='', max_access=10, requires_watermark=False):
    """Create a new share link for a document."""
    link = ShareLink.objects.create(
        document=document,
        created_by=user,
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        expires_at=timezone.now() + timedelta(hours=expires_hours),
        max_access=max_access,
        requires_watermark=requires_watermark,
    )

    # Log the share creation
    DocumentAccessLog.objects.create(
        document=document,
        user=user,
        action='share_created',
    )

    return link


def validate_share_link(token):
    """
    Validate a share link token.
    Returns (share_link, error_message).
    """
    try:
        link = ShareLink.objects.select_related(
            'document', 'document__organization', 'created_by'
        ).get(token=token)
    except ShareLink.DoesNotExist:
        return None, 'Share link not found'

    if link.is_revoked:
        return None, 'This share link has been revoked'

    if link.is_expired:
        return None, 'This share link has expired'

    if link.access_count >= link.max_access:
        return None, 'This share link has reached its access limit'

    if link.document.is_deleted:
        return None, 'The shared document has been deleted'

    return link, None


def record_share_access(link, request=None):
    """Record an access to a share link and increment counter."""
    link.access_count += 1
    link.save(update_fields=['access_count'])

    ip_address = None
    user_agent = ''
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            ip_address = x_forwarded.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]

    DocumentAccessLog.objects.create(
        document=link.document,
        user=None,
        action='share_accessed',
        ip_address=ip_address,
        user_agent=user_agent,
    )


def send_share_email(link, sender_name=''):
    """Send share notification email to recipient."""
    if not link.recipient_email:
        return

    try:
        from apps.accounts.emails import _base_html, BRAND_COLOR, LOGO_TEXT

        frontend_url = getattr(settings, 'FRONTEND_URL', 'https://sankalphub.in')
        share_url = f'{frontend_url}/share/{link.token}'

        body = f"""
        <h2 style="color:#333;margin:0 0 16px;">Document Shared With You</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;">
            <strong>{sender_name or 'Someone'}</strong> has shared a document with you on SankalpHub.
        </p>
        <div style="background:#F8F9FA;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#333;font-size:15px;">
                <strong>📄 {link.document.name}</strong>
            </p>
            <p style="margin:8px 0 0;color:#777;font-size:13px;">
                Type: {link.document.file_type.upper()} &nbsp;·&nbsp;
                Expires: {link.expires_at.strftime('%b %d, %Y %I:%M %p')}
            </p>
        </div>
        <div style="text-align:center;margin:28px 0;">
            <a href="{share_url}" style="
                display:inline-block;padding:12px 32px;
                background:{BRAND_COLOR};color:#fff;
                border-radius:8px;text-decoration:none;
                font-weight:600;font-size:15px;">
                View Document
            </a>
        </div>
        <p style="color:#999;font-size:12px;margin-top:20px;">
            This link expires on {link.expires_at.strftime('%b %d, %Y')} and can be accessed up to {link.max_access} times.
        </p>
        """

        html = _base_html(
            title=f'Document shared: {link.document.name}',
            preheader=f'{sender_name or "Someone"} shared "{link.document.name}" with you',
            body_html=body,
        )

        from django.core.mail import EmailMultiAlternatives
        email = EmailMultiAlternatives(
            subject=f'📄 Document shared: {link.document.name}',
            body=f'{sender_name or "Someone"} shared "{link.document.name}" with you. View at: {share_url}',
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[link.recipient_email],
        )
        email.attach_alternative(html, 'text/html')
        email.send(fail_silently=True)

    except Exception:
        import logging
        logging.getLogger(__name__).warning(
            f'Failed to send share email for link {link.id}', exc_info=True
        )
