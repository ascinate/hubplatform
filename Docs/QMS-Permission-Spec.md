# QMS Permission Hierarchy — UI Spec & Data Blueprint
> **For Claude Code:** Build an interactive web page using this spec. Use the alternating section layout shown in the reference screenshot (light/white background, UI card on one side, text + bullet list on the other). Each section = one Phase Group.

---

## 🎨 Design System

### Theme
- **Background:** `#ffffff` (white), sections alternate between `#ffffff` and `#f8f9fb`
- **Accent color:** `#0ea5e9` (sky blue) for badges, icons, highlights
- **Success / Approve:** `#16a34a` green
- **Warning / Reject:** `#f59e0b` amber
- **Danger / Override:** `#dc2626` red
- **Neutral / View:** `#6b7280` gray
- **Typography:** System font stack — `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Border radius:** `8px` cards, `4px` badges
- **Shadow:** `box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`

### Layout Pattern (Mirror the screenshot exactly)
Each Phase is a **full-width section** with two columns:
- **Odd sections:** `[UI Card — left 45%]` + `[Title + bullets — right 55%]`
- **Even sections:** `[Title + bullets — left 55%]` + `[UI Card — right 45%]`
- Section padding: `80px 60px` desktop, `40px 20px` mobile
- Max content width: `1100px`, centered

### UI Card (Left/Right Panel)
- White card with light border `#e5e7eb`
- Rounded corners, subtle shadow
- Contains a **Permission Table** for that phase
- Table columns: `Stage | Brand | Factory | 3rd Party | Admin`
- Permission badges are colored pills (see Badge System below)

### Badge System
```
L4 — Full Control   → red bg    #fef2f2  text #dc2626  border #fecaca
L3 — Approve/Reject → amber bg  #fffbeb  text #d97706  border #fde68a
L2 — Submit/Notify  → blue bg   #eff6ff  text #2563eb  border #bfdbfe
L1 — View Only      → gray bg   #f9fafb  text #6b7280  border #e5e7eb
```

### Bullet Checkmark Style
Use green SVG checkmark icon (✔) before each bullet — color `#16a34a`, size `16px`

---

## 📋 Permission Levels Reference

| Code | Label | Who Has It | Meaning |
|------|-------|-----------|---------|
| **L4** | Full Control & Override | Owner / Admin only | Override any decision, authorize access, final sign-off, escalate |
| **L3** | Approve / Reject / Certify | Brand, 3rd Party, Factory (context-based) | Approve/reject milestones, certify, raise NCR, accept orders |
| **L2** | Submit / Update / Notify | Factory, Brand, 3rd Party (context-based) | Submit docs, update status, notify stakeholders, inline QC |
| **L1** | View / Track Only | Any role in observer mode | Read-only, download docs, receive notifications |

---

## 🏷 Roles

| Role Key | Display Label | Icon | Color |
|----------|--------------|------|-------|
| `brand` | Brand | 🏷 | `#f59e0b` |
| `factory` | Factory | 🏭 | `#0ea5e9` |
| `third_party` | 3rd Party | 🔬 | `#16a34a` |
| `admin` | Owner / Admin | 👑 | `#8b5cf6` |

---

## 📦 Phase & Stage Data

> **Claude Code instruction:** Render each Phase as one alternating section. Inside the UI card, render a compact table with stage rows and permission badges per role. The right (or left) panel shows the Phase title, description, and key bullet points.

---

### PHASE 01 — Pre-Production Samples & Lab Testing
**Section layout:** UI Card LEFT, Text RIGHT  
**Description:** All sample development and laboratory testing stages before production begins.  
**Key highlights:**
- Brand holds final approval authority on all samples
- 3rd Party lab certifies all compliance and test results
- Owner/Admin can override or waive any sample rejection

#### Permission Table

| Stage ID | Stage Name | Sub-label | Brand | Factory | 3rd Party | Admin |
|----------|-----------|-----------|-------|---------|-----------|-------|
| S-01 | Development Samples | Proto / Initial Dev | L3 — Approve / Reject / Comment | L2 — Submit Sample + Docs | L2 — Review & Report | L4 — Override / Final Auth |
| S-02 | Size Set Samples | Full Size Run | L3 — Approve / Reject / Grade Check | L2 — Submit Full Set | L2 — Measure & Report | L4 — Override / Final Auth |
| S-03 | Pre-Production (PP) Samples | Production-Intent Sample | L3 — Approve / Reject | L2 — Submit PP Sample | L3 — Co-Approve / Witness | L4 — Override / Escalate |
| S-04 | Lab Tests | Physical / Chemical / Safety | L3 — Approve / Raise TDR | L1 — View Results | L3 — Conduct & Certify | L4 — Override / Waiver Auth |

---

### PHASE 02 — Order Placement & Acceptance
**Section layout:** Text LEFT, UI Card RIGHT  
**Description:** From PO issuance through factory order confirmation.  
**Key highlights:**
- Brand exclusively raises and authorizes the Purchase Order
- Factory holds the right to Accept, Reject, or Negotiate
- Admin can override factory acceptance decisions

#### Permission Table

| Stage ID | Stage Name | Sub-label | Brand | Factory | 3rd Party | Admin |
|----------|-----------|-----------|-------|---------|-----------|-------|
| S-05 | PO Raised | Purchase Order Issued | L3 — Issue & Authorize PO | L1 — View & Download | L1 — View Only | L4 — Authorize / Amend PO |
| S-06 | Order Acceptance by Factory | Factory Confirmation | L2 — Notified / Acknowledge | L3 — Accept / Reject / Negotiate | L1 — View Only | L4 — Override / Escalate |

---

### PHASE 03 — Production Execution
**Section layout:** UI Card LEFT, Text RIGHT  
**Description:** All factory floor execution stages from material ordering through packing completion.  
**Key highlights:**
- Factory drives and updates all production stages
- 3rd Party conducts inline QC audits at sewing and packing
- Brand receives automated notifications at key milestones
- Admin tracks all stages with override capability

#### Permission Table

| Stage ID | Stage Name | Sub-label | Brand | Factory | 3rd Party | Admin |
|----------|-----------|-----------|-------|---------|-----------|-------|
| P-01 | Material Ordered | Fabric / Trim PO | L2 — Notified | L3 — Create & Confirm Order | L1 — View Only | L4 — Track / Override |
| P-02 | Material In Transit | Supplier → Factory | L1 — View Status | L3 — Update ETA / Tracking | L1 — View Only | L4 — Track / Alert |
| P-03 | Material In Factory | Received & Checked | L2 — Notified | L3 — GRN + QC Check | L2 — Fabric Inspection | L4 — Track / Override |
| P-04 | Cutting Started | Cut Order Released | L2 — Notified | L3 — Update Status | L2 — Inline Monitor | L4 — Track / Override |
| P-05 | Sewing / Stitching Started | Line Loading | L2 — Notified | L3 — Update Status + Output | L2 — Inline QC Audit | L4 — Track / Override |
| P-06 | Assembly Started | Sub-Assembly / Embroidery / Print | L2 — Notified | L3 — Update Status | L2 — Mid-Line Check | L4 — Track / Override |
| P-07 | Packing Started | Folding / Poly / Carton | L2 — Notified | L3 — Update + Pack List | L2 — Carton / Packing Audit | L4 — Track / Override |

---

### PHASE 04 — Final Inspection & Shipment
**Section layout:** Text LEFT, UI Card RIGHT  
**Description:** From inspection request through in-transit delivery to buyer warehouse.  
**Key highlights:**
- 3rd Party must issue a Release Certificate before dispatch
- Brand approves all dispatch authorizations
- Admin can place a shipment hold at any point
- Both Sea and Air shipment modes are tracked

#### Permission Table

| Stage ID | Stage Name | Sub-label | Brand | Factory | 3rd Party | Admin |
|----------|-----------|-----------|-------|---------|-----------|-------|
| S-07 | Ready for Inspection | Final Inspection Request | L2 — Notified + Book Date | L3 — Trigger Inspection Request | L3 — Schedule & Confirm Date | L4 — Authorize / Reassign |
| S-08 | Ready for Dispatch | Post-Inspection Pass | L3 — Approve Dispatch | L2 — Notify + Prepare Docs | L3 — Issue Release Certificate | L4 — Authorize / Hold |
| S-09 | Dispatched | Ex-Factory Gate | L2 — Notified | L3 — Upload Dispatch Docs | L2 — Verify Dispatch | L4 — Track |
| S-10a | In Transit — By Sea | FCL / LCL | L2 — Track Vessel / ETA | L2 — Share BL / Docs | L1 — View Only | L4 — Track / Alert |
| S-10b | In Transit — By Air | AWB | L2 — Track AWB / ETA | L2 — Share AWB / Docs | L1 — View Only | L4 — Track / Alert |

---

### PHASE 05 — Warehouse QC & Post-Delivery Actions
**Section layout:** UI Card LEFT, Text RIGHT  
**Description:** Destination quality control, complaint handling, and financial claims resolution.  
**Key highlights:**
- Brand leads all warehouse findings and NCR raising
- Factory must respond with Corrective Action Reports (CAR)
- Admin holds final arbitration authority on all claims
- 3rd Party provides independent technical assessment for disputes

#### Permission Table

| Stage ID | Stage Name | Sub-label | Brand | Factory | 3rd Party | Admin |
|----------|-----------|-----------|-------|---------|-----------|-------|
| W-01 | Warehouse Inspections | Receiving QC Check | L3 — Review Report / Decision | L1 — Notified Only | L3 — Conduct & Report | L4 — Authorize / Override |
| W-02 | Finding in Warehouse | Defect / Non-Conformance | L3 — Raise NCR / Decision | L2 — Respond / Submit CAR | L3 — Document & Report | L4 — Resolve / Escalate |
| W-03 | Complaints | Consumer / Retail Feedback | L3 — Raise & Manage | L3 — Respond + Root Cause | L2 — Technical Assessment | L4 — Arbitrate / Close |
| W-04 | Claims | Financial / Return Claim | L3 — Raise & Submit Claim | L3 — Dispute / Counter | L2 — Provide Evidence | L4 — Final Decision / Close |

---

## 🧩 Interactive Features (Claude Code Build Instructions)

### 1. Role Filter Bar
Add a sticky top bar with 4 role toggle buttons:
```
[ 🏷 Brand ] [ 🏭 Factory ] [ 🔬 3rd Party ] [ 👑 Admin ]
```
- Clicking a role highlights that column across all tables
- Default: all active

### 2. Permission Level Filter
Dropdown or toggle row:
```
Show: [ All ] [ L4 Only ] [ L3 Only ] [ L2 Only ] [ L1 Only ]
```

### 3. Editable Permissions (Admin Mode)
- Add a toggle: `[ Edit Mode OFF / ON ]`
- When ON: each permission badge becomes a `<select>` dropdown with options L1/L2/L3/L4
- Changes highlight in yellow until saved
- Save button: `POST /api/permissions` (or `localStorage` for prototype)

### 4. Stage Status Indicator
Each stage row has a status dot:
```
⚪ Pending  🟡 In Progress  🟢 Completed  🔴 On Hold
```
Factory/Admin can update the status per order.

### 5. Hover Tooltip
On hover over any permission badge, show a tooltip:
```
L3 — Approve / Reject
Can approve or reject this milestone.
Required before proceeding to next stage.
```

### 6. Search
Top-right search input: filters stage rows by name in real-time.

---

## 📐 Component Naming (for React / Vue)

```
<QMSPage>
  <HeroHeader />                    // Title + subtitle
  <RoleFilterBar />                 // Sticky role toggles
  <PhaseSection phase={data}>       // One section per phase (alternating layout)
    <UICard>
      <PermissionTable />           // Stage rows + badges
    </UICard>
    <PhaseDetails>                  // Title + description + bullets
      <FeatureBullet />
    </PhaseDetails>
  </PhaseSection>
  <PermissionLegend />              // L1–L4 definition cards at bottom
  <Footer />
</QMSPage>
```

---

## 🗂 File Structure Suggestion (Claude Code)

```
/qms-permissions
  index.html              ← or App.jsx
  /components
    PhaseSection.jsx
    PermissionTable.jsx
    PermissionBadge.jsx
    RoleFilterBar.jsx
    FeatureBullet.jsx
    PermissionLegend.jsx
  /data
    permissions.js        ← All phase/stage/permission data from this file
  /styles
    theme.css             ← Design tokens
```

---

## ✅ Acceptance Criteria

- [ ] All 5 phases rendered as alternating sections
- [ ] All 21 stages (S-01 to S-10b, P-01 to P-07, W-01 to W-04) visible
- [ ] 4 role columns with colored badges for each stage
- [ ] Light white/gray theme (NO dark backgrounds)
- [ ] Role filter bar working
- [ ] Responsive on mobile (table scrolls horizontally)
- [ ] Permission Legend at bottom
- [ ] Page title: "QMS Approval Hierarchy — SankalpHub"
