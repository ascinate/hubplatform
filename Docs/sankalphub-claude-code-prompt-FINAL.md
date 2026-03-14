# SankalpHub — Mobile Browser Fix
# Paste this entire prompt into Claude Code

---

## YOUR MISSION

Make SankalpHub feel like a native mobile app when opened on a phone browser (iOS Safari / Android Chrome).
Fix 4 specific broken screens first (from screenshots), then apply the mobile pattern globally.

**Desktop layout must remain 100% unchanged.**
All mobile fixes use base Tailwind classes. Desktop is restored with `lg:` prefix.

---

## STEP 0 — READ FIRST, THEN ACT

Before writing a single line of code, do this:

```
1. List the full frontend/ directory tree (2 levels deep)
2. Read: app/layout.tsx
3. Read: the main sidebar/navigation component
4. Read: tailwind.config.js (or tailwind.config.ts)
5. Read: app/globals.css
6. Read: the orders form component (wherever /orders/new renders its form)
7. Read: app/settings/page.tsx (or the settings component)
```

Only after reading these 7 files, begin the changes below.

---

## STEP 1 — GLOBALS (touch once, never again)

### 1a. tailwind.config.js — add scrollbar-none plugin

Find the plugins array (or create it). Add:

```js
function({ addUtilities }) {
  addUtilities({
    '.scrollbar-none': {
      '-ms-overflow-style': 'none',
      'scrollbar-width': 'none',
      '&::-webkit-scrollbar': { display: 'none' },
    },
  })
}
```

Also in `theme.extend.screens`, add if not present:
```js
'xs': '375px',
```

### 1b. app/layout.tsx — viewport meta

In the exported `metadata` object, set:
```ts
viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
```

### 1c. app/globals.css — add at the TOP

```css
/* ── Mobile Base ── */
html, body {
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

/* iOS momentum scroll */
.scroll-touch { -webkit-overflow-scrolling: touch; }

/* CRITICAL: Prevent iOS zoom on input focus */
@media (max-width: 1023px) {
  input, select, textarea { font-size: 16px !important; }
}

/* Safe area helpers */
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
.pt-safe { padding-top: env(safe-area-inset-top); }
```

---

## STEP 2 — BOTTOM TAB BAR

Check if a bottom tab bar component already exists.
- If YES → update it to match the spec below.
- If NO → create `components/layout/BottomTabBar.tsx`.

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Package, ClipboardCheck, BarChart2, Menu, X, Settings, Building2, Factory } from "lucide-react";

const TABS = [
  { label: "Home",      href: "/dashboard",  Icon: LayoutDashboard },
  { label: "Orders",    href: "/orders",      Icon: Package },
  { label: "Quality",   href: "/quality",     Icon: ClipboardCheck },
  { label: "Analytics", href: "/analytics",   Icon: BarChart2 },
  { label: "More",      href: null,           Icon: Menu },
];

const MORE = [
  { label: "Factories",  href: "/factories",  Icon: Building2 },
  { label: "Production", href: "/production", Icon: Factory },
  { label: "Settings",   href: "/settings",   Icon: Settings },
];

export function BottomTabBar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* More drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-[24px] pb-safe" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <span className="text-[15px] font-bold">More</span>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {MORE.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 active:bg-gray-50">
                <div className="w-10 h-10 rounded-[12px] bg-gray-100 flex items-center justify-center">
                  <item.Icon className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-[15px] font-medium text-gray-800">{item.label}</span>
                <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* Tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-white border-t border-gray-200 pb-safe">
        <div className="flex h-[49px]">
          {TABS.map(({ label, href, Icon }) => {
            const active = href ? path.startsWith(href) : open;
            return (
              <button key={label}
                onClick={() => href ? (window.location.href = href) : setOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-[3px] relative">
                {active && <span className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[#C9A96E] rounded-b-full" />}
                <Icon className={`w-[22px] h-[22px] ${active ? "text-[#C9A96E]" : "text-gray-400"}`} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${active ? "text-[#C9A96E]" : "text-gray-400"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
```

Then in `app/layout.tsx`:
1. Import `BottomTabBar`
2. Render `<BottomTabBar />` just before `</body>`
3. Find the existing desktop sidebar and confirm it has `hidden lg:flex` or `hidden lg:block`
4. Wrap the main content area so it has `pb-[calc(49px+env(safe-area-inset-bottom))] lg:pb-0`

---

## STEP 3 — SHARED UI COMPONENTS

Create these files. If any already exist, update them.

### `components/ui/SegmentTabs.tsx`
```tsx
"use client";
interface Tab { label: string; value: string; count?: number; }
export function SegmentTabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (v: string) => void }) {
  return (
    <div className="flex overflow-x-auto scrollbar-none bg-white border-b border-gray-100 sticky top-[52px] z-30">
      {tabs.map(t => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={`flex-shrink-0 h-[44px] px-5 relative flex items-center gap-1.5 text-[14px] font-medium whitespace-nowrap transition-colors ${active === t.value ? "text-[#C9A96E]" : "text-gray-400"}`}>
          {t.label}
          {t.count !== undefined && (
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${active === t.value ? "bg-[#FDF3DC] text-[#C9A96E]" : "bg-gray-100 text-gray-400"}`}>{t.count}</span>
          )}
          {active === t.value && <span className="absolute bottom-0 inset-x-3 h-[2px] bg-[#C9A96E] rounded-t-full" />}
        </button>
      ))}
    </div>
  );
}
```

### `components/ui/StatusPill.tsx`
Check if this already exists. If YES, just add any missing statuses to it.
If NO, create:
```tsx
const STYLES: Record<string, string> = {
  PASS:           "border-green-400 text-green-600 bg-green-50",
  FAIL:           "border-red-400 text-red-600 bg-red-50",
  PENDING:        "border-amber-400 text-amber-600 bg-amber-50",
  SCHEDULED:      "border-blue-400 text-blue-600 bg-blue-50",
  CONFIRMED:      "border-indigo-400 text-indigo-600 bg-indigo-50",
  IN_PROGRESS:    "border-violet-400 text-violet-600 bg-violet-50",
  SUBMITTED:      "border-teal-400 text-teal-600 bg-teal-50",
  APPROVED:       "border-emerald-400 text-emerald-600 bg-emerald-50",
  DRAFT:          "border-gray-300 text-gray-500 bg-gray-50",
  CANCELLED:      "border-red-300 text-red-400 bg-red-50",
  REPORT_PENDING: "border-orange-400 text-orange-600 bg-orange-50",
};
export function StatusPill({ status }: { status: string }) {
  const s = STYLES[status?.toUpperCase()] ?? STYLES.DRAFT;
  return (
    <span className={`inline-flex items-center px-2 py-[3px] rounded-full border text-[11px] font-semibold whitespace-nowrap ${s}`}>
      {status}
    </span>
  );
}
```

### `components/ui/MobileFormField.tsx`
```tsx
export function MobileFormField({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export const mobileInputCls = "w-full h-[52px] px-4 bg-[#F5F5F5] rounded-[12px] border-none outline-none text-[16px] text-gray-800 placeholder:text-gray-400 appearance-none";
export const mobileTextareaCls = "w-full px-4 py-3 bg-[#F5F5F5] rounded-[12px] border-none outline-none text-[16px] text-gray-800 placeholder:text-gray-400 resize-none min-h-[100px]";
```

### `components/ui/SectionDivider.tsx`
```tsx
export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="px-4 py-[6px] bg-[#F5F5F5] border-y border-[#EBEBEB]">
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.6px]">{label}</span>
    </div>
  );
}
```

---

## STEP 4 — FIX THE 4 BROKEN SCREENS (FROM SCREENSHOTS)

### FIX A — Order Form  (`/orders/new` + `/orders/[id]/edit`)

The form has a `grid-cols-2` layout that causes text truncation on mobile.

**Find** the order creation/edit form component. Look for the JSX grid containing:
Order No., Product Name, Color, Gender/Category, Factory, Quantity, Order Image, Order Status, Description.

**Make these exact changes:**

1. Change outer grid:
   - BEFORE: `grid grid-cols-2 gap-4` (or similar 2-col)  
   - AFTER: `flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6`

2. Order Image upload block → move to be the FIRST element, add `lg:col-span-2`

3. Fix ALL placeholder/default text (these were truncated due to narrow columns):
   - Order No. → `placeholder="e.g., PO_TSHIRT_001"`
   - Product Name → `placeholder="e.g., Cotton T-Shirt"`
   - Color → `placeholder="e.g., Black, Red, Navy"`
   - Gender/Category select → first option: `Select Gender / Category`
   - Factory select → first option: `Select Factory`

4. All inputs + selects: add `text-[16px] lg:text-sm` (prevents iOS zoom)

5. Description textarea → add `lg:col-span-2` (full width on desktop)

6. Submit/Cancel buttons row:
   - AFTER: `flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-100`
   - Each button: `w-full sm:w-auto h-[44px] px-6`

---

### FIX B — Settings Tabs  (`/settings`)

The 3-tab bar (`Company Profile | Users & Roles | Workflow Templates`) overflows on mobile.

**Find** the Settings tab navigation. Apply:

```tsx
// Container:
className="flex overflow-x-auto scrollbar-none bg-white border-b border-gray-100 sticky top-[52px] z-30"

// Each tab button — ADD these two classes:
"flex-shrink-0"   // ← prevents squishing
"whitespace-nowrap" // ← prevents text wrap
```

Active tab indicator: `<span className="absolute bottom-0 inset-x-2 h-[2px] bg-[#C9A96E] rounded-t-full" />`

---

### FIX C — Users & Roles — Role Cards + Level Cards

**Problem 1:** Role cards (Brand, 3rd Party, etc.) are in a horizontal row and bleed off screen.

**Find** the role selection cards container. Change:
- Container: `flex flex-col gap-3 px-4` (vertical stack, NOT horizontal)
- Each card: `w-full text-left rounded-[16px] p-4 border-2`
- Selected state: `border-[#C9A96E] bg-[#FDFAF4]`
- Unselected: `border-gray-100 bg-white`
- Add a checkmark icon on the right when selected

**Problem 2:** L4/L3 access level stat cards overflow to the right.

**Find** the L4/L3/L2/L1 stats section in the Access Summary. Change:
- Container: `grid grid-cols-2 gap-3` (2×2 grid)
- Remove any fixed `w-[...]` pixel widths from individual cards
- Each card: full width inside its grid cell

---

### FIX D — Workflow Templates — Department List

The department rows have no right-side action affordance (no chevron, no count).

**Find** the department list rows in the Workflow Templates tab.

Change each row to this layout:
```tsx
<button className="w-full flex items-center gap-3 px-4 py-[14px] border-b border-gray-50 last:border-0 text-left active:bg-gray-50">
  {/* Left: name + count */}
  <div className="flex-1 min-w-0">
    <p className="text-[15px] font-semibold text-gray-900">{dept.name}</p>
    <p className="text-[12px] text-gray-400 mt-[2px]">{dept.templateCount} templates</p>
  </div>
  {/* Right: code badge + chevron */}
  <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-[3px] rounded-[6px] flex-shrink-0">
    {dept.code.length > 9 ? dept.code.slice(0, 9) + "…" : dept.code}
  </span>
  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
</button>
```

Wrap the entire list in:
```tsx
<div className="mx-4 mt-4 bg-white rounded-[16px] border border-gray-100 overflow-hidden">
```

---

## STEP 5 — GLOBAL PATTERNS (apply to ALL remaining pages)

After fixing the 4 screens above, apply these patterns everywhere else:

### Tables → Mobile Cards

For every `<table>` in the app:

```tsx
{/* Keep table for desktop */}
<div className="hidden lg:block">
  <table>...</table>
</div>

{/* Mobile card list */}
<div className="lg:hidden divide-y divide-gray-50">
  {items.map(item => (
    <div key={item.id} className="flex items-center gap-3 px-4 py-[14px] bg-white active:bg-gray-50" onClick={() => router.push(...)}>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-gray-900 truncate">{item.primaryField}</p>
        <p className="text-[12px] text-gray-400 mt-[2px] truncate">{item.secondaryField}</p>
      </div>
      <StatusPill status={item.status} />
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </div>
  ))}
</div>
```

### Modals → Bottom Sheet on Mobile

Every modal dialog: change positioning to slide up from bottom on mobile:

```tsx
// Overlay
<div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
  <div className="absolute inset-0 bg-black/50" onClick={onClose} />
  
  {/* Modal panel */}
  <div className="relative z-10 bg-white w-full lg:max-w-lg rounded-t-[24px] lg:rounded-[20px] max-h-[92vh] overflow-y-auto pb-[calc(16px+env(safe-area-inset-bottom))] lg:pb-6">
    
    {/* Drag handle — mobile only */}
    <div className="flex justify-center pt-3 pb-1 lg:hidden">
      <div className="w-10 h-1 rounded-full bg-gray-200" />
    </div>
    
    {/* Header */}
    <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-gray-100">
      <h2 className="text-[17px] font-bold text-gray-900">{title}</h2>
      <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
        <X className="w-4 h-4 text-gray-600" />
      </button>
    </div>
    
    {/* Content */}
    <div className="px-4 lg:px-6 py-4">{children}</div>
  </div>
</div>
```

### Stat Cards Grid

Every dashboard stat card grid:
```tsx
className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 px-4 lg:px-0"
```

### Page Containers

Every page's outermost wrapper:
```tsx
className="w-full px-4 lg:px-6 py-4 lg:py-8 pb-[83px] lg:pb-8"
```

### Page Header + CTA Button

Every page title + action button row:
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
  <h1 className="text-[20px] lg:text-2xl font-bold text-gray-900">{title}</h1>
  <button className="w-full sm:w-auto flex items-center justify-center gap-2 h-[44px] px-5 bg-[#C9A96E] text-white rounded-[12px] text-[14px] font-semibold">
    {actionLabel}
  </button>
</div>
```

---

## STEP 6 — FINAL CHECKS

Run these verifications before finishing:

```bash
# 1. Check for leftover fixed-width elements on mobile
grep -r "w-\[" components/ app/ --include="*.tsx" | grep -v "lg:w-\[" | grep -v "node_modules"

# 2. Check for grids that may still be 2-col on mobile forms
grep -rn "grid-cols-2" app/ --include="*.tsx" | grep -v "lg:grid-cols-2" | grep -v "sm:grid-cols-2"

# 3. Ensure no TypeScript errors
npx tsc --noEmit

# 4. Check overflow-x-auto is on tab containers
grep -rn "overflow-x-auto" components/ --include="*.tsx"
```

**Manual visual check list:**
- [ ] Orders form: all fields single column, no placeholder truncation
- [ ] Settings: 3rd tab reachable by scrolling
- [ ] Role cards: stack vertically, no bleeding off right
- [ ] L4/L3 cards: both visible side by side (2-col grid)
- [ ] Department rows: chevron visible on right
- [ ] Bottom tab bar: shows on mobile, hidden on desktop
- [ ] Desktop sidebar: still visible on lg: screens
- [ ] All modals: slide up from bottom on mobile
- [ ] No content hidden behind bottom tab bar (check bottom padding)

---

## HARD CONSTRAINTS

1. NO new npm packages
2. NO backend / Django / API changes
3. Desktop layout identical to before — zero visual changes at `lg:` breakpoint
4. Brand colors: Gold = `#C9A96E` · Navy = `#0D1420` · Background = `#F7F8FA`
5. The New Inspection modal is ALREADY CORRECT — do not touch it
6. If a component already exists, UPDATE it. Do not create duplicates.
