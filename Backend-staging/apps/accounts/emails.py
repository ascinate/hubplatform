"""
SANKALP Email Utilities
Centralised HTML email sending for all transactional emails.
"""

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

BRAND_COLOR = "#F3924A"
LOGO_TEXT = "SANKALP 🏆"
SUPPORT_EMAIL = "hello@sankalphub.in"
FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'https://sankalphub.in')


def _base_html(title: str, preheader: str, body_html: str) -> str:
    """Wraps email body in a clean, branded HTML shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:'Segoe UI',Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:580px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <!-- Header -->
      <tr>
        <td style="background:{BRAND_COLOR};padding:28px 32px;text-align:center;">
          <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">{LOGO_TEXT}</span>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Production &amp; Inspection Intelligence</p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:36px 32px;">
          {body_html}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#F8F9FA;padding:20px 32px;border-top:1px solid #eee;text-align:center;">
          <p style="margin:0;font-size:12px;color:#999;">
            Questions? Email us at <a href="mailto:{SUPPORT_EMAIL}" style="color:{BRAND_COLOR};text-decoration:none;">{SUPPORT_EMAIL}</a>
          </p>
          <p style="margin:6px 0 0;font-size:11px;color:#bbb;">
            &copy; 2024 SANKALP. All rights reserved.
            &nbsp;·&nbsp;
            <a href="{FRONTEND_URL}" style="color:#bbb;text-decoration:none;">sankalphub.in</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def _send(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
    """Send an email. Returns True on success, False on failure."""
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content or "Please view this email in an HTML-capable client.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"Email sent: '{subject}' → {to_email}")
        return True
    except Exception as e:
        logger.error(f"Email failed: '{subject}' → {to_email}: {e}")
        return False


# ─── Welcome Email ────────────────────────────────────────────────────────────

def send_welcome_email(user) -> bool:
    name = user.full_name or user.email.split('@')[0]
    org_name = user.organization.name if user.organization else ''

    body = f"""
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;font-weight:800;">Welcome to SANKALP 🏆</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;">Hi {name},</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      Your account is ready. You can now start tracking production orders, managing inspections,
      and driving quality across your supply chain{' for <strong>' + org_name + '</strong>' if org_name else ''}.
    </p>
    <div style="background:#FFF7F0;border-left:4px solid {BRAND_COLOR};border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;font-weight:700;color:#1a1a1a;font-size:14px;">Get started in 3 steps:</p>
      <ol style="margin:0;padding-left:18px;color:#555;font-size:14px;line-height:2;">
        <li>Add your first <strong>Factory</strong></li>
        <li>Create a <strong>Production Order</strong></li>
        <li>Log an <strong>Inspection</strong></li>
      </ol>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="{FRONTEND_URL}/dashboard"
         style="background:{BRAND_COLOR};color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
        Go to Dashboard →
      </a>
    </div>
    <p style="margin:20px 0 0;color:#999;font-size:13px;text-align:center;">
      Need help? Reply to this email or visit our <a href="{FRONTEND_URL}" style="color:{BRAND_COLOR};">support page</a>.
    </p>
    """

    html = _base_html(
        title="Welcome to SANKALP",
        preheader=f"Your SANKALP account is ready — start tracking production today.",
        body_html=body,
    )
    return _send(user.email, "Welcome to SANKALP 🏆 — Your account is ready", html)


# ─── Password Reset Email ─────────────────────────────────────────────────────

def send_password_reset_email(user, token: str) -> bool:
    name = user.full_name or user.email.split('@')[0]
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"

    body = f"""
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;font-weight:800;">Reset Your Password</h2>
    <p style="margin:0 0 16px;color:#555;font-size:15px;">Hi {name},</p>
    <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
      We received a request to reset your SANKALP password. Click the button below to choose a new password.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{reset_url}"
         style="background:{BRAND_COLOR};color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
        Reset Password →
      </a>
    </div>
    <p style="margin:16px 0;color:#888;font-size:13px;text-align:center;">
      This link expires in <strong>24 hours</strong>.
      If you didn't request a password reset, you can safely ignore this email.
    </p>
    <p style="margin:0;color:#bbb;font-size:12px;text-align:center;word-break:break-all;">
      Or copy this link: <a href="{reset_url}" style="color:{BRAND_COLOR};">{reset_url}</a>
    </p>
    """

    html = _base_html(
        title="Reset Your SANKALP Password",
        preheader="Reset your SANKALP password — link expires in 24 hours.",
        body_html=body,
    )
    return _send(user.email, "Reset your SANKALP password", html)


# ─── Inspection Fail Alert ────────────────────────────────────────────────────

def send_inspection_fail_alert(inspection) -> bool:
    """Send alert to org admin when an inspection fails."""
    org = inspection.organization
    if not org:
        return False

    # Send to org admins (or fall back to any admin email)
    from apps.accounts.models import User as UserModel
    recipients = list(
        UserModel.objects.filter(
            organization=org,
            role__in=['org_admin', 'admin'],
        ).values_list('email', flat=True)[:5]
    )
    if not recipients:
        recipients = list(
            UserModel.objects.filter(organization=org).values_list('email', flat=True)[:3]
        )
    if not recipients:
        return False

    factory_name = inspection.factory.name if inspection.factory else 'Unknown Factory'
    defect_rate = float(inspection.defect_rate)
    ins_type = inspection.get_inspection_type_display()
    ins_date = str(inspection.inspection_date)
    auditor = inspection.auditor_name or 'N/A'

    body = f"""
    <div style="background:#FFF0F0;border-radius:10px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #EF4444;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#DC2626;letter-spacing:1px;text-transform:uppercase;">⚠ Inspection Failed</p>
    </div>
    <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;font-weight:800;">Quality Alert — Inspection Failed</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;line-height:1.6;">
      An inspection at <strong>{factory_name}</strong> has been marked as <strong style="color:#DC2626;">FAILED</strong>
      with a defect rate of <strong style="color:#DC2626;">{defect_rate:.1f}%</strong>.
      Immediate review may be required.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr style="background:#F8F9FA;">
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#888;border-radius:6px 0 0 0;">Factory</td>
        <td style="padding:10px 14px;font-size:14px;font-weight:700;color:#1a1a1a;border-radius:0 6px 0 0;">{factory_name}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#888;">Type</td>
        <td style="padding:10px 14px;font-size:14px;color:#1a1a1a;">{ins_type}</td>
      </tr>
      <tr style="background:#F8F9FA;">
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#888;">Date</td>
        <td style="padding:10px 14px;font-size:14px;color:#1a1a1a;">{ins_date}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#888;">Auditor</td>
        <td style="padding:10px 14px;font-size:14px;color:#1a1a1a;">{auditor}</td>
      </tr>
      <tr style="background:#FFF0F0;">
        <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#DC2626;border-radius:0 0 0 6px;">Defect Rate</td>
        <td style="padding:10px 14px;font-size:16px;font-weight:800;color:#DC2626;border-radius:0 0 6px 0;">{defect_rate:.1f}%</td>
      </tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      <a href="{FRONTEND_URL}/inspections"
         style="background:#DC2626;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
        View Inspection Report →
      </a>
    </div>
    """

    html = _base_html(
        title="Inspection Failed — SANKALP Alert",
        preheader=f"⚠ Inspection FAILED at {factory_name} — {defect_rate:.1f}% defect rate",
        body_html=body,
    )

    success = True
    for email in recipients:
        ok = _send(email, f"⚠ Inspection Failed — {factory_name} ({defect_rate:.1f}% defect rate)", html)
        if not ok:
            success = False
    return success


# ─── Payment Receipt Email ────────────────────────────────────────────────────

def send_payment_receipt(user, plan_name: str, amount, currency: str, payment_id: str) -> bool:
    name = user.full_name or user.email.split('@')[0]

    if currency == 'INR':
        amount_str = f"₹{float(amount):,.2f}"
    else:
        amount_str = f"${float(amount):.2f} USD"

    from datetime import date
    today = date.today().strftime('%d %B %Y')

    body = f"""
    <div style="background:#F0FFF4;border-radius:10px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #22C55E;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#16A34A;letter-spacing:1px;text-transform:uppercase;">✓ Payment Successful</p>
    </div>
    <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:22px;font-weight:800;">Payment Receipt</h2>
    <p style="margin:0 0 20px;color:#555;font-size:15px;">Hi {name}, your payment has been received and your subscription is now active.</p>

    <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#F8F9FA;">
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#888;width:40%;">Plan</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1a1a1a;">{plan_name}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#888;">Amount Paid</td>
        <td style="padding:12px 16px;font-size:16px;font-weight:800;color:#16A34A;">{amount_str}</td>
      </tr>
      <tr style="background:#F8F9FA;">
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#888;">Date</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a1a;">{today}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#888;">Payment ID</td>
        <td style="padding:12px 16px;font-size:12px;font-family:monospace;color:#555;">{payment_id}</td>
      </tr>
      <tr style="background:#F8F9FA;">
        <td style="padding:12px 16px;font-size:13px;font-weight:600;color:#888;">Gateway</td>
        <td style="padding:12px 16px;font-size:14px;color:#1a1a1a;">{'Razorpay (INR)' if currency == 'INR' else 'Stripe (USD)'}</td>
      </tr>
    </table>

    <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.6;">
      Your <strong>{plan_name}</strong> subscription is now active. You can manage your subscription
      anytime from the Billing page.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="{FRONTEND_URL}/billing"
         style="background:{BRAND_COLOR};color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
        View Billing Details →
      </a>
    </div>
    <p style="margin:16px 0 0;color:#999;font-size:12px;text-align:center;">
      Keep this email for your records. For billing support, contact <a href="mailto:{SUPPORT_EMAIL}" style="color:{BRAND_COLOR};">{SUPPORT_EMAIL}</a>.
    </p>
    """

    html = _base_html(
        title="Payment Receipt — SANKALP",
        preheader=f"Receipt: {amount_str} for {plan_name} — SANKALP subscription active.",
        body_html=body,
    )
    return _send(user.email, f"Payment Receipt — {plan_name} Subscription ({amount_str})", html)


# ─── Task Notification Email ────────────────────────────────────────────────

def send_task_notification_email(to_email, to_name, task, event_type, title, message, urgency='normal'):
    """Branded task notification email."""
    urgency_color = '#DC2626' if urgency == 'urgent' else BRAND_COLOR

    factory_row = ''
    if task.factory:
        factory_row = f'<tr><td style="padding:6px 0;font-weight:600;width:140px;">Factory</td><td>{task.factory.name}</td></tr>'

    order_row = ''
    if task.order:
        order_row = f'<tr><td style="padding:6px 0;font-weight:600;">Order No</td><td>{task.order.po_number}</td></tr>'

    body = f"""
    <h2 style="color:#1e293b;margin:0 0 12px;font-size:18px;">{title}</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;">{message}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
    <table style="width:100%;font-size:14px;color:#475569;">
      <tr><td style="padding:6px 0;font-weight:600;width:140px;">Task</td><td>{task.title}</td></tr>
      <tr><td style="padding:6px 0;font-weight:600;">Type</td><td>{task.get_task_type_display()}</td></tr>
      <tr><td style="padding:6px 0;font-weight:600;">Priority</td><td>{task.get_priority_display()}</td></tr>
      <tr><td style="padding:6px 0;font-weight:600;">Due Date</td><td>{task.due_date.strftime('%a, %d %b %Y')}</td></tr>
      {factory_row}
      {order_row}
    </table>
    <div style="margin-top:28px;text-align:center;">
      <a href="{FRONTEND_URL}/tasks"
         style="background:{urgency_color};color:white;text-decoration:none;
                padding:12px 28px;border-radius:6px;font-weight:600;
                font-size:14px;display:inline-block;">
        View Task
      </a>
    </div>
    <p style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center;">
      Manage your notification preferences in Settings &rarr; Notifications
    </p>
    """
    html = _base_html(
        title=f"Task Notification — SANKALP",
        preheader=message[:120],
        body_html=body,
    )
    return _send(to_email, title, html)
