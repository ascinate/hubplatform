from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.http import HttpResponseRedirect
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html
from django.contrib import messages
from datetime import timedelta

from .models import User, Organization
from .founder_models import AgentAssignment, FounderActionLog


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'plan', 'member_count', 'trial_status_display',
        'is_active', 'is_trial_locked', 'created_at', 'action_buttons',
    ]
    list_filter = ['plan', 'is_active', 'is_trial_locked']
    search_fields = ['name', 'slug']
    ordering = ['-created_at']
    readonly_fields = ['slug', 'created_at', 'trial_start', 'trial_end']

    # ------------------------------------------------------------------ #
    # Computed columns                                                     #
    # ------------------------------------------------------------------ #

    @admin.display(description='Members')
    def member_count(self, obj):
        return User.objects.filter(organization=obj).count()

    @admin.display(description='Trial Status')
    def trial_status_display(self, obj):
        if obj.plan != 'free':
            return format_html('<span style="color:#27AE60;">Paid</span>')
        if obj.is_trial_locked:
            return format_html('<span style="color:#E74C3C;font-weight:bold;">Locked</span>')
        days = obj.trial_days_remaining
        if days is None:
            return '—'
        color = '#27AE60' if days > 7 else '#E67E22' if days > 0 else '#E74C3C'
        return format_html('<span style="color:{};">{} days left</span>', color, days)

    # ------------------------------------------------------------------ #
    # Per-row action buttons                                               #
    # ------------------------------------------------------------------ #

    @admin.display(description='Actions')
    def action_buttons(self, obj):
        activate_url = reverse('admin:org-activate', args=[obj.pk])
        pause_url    = reverse('admin:org-pause',    args=[obj.pk])
        reset_url    = reverse('admin:org-reset',    args=[obj.pk])
        return format_html(
            '<a class="button" style="padding:3px 8px;margin:1px;background:#27AE60;color:#fff;border-radius:3px;text-decoration:none;" href="{}">▶ Start</a> '
            '<a class="button" style="padding:3px 8px;margin:1px;background:#E67E22;color:#fff;border-radius:3px;text-decoration:none;" href="{}">⏸ Pause</a> '
            '<a class="button" style="padding:3px 8px;margin:1px;background:#E74C3C;color:#fff;border-radius:3px;text-decoration:none;" href="{}" onclick="return confirm(\'Delete ALL data for {} and their users? This cannot be undone.\')">🗑 Reset</a>',
            activate_url, pause_url, reset_url, obj.name,
        )

    # ------------------------------------------------------------------ #
    # Custom URLs for per-row button actions                               #
    # ------------------------------------------------------------------ #

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path('<uuid:pk>/activate/', self.admin_site.admin_view(self.activate_view), name='org-activate'),
            path('<uuid:pk>/pause/',    self.admin_site.admin_view(self.pause_view),    name='org-pause'),
            path('<uuid:pk>/reset/',    self.admin_site.admin_view(self.reset_view),    name='org-reset'),
        ]
        return custom + urls

    def _get_org_or_redirect(self, request, pk):
        try:
            return Organization.objects.get(pk=pk)
        except Organization.DoesNotExist:
            messages.error(request, 'Organization not found.')
            return None

    def activate_view(self, request, pk):
        org = self._get_org_or_redirect(request, pk)
        if org:
            org.is_active = True
            org.is_trial_locked = False
            # Extend/reset trial to 21 days from today
            org.trial_start = timezone.now()
            org.trial_end   = timezone.now() + timedelta(days=21)
            org.save()
            messages.success(request, f'"{org.name}" activated — trial extended 21 days from today.')
        return HttpResponseRedirect(reverse('admin:accounts_organization_changelist'))

    def pause_view(self, request, pk):
        org = self._get_org_or_redirect(request, pk)
        if org:
            org.is_trial_locked = True
            org.save()
            messages.warning(request, f'"{org.name}" paused — users will see trial-expired message on login.')
        return HttpResponseRedirect(reverse('admin:accounts_organization_changelist'))

    def reset_view(self, request, pk):
        org = self._get_org_or_redirect(request, pk)
        if not org:
            return HttpResponseRedirect(reverse('admin:accounts_organization_changelist'))

        org_name = org.name

        # Fetch all users before org deletion (org FK is SET_NULL)
        org_users = list(User.objects.filter(organization=org).exclude(is_staff=True))

        # Delete org — Django CASCADE removes all related data
        org.delete()

        # Delete each member (non-staff)
        deleted_users = []
        for user in org_users:
            deleted_users.append(user.email)
            user.delete()

        msg = f'"{org_name}" and all its data have been deleted.'
        if deleted_users:
            msg += f' Users removed: {", ".join(deleted_users)}.'
        messages.success(request, msg)
        return HttpResponseRedirect(reverse('admin:accounts_organization_changelist'))

    # ------------------------------------------------------------------ #
    # Bulk admin actions (dropdown — works on multiple rows at once)       #
    # ------------------------------------------------------------------ #

    @admin.action(description='▶ Activate selected organizations (reset trial to 21 days)')
    def bulk_activate(self, request, queryset):
        now = timezone.now()
        count = queryset.update(
            is_active=True,
            is_trial_locked=False,
            trial_start=now,
            trial_end=now + timedelta(days=21),
        )
        self.message_user(request, f'{count} organization(s) activated with a fresh 21-day trial.', messages.SUCCESS)

    @admin.action(description='⏸ Pause selected organizations')
    def bulk_pause(self, request, queryset):
        count = queryset.update(is_trial_locked=True)
        self.message_user(request, f'{count} organization(s) paused.', messages.WARNING)

    actions = ['bulk_activate', 'bulk_pause']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'role', 'organization', 'email_verified', 'is_active', 'created_at']
    list_filter = ['role', 'email_verified', 'is_active', 'organization__plan']
    search_fields = ['email', 'full_name']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name',)}),
        ('Role & Org', {'fields': ('role', 'organization')}),
        ('Status', {'fields': ('is_active', 'is_staff', 'is_superuser', 'email_verified')}),
        ('Timestamps', {'fields': ('created_at', 'last_login_at'), 'classes': ('collapse',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'organization', 'password1', 'password2'),
        }),
    )
    readonly_fields = ['created_at', 'last_login_at']
    filter_horizontal = ('groups', 'user_permissions')


@admin.register(AgentAssignment)
class AgentAssignmentAdmin(admin.ModelAdmin):
    list_display = ['agent', 'agent_type', 'is_active', 'assigned_by', 'created_at']
    list_filter = ['agent_type', 'is_active']
    search_fields = ['agent__email', 'agent__full_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FounderActionLog)
class FounderActionLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'actor', 'action', 'target_user', 'target_client_name', 'ip_address']
    list_filter = ['action']
    search_fields = ['actor__email', 'target_client_name', 'notes']
    readonly_fields = [
        'id', 'actor', 'action', 'target_user', 'target_client_id',
        'target_client_name', 'notes', 'timestamp', 'ip_address',
        'user_agent', 'session_duration_seconds',
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False
