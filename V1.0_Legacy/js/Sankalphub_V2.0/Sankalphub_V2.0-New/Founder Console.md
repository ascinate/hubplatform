# SankalpHub — Founder Console & Sub-Agent System

# Paste this entire file into Claude Code

  

---

  

## YOUR MISSION

  

Build a **Founder Console** layer on top of the existing SankalpHub platform.

  

This adds a completely separate, private management interface for the platform owner (Naveen)

and a Sub-Agent delegation system — without touching or breaking anything existing.

  

**URL Structure (CORRECT — memorise this):**

```

sankalphub.in → Frontend (Next.js) — all users log in here

app.sankalphub.in → Backend API (Django/DRF) — never typed by users directly

console.sankalphub.in → Founder Console (NEW) — only founder + sub-agents

```

  

---

  

## STEP 0 — READ FIRST, THEN ACT

  

Before writing a single line of code, read these files:

  

```

1. List full project directory tree (2 levels deep — both backend/ and frontend/)

2. Read: backend/apps/users/models.py — understand existing User model & roles

3. Read: backend/apps/users/serializers.py — understand auth serializers

4. Read: backend/config/settings.py — understand project settings

5. Read: backend/config/urls.py — understand URL routing

6. Read: frontend/app/layout.tsx — understand Next.js layout

7. Read: frontend/middleware.ts — understand existing auth middleware (if any)

8. Read: frontend/app/(auth)/login/page.tsx — understand current login flow

```

  

Only after reading these 8 files, begin the changes below.

If a file path doesn't match exactly, find the equivalent file — don't assume.

  

---

  

## PART 1 — BACKEND (Django / DRF)

  

### 1.1 — Update User Model

  

Find the existing `User` model in `backend/apps/users/models.py`.

  

Add `SUPER_OWNER` and `SUB_AGENT` to the role choices **at the top** of the list,

keeping all existing roles unchanged below them:

  

```python

ROLE_CHOICES = [

('SUPER_OWNER', 'Founder / Platform Owner'), # NEW — Naveen only

('SUB_AGENT', 'Sub-Agent'), # NEW — delegated staff

# ... all existing roles remain exactly as they are

]

```

  

No other changes to the User model.

  

---

  

### 1.2 — Create Two New Models

  

Create a new file: `backend/apps/users/founder_models.py`

  

```python

import uuid

from django.db import models

from django.conf import settings

  
  

class AgentAssignment(models.Model):

"""

Defines which clients a SUB_AGENT user can access and what they can do.

Created by SUPER_OWNER only.

"""

id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

  

agent = models.ForeignKey(

settings.AUTH_USER_MODEL,

on_delete=models.CASCADE,

related_name='agent_assignments',

limit_choices_to={'role': 'SUB_AGENT'},

)

  

# Which clients this agent can access

# Stores list of client/brand IDs: ["uuid1", "uuid2"]

client_ids = models.JSONField(default=list)

  

# What actions this agent is permitted to perform

# e.g. ["view_reports", "add_users", "handle_tickets", "view_inspections"]

allowed_actions = models.JSONField(default=list)

  

# Agent type label for display

AGENT_TYPE_CHOICES = [

('CLIENT_SUCCESS', 'Client Success Agent'),

('QA_SUPERVISOR', 'QA Supervisor Agent'),

('TECHNICAL', 'Technical Agent'),

('BILLING', 'Billing Agent'),

]

agent_type = models.CharField(

max_length=20, choices=AGENT_TYPE_CHOICES, default='CLIENT_SUCCESS'

)

  

assigned_by = models.ForeignKey(

settings.AUTH_USER_MODEL,

on_delete=models.SET_NULL,

null=True,

related_name='assignments_created',

limit_choices_to={'role': 'SUPER_OWNER'},

)

  

is_active = models.BooleanField(default=True)

created_at = models.DateTimeField(auto_now_add=True)

updated_at = models.DateTimeField(auto_now=True)

notes = models.TextField(blank=True)

  

class Meta:

ordering = ['-created_at']

verbose_name = 'Agent Assignment'

  

def __str__(self):

return f"{self.agent.email} → {self.get_agent_type_display()}"

  
  

class FounderActionLog(models.Model):

"""

Immutable audit trail of every action taken by SUPER_OWNER or SUB_AGENT.

Never deleted. Append-only.

"""

id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

  

ACTION_CHOICES = [

('IMPERSONATE_START', 'Started impersonating user'),

('IMPERSONATE_END', 'Ended impersonation session'),

('SUSPEND_USER', 'Suspended a user'),

('UNSUSPEND_USER', 'Unsuspended a user'),

('SUSPEND_CLIENT', 'Suspended a client account'),

('PERMISSION_OVERRIDE','Overrode a user permission'),

('CREATE_AGENT', 'Created a sub-agent'),

('REVOKE_AGENT', 'Revoked sub-agent access'),

('BROADCAST_SENT', 'Sent platform announcement'),

('BILLING_VIEW', 'Viewed billing/revenue data'),

('SUPPORT_RESOLVED', 'Marked support ticket resolved'),

]

  

actor = models.ForeignKey(

settings.AUTH_USER_MODEL,

on_delete=models.SET_NULL,

null=True,

related_name='founder_actions',

)

action = models.CharField(max_length=30, choices=ACTION_CHOICES)

  

# Targets (both nullable — not every action has both)

target_user = models.ForeignKey(

settings.AUTH_USER_MODEL,

on_delete=models.SET_NULL,

null=True, blank=True,

related_name='actions_received',

)

target_client_id = models.UUIDField(null=True, blank=True)

target_client_name = models.CharField(max_length=200, blank=True)

  

# Context

notes = models.TextField(blank=True)

timestamp = models.DateTimeField(auto_now_add=True)

ip_address = models.GenericIPAddressField(null=True, blank=True)

user_agent = models.TextField(blank=True)

  

# For impersonation sessions

session_duration_seconds = models.IntegerField(null=True, blank=True)

  

class Meta:

ordering = ['-timestamp']

verbose_name = 'Founder Action Log'

  

def __str__(self):

return f"{self.actor} · {self.action} · {self.timestamp:%Y-%m-%d %H:%M}"

```

  

Then import these models in `backend/apps/users/models.py`:

```python

from .founder_models import AgentAssignment, FounderActionLog

```

  

---

  

### 1.3 — Create Migrations

  

```bash

python manage.py makemigrations users

python manage.py migrate

```

  

---

  

### 1.4 — Permission Classes

  

Create `backend/apps/users/founder_permissions.py`:

  

```python

from rest_framework.permissions import BasePermission

  
  

class IsFounder(BasePermission):

"""Only SUPER_OWNER can access."""

message = "Founder access required."

  

def has_permission(self, request, view):

return (

request.user

and request.user.is_authenticated

and request.user.role == 'SUPER_OWNER'

)

  
  

class IsFounderOrAgent(BasePermission):

"""SUPER_OWNER or active SUB_AGENT can access."""

message = "Founder or Sub-Agent access required."

  

def has_permission(self, request, view):

if not request.user or not request.user.is_authenticated:

return False

if request.user.role == 'SUPER_OWNER':

return True

if request.user.role == 'SUB_AGENT':

return request.user.agent_assignments.filter(is_active=True).exists()

return False

  
  

class AgentScopePermission(BasePermission):

"""

For SUB_AGENT requests: checks if the requested client_id

is in the agent's assigned client_ids list.

Pass client_id in request kwargs or query params.

"""

def has_permission(self, request, view):

if request.user.role == 'SUPER_OWNER':

return True # founder sees everything

  

client_id = (

view.kwargs.get('client_id')

or request.query_params.get('client_id')

)

if not client_id:

return False

  

return request.user.agent_assignments.filter(

is_active=True,

client_ids__contains=[str(client_id)]

).exists()

```

  

---

  

### 1.5 — Founder API Views

  

Create `backend/apps/users/founder_views.py`:

  

```python

import jwt

import uuid

from datetime import datetime, timedelta

from django.conf import settings

from django.contrib.auth import get_user_model

from django.utils import timezone

from rest_framework import status

from rest_framework.decorators import api_view, permission_classes

from rest_framework.response import Response

from rest_framework.views import APIView

  

from .founder_models import AgentAssignment, FounderActionLog

from .founder_permissions import IsFounder, IsFounderOrAgent, AgentScopePermission

  

User = get_user_model()

  
  

def log_founder_action(request, action, target_user=None,

target_client_id=None, target_client_name='', notes=''):

"""Helper to create a FounderActionLog entry."""

FounderActionLog.objects.create(

actor=request.user,

action=action,

target_user=target_user,

target_client_id=target_client_id,

target_client_name=target_client_name,

notes=notes,

ip_address=request.META.get('REMOTE_ADDR'),

user_agent=request.META.get('HTTP_USER_AGENT', ''),

)

  
  

# ── PLATFORM OVERVIEW ──────────────────────────────────────────────────────

  

class FounderDashboardView(APIView):

permission_classes = [IsFounder]

  

def get(self, request):

"""

Returns platform-wide KPIs for the Founder Console dashboard.

Adjust querysets to match your actual models.

"""

from django.apps import apps

  

# Adapt these to your actual model names

try:

Brand = apps.get_model('brands', 'Brand')

Factory = apps.get_model('factories', 'Factory')

Order = apps.get_model('orders', 'Order')

except LookupError:

Brand = Factory = Order = None

  

data = {

'platform': {

'total_clients': Brand.objects.count() if Brand else 0,

'total_users': User.objects.exclude(role='SUPER_OWNER').count(),

'total_factories': Factory.objects.count() if Factory else 0,

'total_orders': Order.objects.count() if Order else 0,

},

'recent_actions': list(

FounderActionLog.objects.select_related('actor', 'target_user')

.values('action', 'actor__email', 'target_client_name', 'timestamp')[:20]

),

}

return Response(data)

  
  

# ── CLIENT LIST ─────────────────────────────────────────────────────────────

  

class FounderClientListView(APIView):

permission_classes = [IsFounderOrAgent]

  

def get(self, request):

"""

Returns all clients (brands).

SUB_AGENT: filtered to their assigned client_ids only.

SUPER_OWNER: all clients.

"""

from django.apps import apps

try:

Brand = apps.get_model('brands', 'Brand')

except LookupError:

return Response({'error': 'Brand model not found'}, status=500)

  

if request.user.role == 'SUPER_OWNER':

clients = Brand.objects.all().values(

'id', 'brand_name', 'brand_code', 'country', 'active'

)

else:

assignment = request.user.agent_assignments.filter(is_active=True).first()

if not assignment:

return Response({'clients': []})

clients = Brand.objects.filter(

id__in=assignment.client_ids

).values('id', 'brand_name', 'brand_code', 'country', 'active')

  

return Response({'clients': list(clients)})

  
  

# ── USER LIST ───────────────────────────────────────────────────────────────

  

class FounderUserListView(APIView):

permission_classes = [IsFounder]

  

def get(self, request):

"""All users across the platform with their roles."""

users = User.objects.exclude(role='SUPER_OWNER').values(

'id', 'email', 'first_name', 'last_name',

'role', 'is_active', 'date_joined', 'last_login'

).order_by('-date_joined')

  

client_id = request.query_params.get('client_id')

if client_id:

# Filter by brand/factory if your User model has that FK

# Adjust field name to match your actual model

users = users.filter(brand_id=client_id)

  

return Response({'users': list(users), 'total': users.count()})

  
  

# ── IMPERSONATION ────────────────────────────────────────────────────────────

  

class ImpersonateStartView(APIView):

"""

SUPER_OWNER starts an impersonation session for any user.

Returns a short-lived JWT scoped to the target user, plus a session_id for ending.

"""

permission_classes = [IsFounder]

  

def post(self, request, user_id):

try:

target = User.objects.get(id=user_id)

except User.DoesNotExist:

return Response({'error': 'User not found'}, status=404)

  

if target.role == 'SUPER_OWNER':

return Response({'error': 'Cannot impersonate another founder'}, status=400)

  

session_id = str(uuid.uuid4())

expires_at = datetime.utcnow() + timedelta(minutes=30)

  

# Create short-lived JWT for the target user

payload = {

'user_id': str(target.id),

'email': target.email,

'role': target.role,

'impersonated_by': str(request.user.id),

'session_id': session_id,

'exp': expires_at,

'iat': datetime.utcnow(),

'type': 'impersonation',

}

token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

  

log_founder_action(

request,

action='IMPERSONATE_START',

target_user=target,

notes=f"Session ID: {session_id}",

)

  

return Response({

'token': token,

'session_id': session_id,

'target_user': {

'id': str(target.id),

'email': target.email,

'role': target.role,

'name': f"{target.first_name} {target.last_name}".strip(),

},

'expires_at': expires_at.isoformat(),

'message': f"Now viewing as {target.email}. Session expires in 30 minutes.",

})

  
  

class ImpersonateEndView(APIView):

"""End an impersonation session and return to founder context."""

permission_classes = [IsFounder]

  

def post(self, request):

session_id = request.data.get('session_id', '')

duration = request.data.get('duration_seconds', None)

  

log_entry = FounderActionLog.objects.create(

actor=request.user,

action='IMPERSONATE_END',

notes=f"Session ID: {session_id}",

session_duration_seconds=duration,

ip_address=request.META.get('REMOTE_ADDR'),

user_agent=request.META.get('HTTP_USER_AGENT', ''),

)

  

return Response({'message': 'Impersonation ended', 'logged': str(log_entry.id)})

  
  

# ── USER SUSPEND / UNSUSPEND ─────────────────────────────────────────────────

  

class SuspendUserView(APIView):

permission_classes = [IsFounder]

  

def post(self, request, user_id):

try:

user = User.objects.get(id=user_id)

except User.DoesNotExist:

return Response({'error': 'User not found'}, status=404)

  

if user.role == 'SUPER_OWNER':

return Response({'error': 'Cannot suspend founder account'}, status=400)

  

action = 'SUSPEND_USER' if user.is_active else 'UNSUSPEND_USER'

user.is_active = not user.is_active

user.save(update_fields=['is_active'])

  

log_founder_action(request, action=action, target_user=user,

notes=request.data.get('reason', ''))

  

return Response({

'message': f"User {'suspended' if not user.is_active else 'unsuspended'}",

'is_active': user.is_active,

})

  
  

# ── SUB-AGENT MANAGEMENT ─────────────────────────────────────────────────────

  

class SubAgentListView(APIView):

permission_classes = [IsFounder]

  

def get(self, request):

assignments = AgentAssignment.objects.select_related('agent').filter(is_active=True)

data = [{

'id': str(a.id),

'agent_email': a.agent.email,

'agent_name': f"{a.agent.first_name} {a.agent.last_name}".strip(),

'agent_type': a.agent_type,

'agent_type_label':a.get_agent_type_display(),

'client_ids': a.client_ids,

'allowed_actions': a.allowed_actions,

'created_at': a.created_at.isoformat(),

} for a in assignments]

return Response({'agents': data})

  

def post(self, request):

"""

Create a new Sub-Agent assignment.

Body: { email, agent_type, client_ids[], allowed_actions[], notes }

"""

email = request.data.get('email')

try:

agent_user = User.objects.get(email=email)

except User.DoesNotExist:

return Response({'error': f'No user found with email: {email}'}, status=404)

  

# Promote to SUB_AGENT if not already

if agent_user.role not in ('SUB_AGENT', 'SUPER_OWNER'):

agent_user.role = 'SUB_AGENT'

agent_user.save(update_fields=['role'])

  

assignment = AgentAssignment.objects.create(

agent=agent_user,

agent_type=request.data.get('agent_type', 'CLIENT_SUCCESS'),

client_ids=request.data.get('client_ids', []),

allowed_actions=request.data.get('allowed_actions', []),

assigned_by=request.user,

notes=request.data.get('notes', ''),

)

  

log_founder_action(request, action='CREATE_AGENT', target_user=agent_user,

notes=f"Type: {assignment.agent_type}")

  

return Response({'message': 'Sub-Agent created', 'id': str(assignment.id)},

status=status.HTTP_201_CREATED)

  
  

class SubAgentRevokeView(APIView):

permission_classes = [IsFounder]

  

def post(self, request, assignment_id):

try:

assignment = AgentAssignment.objects.get(id=assignment_id)

except AgentAssignment.DoesNotExist:

return Response({'error': 'Assignment not found'}, status=404)

  

assignment.is_active = False

assignment.save(update_fields=['is_active'])

  

log_founder_action(request, action='REVOKE_AGENT',

target_user=assignment.agent,

notes=f"Assignment ID: {assignment_id}")

  

return Response({'message': 'Sub-Agent access revoked'})

  
  

# ── AUDIT LOG ────────────────────────────────────────────────────────────────

  

class FounderAuditLogView(APIView):

permission_classes = [IsFounder]

  

def get(self, request):

logs = FounderActionLog.objects.select_related(

'actor', 'target_user'

).values(

'id', 'action', 'actor__email',

'target_user__email', 'target_client_name',

'notes', 'timestamp', 'ip_address',

'session_duration_seconds',

).order_by('-timestamp')[:200]

  

return Response({'logs': list(logs), 'total': FounderActionLog.objects.count()})

```

  

---

  

### 1.6 — Register URL Routes

  

In `backend/config/urls.py`, add the founder routes:

  

```python

from django.urls import path, include

  

# Add this import block

from apps.users.founder_views import (

FounderDashboardView,

FounderClientListView,

FounderUserListView,

ImpersonateStartView,

ImpersonateEndView,

SuspendUserView,

SubAgentListView,

SubAgentRevokeView,

FounderAuditLogView,

)

  

# Add these URL patterns (keep all existing patterns untouched)

founder_urlpatterns = [

path('api/founder/dashboard/', FounderDashboardView.as_view()),

path('api/founder/clients/', FounderClientListView.as_view()),

path('api/founder/users/', FounderUserListView.as_view()),

path('api/founder/impersonate/<uuid:user_id>/', ImpersonateStartView.as_view()),

path('api/founder/impersonate/end/', ImpersonateEndView.as_view()),

path('api/founder/suspend/<uuid:user_id>/', SuspendUserView.as_view()),

path('api/founder/agents/', SubAgentListView.as_view()),

path('api/founder/agents/<uuid:assignment_id>/revoke/', SubAgentRevokeView.as_view()),

path('api/founder/audit/', FounderAuditLogView.as_view()),

]

  

# In urlpatterns list, add:

# urlpatterns = [ ...existing... ] + founder_urlpatterns

```

  

---

  

### 1.7 — Django Admin Registration

  

In `backend/apps/users/admin.py`, add:

  

```python

from .founder_models import AgentAssignment, FounderActionLog

  

@admin.register(AgentAssignment)

class AgentAssignmentAdmin(admin.ModelAdmin):

list_display = ('agent', 'agent_type', 'is_active', 'assigned_by', 'created_at')

list_filter = ('agent_type', 'is_active')

readonly_fields = ('created_at', 'updated_at')

  

@admin.register(FounderActionLog)

class FounderActionLogAdmin(admin.ModelAdmin):

list_display = ('actor', 'action', 'target_user', 'target_client_name', 'timestamp')

list_filter = ('action',)

readonly_fields = ('timestamp', 'ip_address', 'user_agent')

  

def has_add_permission(self, request):

return False # logs are append-only

  

def has_delete_permission(self, request, obj=None):

return False # logs are never deleted

```

  

---

  

## PART 2 — FRONTEND (Next.js)

  

### 2.1 — Create Console Route Group

  

In `frontend/app/`, create a new route group:

  

```

frontend/app/

└── (console)/

├── layout.tsx ← console-specific layout (separate from main app)

└── console/

├── page.tsx ← dashboard

├── clients/

│ └── page.tsx

├── users/

│ └── page.tsx

├── agents/

│ └── page.tsx

└── audit/

└── page.tsx

```

  

---

  

### 2.2 — Console Layout

  

Create `frontend/app/(console)/layout.tsx`:

  

```tsx

import { redirect } from "next/navigation";

import { getServerSession } from "next-auth"; // or your existing auth method

import { ConsoleSidebar } from "@/components/console/ConsoleSidebar";

  

export const metadata = {

title: "SankalpHub Console",

description: "Founder Console — Private",

};

  

export default async function ConsoleLayout({

children,

}: {

children: React.ReactNode;

}) {

// CRITICAL: Check role server-side — never trust client

// Replace with your actual session/auth check

const session = await getServerSession();

  

if (!session?.user) {

redirect("/login?redirect=/console");

}

  

// Only SUPER_OWNER and active SUB_AGENT can access

const allowedRoles = ["SUPER_OWNER", "SUB_AGENT"];

if (!allowedRoles.includes(session.user.role)) {

redirect("/dashboard?error=unauthorized");

}

  

return (

<div className="flex min-h-screen bg-[#F7F8FA]">

<ConsoleSidebar userRole={session.user.role} />

<main className="flex-1 overflow-auto">

{children}

</main>

</div>

);

}

```

  

---

  

### 2.3 — Console Sidebar Component

  

Create `frontend/components/console/ConsoleSidebar.tsx`:

  

```tsx

"use client";

import Link from "next/link";

import { usePathname } from "next/navigation";

import {

LayoutDashboard, Users, Building2,

Shield, FileText, LogOut, Crown

} from "lucide-react";

  

const GOLD = "#C9A96E";

const NAVY = "#0D1420";

  

const NAV_ITEMS = [

{ label: "Dashboard", href: "/console", icon: LayoutDashboard },

{ label: "Clients", href: "/console/clients", icon: Building2 },

{ label: "All Users", href: "/console/users", icon: Users },

{ label: "Sub-Agents", href: "/console/agents", icon: Shield },

{ label: "Audit Log", href: "/console/audit", icon: FileText },

];

  

export function ConsoleSidebar({ userRole }: { userRole: string }) {

const path = usePathname();

  

return (

<aside

className="w-[220px] min-h-screen flex flex-col border-r border-gray-200"

style={{ background: NAVY }}

>

{/* Logo area */}

<div className="px-5 py-5 border-b border-white/10">

<div className="flex items-center gap-2.5">

<Crown className="w-5 h-5" style={{ color: GOLD }} />

<div>

<p className="text-[13px] font-bold text-white leading-none">

SankalpHub

</p>

<p className="text-[10px] mt-0.5 font-semibold tracking-widest uppercase"

style={{ color: GOLD }}>

{userRole === "SUPER_OWNER" ? "Founder Console" : "Agent Console"}

</p>

</div>

</div>

</div>

  

{/* Nav */}

<nav className="flex-1 px-3 py-4 space-y-1">

{NAV_ITEMS.map(({ label, href, icon: Icon }) => {

const active = path === href || (href !== "/console" && path.startsWith(href));

return (

<Link key={href} href={href} className={`

flex items-center gap-3 px-3 py-2.5 rounded-[10px]

text-[13px] font-medium transition-colors

${active

? "text-white"

: "text-white/40 hover:text-white/70 hover:bg-white/5"}

`}

style={active ? { background: "rgba(201,169,110,0.18)", color: GOLD } : {}}>

<Icon className="w-4 h-4 flex-shrink-0" />

{label}

</Link>

);

})}

</nav>

  

{/* Console tag + logout */}

<div className="px-3 py-4 border-t border-white/10">

<div className="px-3 py-2 mb-2 rounded-[8px] bg-white/5">

<p className="text-[10px] text-white/30 uppercase tracking-wider">Logged in as</p>

<p className="text-[11px] text-white/60 font-medium mt-0.5 truncate">

{userRole === "SUPER_OWNER" ? "Platform Founder" : "Sub-Agent"}

</p>

</div>

<Link href="/api/auth/signout"

className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-white/30 hover:text-white/60 text-[12px] transition-colors">

<LogOut className="w-3.5 h-3.5" />

Exit Console

</Link>

</div>

</aside>

);

}

```

  

---

  

### 2.4 — Console Dashboard Page

  

Create `frontend/app/(console)/console/page.tsx`:

  

```tsx

"use client";

import { useEffect, useState } from "react";

import { Users, Building2, ClipboardCheck, Activity } from "lucide-react";

  

const GOLD = "#C9A96E";

const NAVY = "#0D1420";

  

export default function ConsoleDashboard() {

const [data, setData] = useState<any>(null);

const [loading, setLoading] = useState(true);

  

useEffect(() => {

fetch("/api/founder/dashboard/", { credentials: "include" })

.then(r => r.json())

.then(d => { setData(d); setLoading(false); })

.catch(() => setLoading(false));

}, []);

  

const kpis = [

{ label: "Total Clients", value: data?.platform?.total_clients ?? "—", icon: Building2, color: GOLD },

{ label: "Total Users", value: data?.platform?.total_users ?? "—", icon: Users, color: "#3B82F6" },

{ label: "Total Factories", value: data?.platform?.total_factories ?? "—", icon: Activity, color: "#10B981" },

{ label: "Total Orders", value: data?.platform?.total_orders ?? "—", icon: ClipboardCheck, color: "#7C3AED" },

];

  

return (

<div className="p-6">

{/* Header */}

<div className="mb-6">

<h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>

<p className="text-sm text-gray-400 mt-1">

Everything across all clients — only visible to you

</p>

</div>

  

{/* Impersonation Banner — shown when active */}

{/* ImpersonationBanner component goes here — see 2.6 */}

  

{/* KPI Cards */}

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

{kpis.map((kpi, i) => (

<div key={i} className="bg-white rounded-[16px] p-5 border border-gray-100">

<div className="flex items-center justify-between mb-3">

<p className="text-[13px] font-medium text-gray-500">{kpi.label}</p>

<kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />

</div>

<p className="text-[32px] font-extrabold leading-none"

style={{ color: loading ? "#DDD" : NAVY }}>

{loading ? "..." : kpi.value}

</p>

</div>

))}

</div>

  

{/* Recent Actions */}

<div className="bg-white rounded-[16px] border border-gray-100 overflow-hidden">

<div className="px-5 py-4 border-b border-gray-50">

<h2 className="text-[15px] font-bold text-gray-900">Recent Founder Actions</h2>

</div>

{loading ? (

<div className="p-6 text-center text-gray-400 text-sm">Loading...</div>

) : (

<div className="divide-y divide-gray-50">

{(data?.recent_actions ?? []).slice(0, 10).map((log: any, i: number) => (

<div key={i} className="flex items-center justify-between px-5 py-3">

<div>

<p className="text-[13px] font-semibold text-gray-900">{log.action}</p>

<p className="text-[11px] text-gray-400 mt-0.5">

{log.actor__email}

{log.target_client_name ? ` → ${log.target_client_name}` : ""}

</p>

</div>

<span className="text-[11px] text-gray-400">

{new Date(log.timestamp).toLocaleString("en-IN")}

</span>

</div>

))}

{(data?.recent_actions ?? []).length === 0 && (

<div className="p-6 text-center text-gray-400 text-sm">No actions yet</div>

)}

</div>

)}

</div>

</div>

);

}

```

  

---

  

### 2.5 — Impersonation Hook

  

Create `frontend/hooks/useImpersonation.ts`:

  

```typescript

import { useState, useCallback } from "react";

  

interface ImpersonationSession {

token: string;

session_id: string;

target_user: {

id: string;

email: string;

role: string;

name: string;

};

expires_at: string;

started_at: number; // Date.now()

}

  

export function useImpersonation() {

const [session, setSession] = useState<ImpersonationSession | null>(null);

const [loading, setLoading] = useState(false);

const [error, setError] = useState<string | null>(null);

  

const startImpersonation = useCallback(async (userId: string) => {

setLoading(true);

setError(null);

try {

const res = await fetch(`/api/founder/impersonate/${userId}/`, {

method: "POST",

credentials: "include",

});

if (!res.ok) throw new Error("Failed to start impersonation");

const data = await res.json();

setSession({ ...data, started_at: Date.now() });

} catch (e: any) {

setError(e.message);

} finally {

setLoading(false);

}

}, []);

  

const endImpersonation = useCallback(async () => {

if (!session) return;

const duration = Math.floor((Date.now() - session.started_at) / 1000);

await fetch("/api/founder/impersonate/end/", {

method: "POST",

credentials: "include",

headers: { "Content-Type": "application/json" },

body: JSON.stringify({

session_id: session.session_id,

duration_seconds: duration,

}),

});

setSession(null);

}, [session]);

  

return { session, loading, error, startImpersonation, endImpersonation };

}

```

  

---

  

### 2.6 — Impersonation Banner Component

  

Create `frontend/components/console/ImpersonationBanner.tsx`:

  

```tsx

"use client";

import { AlertTriangle, X } from "lucide-react";

  

interface Props {

targetName: string;

targetEmail: string;

targetRole: string;

expiresAt: string;

onExit: () => void;

}

  

export function ImpersonationBanner({

targetName, targetEmail, targetRole, expiresAt, onExit

}: Props) {

return (

<div className="

fixed top-0 inset-x-0 z-[100]

bg-amber-400 border-b-2 border-amber-500

flex items-center justify-between

px-4 py-2.5 shadow-lg

">

<div className="flex items-center gap-3">

<AlertTriangle className="w-4 h-4 text-amber-900 flex-shrink-0" />

<div>

<p className="text-[13px] font-bold text-amber-900">

Viewing as: {targetName || targetEmail}

</p>

<p className="text-[11px] text-amber-800">

Role: {targetRole} · Session expires: {new Date(expiresAt).toLocaleTimeString()}

</p>

</div>

</div>

<button

onClick={onExit}

className="

flex items-center gap-1.5 px-3 py-1.5

bg-amber-900 text-amber-100 rounded-[8px]

text-[12px] font-semibold hover:bg-amber-800

transition-colors

"

>

<X className="w-3.5 h-3.5" />

Exit View As

</button>

</div>

);

}

```

  

---

  

### 2.7 — Update Middleware to Protect Console Routes

  

Find `frontend/middleware.ts` (or create it). Add console route protection:

  

```typescript

import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

import { getToken } from "next-auth/jwt"; // or your existing auth method

  

export async function middleware(request: NextRequest) {

const { pathname } = request.nextUrl;

  

// ── Protect all /console/* routes ──────────────────────

if (pathname.startsWith("/console")) {

const token = await getToken({ req: request });

  

if (!token) {

return NextResponse.redirect(

new URL(`/login?redirect=${pathname}`, request.url)

);

}

  

const allowedRoles = ["SUPER_OWNER", "SUB_AGENT"];

if (!allowedRoles.includes(token.role as string)) {

return NextResponse.redirect(

new URL("/dashboard?error=unauthorized", request.url)

);

}

}

  

// ── All other existing middleware logic remains ─────────

return NextResponse.next();

}

  

export const config = {

matcher: [

"/console/:path*",

// ... add any existing matchers here

],

};

```

  

---

  

## PART 3 — VERIFICATION CHECKLIST

  

After all changes, verify:

  

### Backend

```bash

# Run migrations

python manage.py makemigrations users

python manage.py migrate

  

# No import errors

python manage.py check

  

# Test founder endpoints require auth

curl -X GET http://localhost:8000/api/founder/dashboard/

# Should return 401 or 403

  

# Test a regular user cannot access founder routes

# (test with a non-SUPER_OWNER token)

```

  

### Frontend

```bash

# No TypeScript errors

npx tsc --noEmit

  

# Check console route redirects correctly for non-founders

# Navigate to /console as a regular user → should redirect to /dashboard

```

  

### Manual checks

- [ ] `python manage.py migrate` runs clean, no errors

- [ ] `AgentAssignment` and `FounderActionLog` appear in Django admin

- [ ] `/api/founder/dashboard/` returns 403 for non-SUPER_OWNER users

- [ ] `/console` route redirects regular users to `/dashboard`

- [ ] `/console` loads correctly for SUPER_OWNER user

- [ ] Impersonation start returns a JWT token

- [ ] Impersonation end creates a `FounderActionLog` entry

- [ ] Sub-agent creation promotes user to `SUB_AGENT` role

- [ ] Sub-agent can only see their assigned client IDs

- [ ] `FounderActionLog` admin shows no Add or Delete buttons

  

---

  

## HARD CONSTRAINTS

  

1. Do NOT change any existing User model fields — only ADD new role choices

2. Do NOT break any existing API endpoints or frontend pages

3. Do NOT remove any existing role choices from the User model

4. Do NOT give SUB_AGENT access to founder-only endpoints (check IsFounder vs IsFounderOrAgent)

5. FounderActionLog entries must NEVER be deletable — enforce in admin and remove DELETE from DRF viewset

6. The console UI must be completely inaccessible to users with non-console roles

7. Impersonation sessions must always be logged — never skip the FounderActionLog entry

8. All console routes live under `/console/*` — never mix with regular app routes

  

---

  

## URL REFERENCE (DO NOT GET WRONG)

  

```

sankalphub.in → Frontend (Next.js) — all users

app.sankalphub.in → Django/DRF Backend API — called by frontend

console.sankalphub.in → Founder Console — SUPER_OWNER + SUB_AGENT only

```