# SankalpHub — Mobile Responsiveness Master Plan
**Platform:** SankalpHub.in | **Stack:** Next.js + Tailwind CSS
**Goal:** Pixel-perfect layout on every screen from 320px to 1920px+

---

## PART 1 — DEVICE SCREEN REFERENCE MAP

### 1.1 iPhone Screens (iOS Safari)

| Device | Screen Size | Resolution | CSS Viewport (Portrait) | CSS Viewport (Landscape) | Notes |
|--------|------------|------------|------------------------|--------------------------|-------|
| iPhone SE (3rd gen) | 4.7" | 750×1334 | 375×667 | 667×375 | Smallest modern iPhone |
| iPhone 13 mini | 5.4" | 1080×2340 | 375×812 | 812×375 | Very compact |
| iPhone 14 / 15 | 6.1" | 1170×2532 | 390×844 | 844×390 | **Most common** |
| iPhone 14 Plus / 15 Plus | 6.7" | 1284×2778 | 428×926 | 926×428 | Large hand usage |
| iPhone 14 Pro | 6.1" | 1179×2556 | 393×852 | 852×393 | Dynamic Island |
| iPhone 14 Pro Max | 6.7" | 1290×2796 | 430×932 | 932×430 | **Most common large** |
| iPhone 15 Pro | 6.1" | 1179×2556 | 393×852 | 852×393 | |
| iPhone 15 Pro Max | 6.7" | 1290×2796 | 430×932 | 932×430 | |
| iPhone 16 Pro Max | 6.9" | 1320×2868 | 440×956 | 956×440 | Largest iPhone |

### 1.2 Android Phones

| Device | Screen Size | CSS Viewport (Portrait) | Category |
|--------|------------|------------------------|----------|
| Samsung Galaxy A14 | 6.6" | 360×800 | Budget / Very Common |
| Samsung Galaxy A54 | 6.4" | 360×780 | Mid-range |
| Samsung Galaxy S24 | 6.2" | 360×780 | Flagship |
| Samsung Galaxy S24+ | 6.7" | 412×915 | Large flagship |
| Samsung Galaxy S24 Ultra | 6.8" | 412×915 | Ultra large |
| Google Pixel 8 | 6.2" | 393×851 | Stock Android |
| Google Pixel 8 Pro | 6.7" | 412×915 | Stock large |
| OnePlus 12 | 6.82" | 412×919 | Popular in India |
| Xiaomi 14 | 6.36" | 393×851 | Popular in India |
| Redmi Note 13 Pro | 6.67" | 393×873 | Very common India |
| Vivo V30 | 6.78" | 412×915 | Popular India |
| Realme 12 Pro | 6.7" | 393×873 | Popular India |

### 1.3 Tablets

| Device | Screen Size | CSS Viewport (Portrait) | CSS Viewport (Landscape) |
|--------|------------|------------------------|--------------------------|
| iPad Mini 6th gen | 8.3" | 744×1133 | 1133×744 |
| iPad Air 5th gen | 10.9" | 820×1180 | 1180×820 |
| iPad 10th gen | 10.9" | 820×1180 | 1180×820 |
| iPad Pro 11" | 11" | 834×1194 | 1194×834 |
| iPad Pro 12.9" | 12.9" | 1024×1366 | 1366×1024 |
| Samsung Galaxy Tab A8 | 10.5" | 800×1280 | 1280×800 |
| Samsung Galaxy Tab S9 | 11" | 834×1194 | 1194×834 |

### 1.4 Desktops & Laptops

| Category | CSS Viewport Width | Common Devices |
|----------|-------------------|----------------|
| Small laptop | 1024px–1279px | MacBook Air 11", older laptops |
| Medium laptop | 1280px–1439px | MacBook Pro 13", most Windows 13" |
| Standard desktop | 1440px | MacBook Pro 14"/16", iMac default |
| Large desktop | 1536px–1920px | Full HD monitors, 27" iMac |
| Ultra-wide | 2560px+ | 4K, ultrawide monitors |

---

## PART 2 — TAILWIND BREAKPOINT STRATEGY FOR SANKALPHUB

### 2.1 Current Tailwind Default Breakpoints (what you have now)

```
sm:   640px+
md:   768px+
lg:   1024px+
xl:   1280px+
2xl:  1536px+
```

### 2.2 RECOMMENDED — Extend tailwind.config.js for SankalpHub

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      // --- MOBILE ---
      'xs':  '375px',   // iPhone SE, small Android — CUSTOM ADD
      'sm':  '390px',   // iPhone 14/15 (6.1") — override
      'md':  '428px',   // iPhone Plus / large Android (6.7")
      // --- TABLET ---
      'lg':  '768px',   // iPad portrait, large Android landscape
      'xl':  '1024px',  // iPad landscape, small laptop
      // --- DESKTOP ---
      '2xl': '1280px',  // Standard laptop
      '3xl': '1440px',  // MacBook Pro, standard desktop — CUSTOM ADD
      '4xl': '1920px',  // Full HD monitor — CUSTOM ADD
    }
  }
}
```

### 2.3 Mobile-First Design Rule

```
Base styles    = Mobile (320px–389px) — write these FIRST, no prefix
xs:            = 375px+ — iPhone SE range
sm:            = 390px+ — iPhone 14/15 range (6.1")
md:            = 428px+ — iPhone Plus / large Android (6.7")
lg:            = 768px+ — Tablet portrait
xl:            = 1024px+ — Tablet landscape / small laptop
2xl:           = 1280px+ — Standard laptop
3xl:           = 1440px+ — Desktop
```

---

## PART 3 — SANKALPHUB UI COMPONENT BREAKDOWN

Every component in SankalpHub needs to be fixed in this order:

### 3.1 LAYOUT SHELL

#### Sidebar Navigation
```
Mobile (base–lg):    HIDDEN — replaced by bottom tab bar
lg+:                 Visible left sidebar, 240px wide
xl+:                 Sidebar 260px wide
```

**Fix:**
```tsx
// Sidebar
<aside className="hidden lg:flex lg:w-60 xl:w-64 ...">

// Bottom Tab Bar — MOBILE ONLY
<nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t
                flex lg:hidden items-center justify-around h-16 px-2">
```

**Bottom Tab Bar items (max 5):**
1. Dashboard (grid icon)
2. Orders (box icon)
3. Inspections (checkmark icon)
4. Production (factory icon)
5. Menu → (hamburger → slide-up drawer for the rest)

#### Top Header / Navbar
```
Mobile:    Logo left + Notification bell + Avatar right, no page title
lg+:       Full header with page title, breadcrumbs, search
```

**Fix:**
```tsx
<header className="h-14 lg:h-16 px-4 lg:px-6 flex items-center justify-between">
  {/* Mobile: hamburger only */}
  <button className="lg:hidden ...">☰</button>
  {/* Logo — mobile centered or left */}
  <SankalpHubLogo className="h-7 lg:h-8" />
  {/* Right actions */}
  <div className="flex items-center gap-2 lg:gap-4">
    <NotificationBell />
    <Avatar />
  </div>
</header>
```

#### Page Container / Content Area
```tsx
// WRONG (what you likely have now):
<div className="container mx-auto px-6">

// CORRECT:
<div className="w-full max-w-screen-2xl mx-auto
                px-4 sm:px-5 md:px-6 lg:px-8
                py-4 lg:py-6">
```

---

### 3.2 STAT CARDS (Dashboard)

**Current problem:** Cards in a row overflow on mobile.

```
Mobile (base):   1 column, full width — stack vertically
sm:              2 columns
lg:              4 columns
xl:              5 columns (if 5 cards)
```

**Fix:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5
                gap-3 sm:gap-4 lg:gap-5">
  <StatCard ... />
</div>
```

**Each StatCard:**
```tsx
<div className="bg-white rounded-xl p-4 lg:p-5 border border-gray-100 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
    </div>
    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl ...">
      {icon}
    </div>
  </div>
</div>
```

---

### 3.3 DATA TABLES (Orders, Factories, Inspections, etc.)

**Current problem:** Tables overflow horizontally on mobile, columns too wide.

**Strategy — 3-tier approach:**

#### Tier 1: Mobile (base–md) — Card List view
Hide the table entirely. Show each row as a card:

```tsx
{/* TABLE — desktop only */}
<div className="hidden lg:block overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-gray-100">
        <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
          ORDER NO.
        </th>
        {/* ... */}
      </tr>
    </thead>
    <tbody>
      {orders.map(order => <OrderTableRow key={order.id} order={order} />)}
    </tbody>
  </table>
</div>

{/* CARD LIST — mobile only */}
<div className="lg:hidden space-y-3">
  {orders.map(order => <OrderMobileCard key={order.id} order={order} />)}
</div>
```

#### OrderMobileCard component:
```tsx
function OrderMobileCard({ order }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      {/* Top row: PO number + Status badge */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-blue-600">{order.po_number}</p>
          <p className="text-xs text-gray-500 mt-0.5">{order.product}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Middle: key info grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs text-gray-400">Factory</p>
          <p className="text-sm font-medium truncate">{order.factory}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Delivery</p>
          <p className="text-sm font-medium">{order.delivery_date}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Qty</p>
          <p className="text-sm font-medium">{order.qty.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Progress</p>
          <p className="text-sm font-medium">{order.progress}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-3">
        <div
          className="h-1.5 bg-blue-500 rounded-full"
          style={{ width: `${order.progress}%` }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
        <button className="flex-1 text-xs text-gray-600 py-1.5 rounded-lg bg-gray-50
                           hover:bg-gray-100 flex items-center justify-center gap-1">
          👁 View
        </button>
        <button className="flex-1 text-xs text-gray-600 py-1.5 rounded-lg bg-gray-50
                           hover:bg-gray-100 flex items-center justify-center gap-1">
          ✏️ Edit
        </button>
        <button className="flex-1 text-xs text-red-500 py-1.5 rounded-lg bg-red-50
                           hover:bg-red-100 flex items-center justify-center gap-1">
          🗑 Delete
        </button>
      </div>
    </div>
  );
}
```

#### Tier 2: Tablet (lg–xl) — Scrollable table with fewer columns
```tsx
// Show only essential columns on tablet, hide less important ones
<th className="hidden xl:table-cell">AGENT/VENDOR</th>
<td className="hidden xl:table-cell">{order.vendor}</td>
```

#### Tier 3: Desktop (xl+) — Full table
All columns visible.

---

### 3.4 FORMS (New Order, Add Factory, Inspection form, etc.)

**Current problem:** Form fields too narrow or too wide on mobile.

```tsx
{/* Form container */}
<div className="w-full max-w-2xl mx-auto">

  {/* Single column on mobile, 2 columns on tablet+ */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">

    {/* Full width fields */}
    <div className="col-span-1 sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Product Name
      </label>
      <input className="w-full h-11 px-4 border border-gray-200 rounded-xl
                        text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
    </div>

    {/* Half width fields (on sm+) */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Style Number
      </label>
      <input className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm" />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Season
      </label>
      <select className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm" />
    </div>

  </div>

  {/* Form action buttons */}
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-6
                  border-t border-gray-100">
    <button className="w-full sm:w-auto px-6 py-2.5 text-sm ...">Cancel</button>
    <button className="w-full sm:w-auto px-6 py-2.5 text-sm ...">Save Order</button>
  </div>
</div>
```

---

### 3.5 MODAL / DIALOGS

**Current problem:** Modals full-screen or misaligned on mobile.

```tsx
{/* Backdrop */}
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">

  {/* Modal panel */}
  <div className="
    w-full sm:max-w-lg
    bg-white
    rounded-t-2xl sm:rounded-2xl     ← slide up on mobile, centered on desktop
    shadow-2xl
    max-h-[90vh] overflow-y-auto     ← scrollable on mobile
    p-5 sm:p-6
  ">
```

**Mobile → Sheet behavior (slides up from bottom)**
**Desktop → Centered dialog**

---

### 3.6 PAGE HEADERS (Title + Actions)

```tsx
{/* WRONG — overflows on mobile */}
<div className="flex items-center justify-between">
  <h1>My Orders</h1>
  <button>+ New Order</button>
</div>

{/* CORRECT */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
  <div>
    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Orders</h1>
    <p className="text-sm text-gray-500 mt-0.5">Manage your production orders</p>
  </div>
  <button className="w-full sm:w-auto flex items-center justify-center gap-2
                     px-4 py-2.5 bg-[#C9A96E] text-white rounded-xl text-sm font-medium">
    + New Order
  </button>
</div>
```

---

### 3.7 SEARCH + FILTER BAR

```tsx
{/* Stack on mobile, row on tablet+ */}
<div className="flex flex-col sm:flex-row gap-3 mb-4">

  {/* Search — full width always */}
  <div className="relative flex-1">
    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      className="w-full h-10 pl-9 pr-4 border border-gray-200 rounded-xl text-sm"
      placeholder="Order No., Supplier, Factory"
    />
  </div>

  {/* Filter button */}
  <button className="h-10 px-4 border border-gray-200 rounded-xl text-sm
                     flex items-center gap-2 whitespace-nowrap">
    <FilterIcon className="w-4 h-4" /> Filter
  </button>
</div>
```

---

### 3.8 TYPOGRAPHY SCALE

| Use | Mobile | Tablet | Desktop |
|-----|--------|--------|---------|
| Page title | `text-xl` (20px) | `text-2xl` (24px) | `text-3xl` (30px) |
| Section heading | `text-base` (16px) | `text-lg` (18px) | `text-xl` (20px) |
| Card label | `text-xs` (12px) | `text-sm` (14px) | `text-sm` (14px) |
| Card value | `text-xl` (20px) | `text-2xl` (24px) | `text-2xl` (24px) |
| Table header | `text-xs` | `text-xs` | `text-xs` |
| Table cell | `text-sm` | `text-sm` | `text-sm` |
| Body text | `text-sm` | `text-sm` | `text-sm` |
| Labels / captions | `text-xs` | `text-xs` | `text-xs` |

```tsx
// Pattern:
<h1 className="text-xl lg:text-2xl xl:text-3xl font-bold">
<h2 className="text-base lg:text-lg xl:text-xl font-semibold">
<p className="text-sm text-gray-600">
<span className="text-xs text-gray-400">
```

---

### 3.9 CHARTS (Analytics / Production)

```tsx
{/* Charts must be responsive width */}
<div className="w-full h-48 sm:h-56 lg:h-64 xl:h-72">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      {/* Hide some labels on mobile */}
      <XAxis
        tick={{ fontSize: 10 }}
        interval={window.innerWidth < 640 ? 2 : 0}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

---

### 3.10 STATUS BADGES

```tsx
// Compact on mobile
<span className="inline-flex items-center px-2 py-0.5 rounded-full
                 text-xs font-medium whitespace-nowrap
                 bg-green-100 text-green-700">
  Pending
</span>
```

---

### 3.11 ACTION ICON BUTTONS

Touch target must be minimum 44×44px on mobile:

```tsx
{/* WRONG — too small on mobile */}
<button className="p-1"><TrashIcon className="w-4 h-4" /></button>

{/* CORRECT — 44px touch target */}
<button className="w-11 h-11 flex items-center justify-center rounded-xl
                   hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
  <TrashIcon className="w-4 h-4" />
</button>
```

---

## PART 4 — PAGE-BY-PAGE FIX PLAN

### Page 1: Dashboard (`/dashboard`)

| Element | Fix |
|---------|-----|
| Stat cards row | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` |
| Charts section | `grid-cols-1 lg:grid-cols-2` |
| Recent orders table | Convert to card list on mobile |
| Notifications panel | Full width on mobile, sidebar on desktop |

---

### Page 2: My Orders (`/orders`)

| Element | Fix |
|---------|-----|
| Page header + New Order btn | Stack on mobile, row on desktop |
| Stat cards (Active/Urgent/Warning/On Track/Delivered) | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` |
| Search + Filter bar | Stack on mobile |
| Orders table | Hide on mobile → card list view |
| Action buttons (view/edit/copy/delete) | Row of icon buttons inside mobile card |

---

### Page 3: Factories (`/factories`)

| Element | Fix |
|---------|-----|
| Factory list table | Card list on mobile |
| 5 info cards per factory | `grid-cols-2 lg:grid-cols-5` |
| Add Factory form | Single column on mobile |
| City + Country fields | Side by side on `sm:grid-cols-2` |

---

### Page 4: Inspections (`/inspections`)

| Element | Fix |
|---------|-----|
| Inspection list | Card list on mobile |
| AQL table | Horizontal scroll on mobile with `overflow-x-auto` |
| Defect table | Horizontal scroll on mobile |
| Photo upload grid | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` |
| Signature area | Full width on mobile |

---

### Page 5: Production / DPR (`/production`)

| Element | Fix |
|---------|-----|
| DPR form | Single column on mobile |
| Process table (Cutting/Sewing/Assembly/Packing) | Horizontal scroll on mobile |
| Efficiency chart | Responsive container |
| Progress bars | Full width |

---

### Page 6: Analytics (`/analytics`)

| Element | Fix |
|---------|-----|
| KPI cards | `grid-cols-2 lg:grid-cols-4` |
| Charts | `grid-cols-1 lg:grid-cols-2` |
| Filter dropdowns | Full width on mobile, auto on desktop |

---

### Page 7: Settings (`/settings`)

| Element | Fix |
|---------|-----|
| Settings nav tabs | Horizontal scroll or dropdown on mobile |
| User table | Card list on mobile |
| Role permission matrix | Horizontal scroll |

---

## PART 5 — GLOBAL CSS RULES TO ADD

Add to `globals.css` or `app/layout.tsx`:

```css
/* Prevent horizontal overflow on any screen */
html, body {
  overflow-x: hidden;
  -webkit-text-size-adjust: 100%; /* Prevent iOS font size boost */
}

/* Smooth scrolling */
* {
  scroll-behavior: smooth;
  -webkit-tap-highlight-color: transparent; /* Remove tap flash on iOS */
}

/* Minimum touch target size */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Safe area insets (iPhone notch / Dynamic Island / home bar) */
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom);
}
.top-header {
  padding-top: env(safe-area-inset-top);
}
```

---

## PART 6 — VIEWPORT META TAG

In `app/layout.tsx`, ensure this is in the `<head>`:

```tsx
export const metadata = {
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
};
```

The `viewport-fit=cover` is critical for iPhone notch / Dynamic Island support.

---

## PART 7 — CLAUDE CODE PROMPT

Paste this into Claude Code to execute the full fix:

---

```
You are working on SankalpHub.in — a QMS platform built with Next.js + Tailwind CSS.

The entire frontend is NOT mobile responsive. The task is to make it fully responsive
across all screen sizes from 320px (small Android) to 1920px (desktop).

## DEVICE TARGETS
- Small mobile:   320px–374px  (budget Android)
- Standard mobile: 375px–389px (iPhone SE, small Android)
- iPhone 6.1":   390px–427px  (iPhone 14/15 — most common)
- iPhone 6.7":   428px–767px  (iPhone Plus, large Android — most common large)
- Tablet:        768px–1023px (iPad portrait, large phone landscape)
- Small laptop:  1024px–1279px
- Desktop:       1280px–1440px
- Large desktop: 1440px+

## STEP 1 — Update tailwind.config.js

Add custom breakpoints:
```js
screens: {
  'xs': '375px',
  'sm': '390px',
  'md': '428px',
  'lg': '768px',
  'xl': '1024px',
  '2xl': '1280px',
  '3xl': '1440px',
}
```

## STEP 2 — Update app/layout.tsx

Add to metadata:
```ts
viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
```

Add to globals.css:
```css
html, body { overflow-x: hidden; -webkit-text-size-adjust: 100%; }
* { -webkit-tap-highlight-color: transparent; }
```

## STEP 3 — Create Bottom Tab Navigation for mobile

Create `components/layout/BottomTabBar.tsx`:
- Fixed at bottom of screen
- Visible only on mobile (hidden lg:hidden)
- 5 tabs: Dashboard, Orders, Inspections, Production, More
- Height: 64px + env(safe-area-inset-bottom) for iPhone home bar
- Active tab highlighted with brand gold color #C9A96E
- "More" tab opens a slide-up drawer with remaining nav items

## STEP 4 — Update Sidebar

In `components/layout/Sidebar.tsx`:
- Add `hidden lg:flex` to the sidebar container
- Sidebar should be 240px on lg, 260px on xl+

## STEP 5 — Create reusable MobileCard component

Create `components/ui/MobileCard.tsx`:
A generic card wrapper for showing table rows on mobile:
- White background, rounded-xl, border, shadow-sm
- padding: p-4
- Supports: header slot (title + badge), body slot (2-col grid), footer slot (action buttons)

## STEP 6 — Fix every page — go through each file in app/ and fix:

### For EVERY page:
1. Page container: change to `w-full max-w-screen-2xl mx-auto px-4 sm:px-5 lg:px-8 py-4 lg:py-6`
2. Page header (title + action button):
   - Change to `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6`
   - Action buttons: add `w-full sm:w-auto`
3. Stat card grids: change to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
4. All data tables:
   - Wrap in `hidden lg:block overflow-x-auto`
   - Add mobile card list view below: `lg:hidden space-y-3`
   - Each mobile card shows: primary identifier, key status badge, 4 key data points in 2x2 grid, action buttons row
5. All forms:
   - Field grids: `grid grid-cols-1 sm:grid-cols-2 gap-4`
   - Full-width fields: `col-span-1 sm:col-span-2`
   - All inputs: minimum height `h-11`
   - Submit buttons row: `flex flex-col-reverse sm:flex-row sm:justify-end gap-3`
6. All modals:
   - Backdrop: `fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4`
   - Panel: `w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto`
7. Search bars: `flex flex-col sm:flex-row gap-3`
8. All icon action buttons: minimum `w-11 h-11 flex items-center justify-center`
9. Typography: add responsive sizing — `text-xl lg:text-2xl` for h1, `text-base lg:text-lg` for h2

### For specific pages:

**Dashboard:** Charts use `<ResponsiveContainer width="100%" height="100%">` and set chart wrapper to `h-48 sm:h-56 lg:h-64`

**Orders (/orders):**
- Stat cards row of 5: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Table: hidden on mobile, card list shown instead
- Mobile card shows: PO number, product, factory, date, qty, progress bar, 3 action buttons

**Factories (/factories):**
- 5 info cards per factory: `grid-cols-2 lg:grid-cols-5`
- Add Factory form: City + Country in `sm:grid-cols-2`

**Inspections:**
- AQL results table and defect table: `overflow-x-auto` wrapper
- Photo grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`

**Analytics:**
- Remove all dummy/placeholder data and show empty state instead
- KPI grid: `grid-cols-2 lg:grid-cols-4`

## STEP 7 — Typography cleanup

Replace hardcoded text sizes across all pages:
- h1 / page titles: `text-xl lg:text-2xl font-bold`
- h2 / section titles: `text-base lg:text-lg font-semibold`
- Card values (big numbers): `text-2xl sm:text-3xl font-bold`
- Body text: `text-sm`
- Labels / captions: `text-xs`
- Table headers: `text-xs font-medium uppercase tracking-wide`

## STEP 8 — Verify

After all changes:
1. Check no element has a fixed pixel width that would overflow on mobile (e.g., `w-[600px]` with no responsive override)
2. Check all tables are wrapped in `overflow-x-auto` OR have mobile card fallback
3. Check all modals have `items-end sm:items-center` pattern
4. Check bottom tab bar is present and sidebar is hidden on mobile
5. Check all forms have `w-full` on inputs and responsive grid cols

## CONSTRAINTS
- Do NOT change any backend Django/DRF code
- Do NOT change brand colors or the Sacred Orbit logo
- Do NOT add any new npm packages — use only Tailwind CSS
- Keep existing API calls and data fetching logic unchanged
- Desktop layout must remain IDENTICAL to what it is now — only mobile/tablet views change
- Brand color for active states: #C9A96E (gold)
- Use `hidden lg:block` / `lg:hidden` as the main mobile/desktop toggle breakpoint
```

---

## PART 8 — TESTING CHECKLIST

After Claude Code completes the fix, test at these exact widths in Chrome DevTools:

| Width | Represents | Check |
|-------|-----------|-------|
| 320px | Smallest Android | No overflow, text readable |
| 375px | iPhone SE | Cards stack, sidebar hidden |
| 390px | iPhone 14/15 | Bottom tab visible, table → cards |
| 428px | iPhone Plus | Extra space used well |
| 768px | iPad portrait | Sidebar appears, 2-col layout |
| 1024px | iPad landscape | Full sidebar, 3-col cards |
| 1280px | Laptop | Full desktop layout |
| 1440px | Desktop | Comfortable max-width container |

**iOS Safari specific checks:**
- [ ] No horizontal scroll on any page
- [ ] Bottom tab bar clears iPhone home bar indicator
- [ ] Modals not covered by keyboard (use `viewport-fit=cover`)
- [ ] Touch targets all ≥ 44×44px
- [ ] No text too small to read (minimum 12px)
- [ ] No input zoom on focus (ensure `font-size: 16px` on inputs — iOS zooms in if < 16px)

**Critical iOS input fix:**
```css
/* Prevent iOS zoom on input focus */
input, select, textarea {
  font-size: 16px !important; /* iOS zooms if < 16px */
}
@media (min-width: 1024px) {
  input, select, textarea {
    font-size: 14px !important; /* Reset on desktop */
  }
}
```

---

*SankalpHub.in — Mobile Responsiveness Master Plan*
*Target: All devices 320px → 1920px*
