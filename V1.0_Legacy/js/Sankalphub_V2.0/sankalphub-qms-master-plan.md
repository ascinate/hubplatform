# SankalpHub — Complete QMS Platform Master Plan
**Stack:** Django/DRF · PostgreSQL · Next.js · Hostinger VPS
**Version:** 1.0 | **Status:** Planning
**Platform:** SankalpHub.in — Production Intelligence Platform

---

## TABLE OF CONTENTS

1. [Platform Overview](#1-platform-overview)
2. [Entities — Brands, Factories, 3rd Parties](#2-entities)
3. [Users, Roles & Permissions](#3-users-roles--permissions)
4. [Product & Order Context](#4-product--order-context)
5. [Template Architecture — All 35 Templates](#5-template-architecture)
6. [Department Templates — Detailed](#6-department-templates-detailed)
7. [Approval System — Stages, Approvers, Receivers](#7-approval-system)
8. [Inspection Engine & AQL System](#8-inspection-engine--aql-system)
9. [Daily Production Report (DPR)](#9-daily-production-report-dpr)
10. [Quality System — Defects, CAPA, Audits](#10-quality-system)
11. [Supplier & Factory Scorecards](#11-supplier--factory-scorecards)
12. [Logistics & Shipment Tracking](#12-logistics--shipment-tracking)
13. [Master Workflow Template](#13-master-workflow-template)
14. [Database Schema Summary](#14-database-schema-summary)
15. [Django App Structure](#15-django-app-structure)
16. [API Endpoints](#16-api-endpoints)
17. [Next.js Frontend Structure](#17-nextjs-frontend-structure)
18. [Notification & Alert System](#18-notification--alert-system)
19. [Build Roadmap](#19-build-roadmap)

---

## 1. PLATFORM OVERVIEW

SankalpHub is a Production Intelligence Platform for garment manufacturing that manages the complete lifecycle of a product — from design intent to warehouse delivery — across multiple brands, factories, and 3rd party inspectors.

### Supported Product Categories
| Code | Category | Notes |
|------|----------|-------|
| GAR | Garments | Jackets, vests, shirts, pants, outerwear |
| GLV | Gloves | Work gloves, safety gloves, winter gloves |
| FTW | Footwear | Boots, safety shoes, sneakers |
| HDW | Headwear | Caps, beanies, helmets, hard hats |
| ACC | Accessories | Blankets, pallet covers, bags, straps |
| BAG | Bags | Duffel, backpacks, tote, tool bags |

### Product Demographics
| Field | Options |
|-------|---------|
| Gender | Male / Female / Unisex / Kids / Baby / Toddler |
| Age Group | Adult / Youth / Kids / Infant / Toddler |
| Construction Type | Woven / Knitted / Leather / Synthetic / Multi-layer / Composite |

### Core Platform Modules
| Module | Description |
|--------|-------------|
| Workflow Engine | Manages department-to-department handover |
| Template Engine | 35 dynamic templates with field builder |
| Inspection Engine | AQL-based inspections with defect tracking |
| Production Monitor | Daily Production Report (DPR) with efficiency tracking |
| Quality System | CAPA, audits, defect library, risk assessment |
| Supplier Intelligence | Scorecards, audit history, factory profiles |
| Logistics Tracker | Dispatch → container → port → warehouse |
| Master Dashboard | Full lifecycle visibility per order/style |

---

## 2. ENTITIES

### 2.1 Brands
Each brand is a client of the platform. Brand data is scoped per tenant.

| Field | Type | Notes |
|-------|------|-------|
| brand_id | UUID | Primary key |
| brand_name | VARCHAR | e.g. RefrigiWear, Carhartt |
| brand_code | VARCHAR | Short code e.g. RFW |
| country | VARCHAR | Brand's home country |
| primary_contact | VARCHAR | Brand contact name |
| contact_email | VARCHAR | |
| contact_phone | VARCHAR | |
| logo | FILE | Brand logo |
| active | BOOLEAN | |
| created_at | TIMESTAMP | |

**Brand Permissions:**
- Brands can view inspection reports for their own orders
- Brands cannot see other brand's data
- Brand users have read-only access unless granted Reviewer role

---

### 2.2 Factories
Factories are production facilities where goods are manufactured.

| Field | Type | Notes |
|-------|------|-------|
| factory_id | UUID | Primary key |
| factory_name | VARCHAR | |
| factory_code | VARCHAR | Short code |
| supplier_id | UUID | FK → Suppliers |
| city | VARCHAR | |
| country | VARCHAR | |
| address | TEXT | |
| contact_person | VARCHAR | |
| contact_email | VARCHAR | |
| contact_phone | VARCHAR | |
| certifications | JSON | ISO, WRAP, BSCI, etc. |
| audit_compliance | VARCHAR | Compliant / Non-compliant / Conditional |
| production_capacity | INTEGER | Units per month |
| total_manpower | INTEGER | Worker count |
| infrastructure | TEXT | Machines, floors, etc. |
| active | BOOLEAN | |
| created_at | TIMESTAMP | |

**Factory Info Cards (Dashboard):**
1. Certifications held
2. Audit Compliance status
3. Production Capacity (units/month)
4. Total Manpower
5. Infrastructure summary

**Factory-scoped data:**
- A factory user can only see their own factory's orders, DPR, and inspections
- Factory Manager approves at inline and packing stages
- Factory QC submits inspection records

---

### 2.3 Suppliers / Vendors
Suppliers are the business entities that own or manage factories.

| Field | Type | Notes |
|-------|------|-------|
| supplier_id | UUID | Primary key |
| supplier_name | VARCHAR | |
| supplier_code | VARCHAR | |
| country | VARCHAR | |
| type | VARCHAR | Agent / Manufacturer / Sourcing Office |
| contact_person | VARCHAR | |
| contact_email | VARCHAR | |
| contact_phone | VARCHAR | |
| active | BOOLEAN | |

---

### 2.4 Third Parties
3rd party inspectors (e.g. Bureau Veritas, Intertek, SGS, independent QA firms) who conduct inspections on behalf of brands.

| Field | Type | Notes |
|-------|------|-------|
| third_party_id | UUID | Primary key |
| company_name | VARCHAR | e.g. Bureau Veritas |
| company_code | VARCHAR | BV, ITK, SGS |
| inspector_name | VARCHAR | Individual inspector |
| email | VARCHAR | |
| phone | VARCHAR | |
| assigned_brands | JSON | Which brands they inspect for |
| assigned_factories | JSON | Which factories they visit |
| access_level | VARCHAR | Report Submit Only |
| active | BOOLEAN | |

**3rd Party Permissions:**
- Can submit inspection reports
- Cannot view production data, DPR, or costing
- Cannot approve or reject workflow stages
- Receive email notification when inspection is scheduled

---

## 3. USERS, ROLES & PERMISSIONS

### 3.1 User Model

| Field | Type | Notes |
|-------|------|-------|
| user_id | UUID | Primary key |
| name | VARCHAR | Full name |
| email | VARCHAR | Unique, login credential |
| phone | VARCHAR | |
| role | VARCHAR | FK → Role |
| entity_type | VARCHAR | Brand / Factory / Supplier / ThirdParty / Internal |
| entity_id | UUID | FK to relevant entity |
| department | VARCHAR | Which department (if internal) |
| is_active | BOOLEAN | |
| last_login | TIMESTAMP | |
| notification_prefs | JSON | Email / In-app preferences |
| created_at | TIMESTAMP | |

---

### 3.2 Role Hierarchy

```
SUPER_ADMIN
    └── ADMIN
        ├── QC_MANAGER
        │     ├── QC_INSPECTOR (Internal)
        │     └── THIRD_PARTY_INSPECTOR
        ├── PRODUCTION_MANAGER
        │     ├── FACTORY_MANAGER
        │     └── FACTORY_QC
        ├── MERCHANDISER
        ├── BRAND_REVIEWER (read-only per brand)
        └── WAREHOUSE_MANAGER
```

---

### 3.3 Full Permission Matrix

| Permission | Super Admin | Admin | QC Manager | QC Inspector | Production Mgr | Factory Mgr | Factory QC | Merchandiser | Brand Reviewer | 3rd Party | Warehouse Mgr |
|-----------|:-----------:|:-----:|:----------:|:------------:|:--------------:|:-----------:|:----------:|:------------:|:--------------:|:---------:|:-------------:|
| Create Brand | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Factory | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create User | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Orders | ✅ | ✅ | ✅ | Own only | ✅ | Own factory | Own factory | ✅ | Own brand | ❌ | ❌ |
| Create Order | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Submit Template | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | Submit only | ❌ |
| Approve Template | ✅ | ✅ | ✅ | ❌ | ✅ | Own stage | ❌ | ✅ | ❌ | ❌ | ❌ |
| Reject Template | ✅ | ✅ | ✅ | ❌ | ✅ | Own stage | ❌ | ✅ | ❌ | ❌ | ❌ |
| Submit Inspection | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Approve Inspection | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Inspection | ✅ | ✅ | ✅ | ✅ | ✅ | Own factory | Own factory | ✅ | Own brand | Own assigned | ❌ |
| Submit DPR | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View DPR | ✅ | ✅ | ✅ | ❌ | ✅ | Own factory | Own factory | ✅ | ❌ | ❌ | ❌ |
| View Costing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ✅ | ❌ | ✅ | Own factory | ❌ | ✅ | Own brand | ❌ | ❌ |
| Manage Shipment | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Warehouse Receive | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| CAPA Management | ✅ | ✅ | ✅ | ❌ | ✅ | Own factory | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supplier Scorecard | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 3.4 Department-to-Role Mapping

| Department | Primary Role | Secondary Role | Can Approve |
|-----------|-------------|---------------|------------|
| Design | Admin / Merchandiser | — | Merchandiser, Admin |
| Development | Admin / Merchandiser | — | Merchandiser, Admin |
| Sample Sourcing | Merchandiser | Admin | Admin |
| Prototype Sample | Production Manager | Factory Manager | Admin, Production Mgr |
| Costing | Merchandiser | Admin | Admin |
| Material Testing | QC Manager | QC Inspector | QC Manager |
| Final Sample | QC Manager | Merchandiser | Admin, QC Manager |
| Final Costing | Merchandiser | Admin | Admin |
| Purchase Order | Merchandiser | Admin | Admin |
| Merchandising | Merchandiser | Admin | Admin |
| Bulk Material | Merchandiser | Factory Manager | Admin |
| Tooling | Production Manager | Factory Manager | Production Mgr |
| SOP | QC Manager | Production Manager | Admin |
| IQC | QC Inspector | QC Manager | QC Manager |
| Production Planning | Production Manager | Factory Manager | Production Mgr |
| Cutting | Factory Manager | Factory QC | Factory Manager |
| Sewing | Factory Manager | Factory QC | Factory Manager |
| Assembly | Factory Manager | Factory QC | Factory Manager |
| Inline Inspection | QC Inspector / 3rd Party | QC Manager | QC Manager |
| Packing | Factory Manager | Factory QC | Factory Manager |
| Final Inspection | QC Inspector / 3rd Party | QC Manager | QC Manager |
| Dispatch | Merchandiser | Admin | Admin |
| Container Loading | Merchandiser | Warehouse Mgr | Admin |
| Shipment | Merchandiser | Admin | Admin |
| Warehousing | Warehouse Manager | Admin | Admin |

---

## 4. PRODUCT & ORDER CONTEXT

This shared context block appears at the top of every template to ensure all departments are linked to the same product and order.

### 4.1 Global Product Context Fields

| Field | Type | Required | Options / Notes |
|-------|------|----------|----------------|
| Project ID | UUID | Auto | System-generated |
| Brand | Dropdown | ✅ | From brands table |
| Product Category | Dropdown | ✅ | GAR / GLV / FTW / HDW / ACC / BAG |
| Product Name | Text | ✅ | |
| Style Number | Text | ✅ | Unique per style |
| Season | Dropdown | ✅ | SS / AW / FW / Carry-over |
| Gender | Dropdown | ✅ | Male / Female / Unisex / Kids / Baby / Toddler |
| Age Group | Dropdown | ✅ | Adult / Youth / Kids / Infant / Toddler |
| Construction Type | Dropdown | ✅ | Woven / Knitted / Leather / Synthetic / Multi-layer |
| Colorway | Text | ✅ | All colors for this style |
| Size Range | Text | ✅ | e.g. S-XL, 7-12 |
| Tech Pack Version | Text | | e.g. v2.3 |
| Origin Country | Dropdown | ✅ | China / Cambodia / India / Bangladesh / Vietnam |

### 4.2 Order Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| PO Number | Text | ✅ | Customer purchase order number |
| Order Date | Date | ✅ | |
| Order Quantity | Integer | ✅ | Total pieces |
| Vendor / Agent | Dropdown | ✅ | From suppliers table |
| Factory | Dropdown | ✅ | From factories table |
| Target Ship Date (ETD) | Date | ✅ | |
| Shipping Method | Dropdown | ✅ | Sea / Air / Road |
| Destination | Text | | Warehouse / Port destination |
| Customer PO Destination | Text | | Per destination breakdown |

---

## 5. TEMPLATE ARCHITECTURE

### 5.1 Template Count Summary

| Category | Templates | Count |
|----------|-----------|-------|
| Product Development Phase | Design, Development, Sample Sourcing, Prototype, Costing, Material Testing, Final Sample, Final Costing | 8 |
| Order Management Phase | Purchase Order, Merchandising | 2 |
| Production Preparation Phase | Bulk Material, Tooling, SOP, IQC, Production Planning | 5 |
| Production Execution Phase | Cutting, Sewing, Assembly | 3 |
| Quality Control Phase | Inline Inspection, Final Inspection | 2 |
| Logistics Phase | Packing, Dispatch, Container Loading, Shipment, Warehousing | 5 |
| **Sub-total: Department Templates** | | **25** |
| Combined Operational | Production Control (DPR), Shipment Tracking | 2 |
| Quality System | Defect Library, Inspection Builder, Supplier Scorecard, Factory Audit, CAPA, Risk Assessment | 6 |
| Master Templates | Master Workflow, Master Production Dashboard | 2 |
| **TOTAL** | | **35** |

---

### 5.2 Universal Template Block Structure

Every single one of the 35 templates follows this 7-block structure:

```
┌─────────────────────────────────────┐
│  BLOCK 1: Template Header           │  Template name, dept, stage, version
├─────────────────────────────────────┤
│  BLOCK 2: Product / Order Context   │  Shared fields — auto-filled from order
├─────────────────────────────────────┤
│  BLOCK 3: Department Tasks          │  Checklists, measurements, data fields
├─────────────────────────────────────┤
│  BLOCK 4: Technical Data            │  Dept-specific data (costs, tests, etc.)
├─────────────────────────────────────┤
│  BLOCK 5: Attachments / Evidence    │  File uploads, photos, documents
├─────────────────────────────────────┤
│  BLOCK 6: Department Output         │  What this dept produces / hands over
├─────────────────────────────────────┤
│  BLOCK 7: Approval & Handover       │  Prepared by → Reviewed by → Approved by
└─────────────────────────────────────┘
```

### 5.3 Template Status Flow

```
DRAFT → SUBMITTED → IN_REVIEW → APPROVED → COMPLETED
                                    ↓
                                REJECTED → DRAFT (revision cycle)
```

### 5.4 Template Linking — How They Connect

Each completed template triggers the next department's template automatically.

```
[T01] Design
    ↓ Output: Tech Pack
[T02] Development
    ↓ Output: Development Plan
[T03] Sample Material Sourcing
    ↓ Output: Materials Ready
[T04] Prototype Sample
    ↓ Output: Proto Sample
[T05] Costing
    ↓ Output: Cost Sheet
[T06] Material Testing
    ↓ Output: Test Report
[T07] Final Sample Approval
    ↓ Output: Approved PP Sample
[T08] Final Costing
    ↓ Output: Final Cost Sheet
[T09] Purchase Order
    ↓ Output: Confirmed PO
[T10] Merchandising
    ↓ Output: Production Timeline
[T11] Bulk Material Ordering
    ↓ Output: Materials Ordered
[T12] Tooling
    ↓ Output: Tools Ready
[T13] SOP
    ↓ Output: Approved SOPs
[T14] IQC (Material In-housing)
    ↓ Output: IQC Report
[T15] Production Planning
    ↓ Output: Production Schedule
[T16] Cutting
    ↓ Output: Cut Panels
[T17] Sewing
    ↓ Output: Sewn Components
[T18] Assembly / Lasting
    ↓ Output: Assembled Units
[T19] Inline Inspection
    ↓ Output: Inline Report
[T20] Packing
    ↓ Output: Packed Cartons
[T21] Final Inspection
    ↓ Output: Final Inspection Report
[T22] Dispatch
    ↓ Output: Dispatch Docs
[T23] Container Loading
    ↓ Output: Loading Report
[T24] Shipment / Port Handover
    ↓ Output: Bill of Lading
[T25] Warehousing
    ↓ Output: Received Confirmation
```

---

## 6. DEPARTMENT TEMPLATES DETAILED

### T01 — Design Template
**Department:** Design | **Phase:** Product Development | **Triggers Next:** Development

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Header | Template ID | UUID | Auto |
| Header | Template Version | Text | Auto |
| Header | Created By | User | Auto |
| Header | Created Date | Date | Auto |
| Header | Status | Dropdown | Auto |
| Tasks | Concept Design Completed | Checkbox | ✅ |
| Tasks | Technical Sketch Created | Checkbox | ✅ |
| Tasks | Tech Pack Drafted | Checkbox | ✅ |
| Tasks | Material Concept Defined | Checkbox | ✅ |
| Tasks | Color Palette Confirmed | Checkbox | ✅ |
| Tasks | Design Review Done | Checkbox | ✅ |
| Data | Design Concept Description | Textarea | ✅ |
| Data | Color Palette Details | Text | ✅ |
| Data | Material Notes | Text | |
| Data | Special Features / Requirements | Textarea | |
| Data | Target Retail Price | Decimal | |
| Data | Design Reference Images | File | |
| Attachments | Technical Sketch Upload | File | ✅ |
| Attachments | Tech Pack Upload | File | ✅ |
| Attachments | Reference Images | File | |
| Output | Approved Tech Pack | File | ✅ |
| Output | Design Status | Dropdown | ✅ |
| Approval | Prepared By | User | Auto |
| Approval | Reviewed By | User | ✅ |
| Approval | Approved By | User | ✅ |
| Approval | Approval Date | Date | Auto |
| Approval | Next Department | Fixed | Development |
| Approval | Handover Notes | Textarea | |

**Approver:** Admin / Merchandiser
**Receiver (next dept):** Development team lead

---

### T02 — Development Template
**Department:** Development | **Phase:** Product Development | **Triggers Next:** Sample Material Sourcing

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Pattern Created | Checkbox | ✅ |
| Tasks | Pattern Version | Text | ✅ |
| Tasks | Material Selection Done | Checkbox | ✅ |
| Tasks | Sample Plan Created | Checkbox | ✅ |
| Tasks | Tech Pack Reviewed | Checkbox | ✅ |
| Data | Pattern Version Notes | Text | |
| Data | Material Selection Details | Textarea | |
| Data | Sample Development Plan | Textarea | ✅ |
| Data | Development Issues / Notes | Textarea | |
| Attachments | Pattern Files | File | |
| Attachments | Updated Tech Pack | File | |
| Attachments | Material Swatches | File | |
| Output | Development Status | Dropdown | ✅ |
| Output | Sample Plan Document | File | |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Sample Material Sourcing |

---

### T03 — Sample Material Sourcing Template
**Department:** Sourcing | **Phase:** Product Development | **Triggers Next:** Prototype Sample

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Fabric Sourcing Completed | Checkbox | ✅ |
| Tasks | Trim Sourcing Completed | Checkbox | ✅ |
| Tasks | Accessory Sourcing Completed | Checkbox | ✅ |
| Tasks | Samples Requested from Suppliers | Checkbox | ✅ |
| Tasks | Swatches Approved | Checkbox | ✅ |
| Data | Fabric Supplier | Dropdown | ✅ |
| Data | Fabric Type | Text | ✅ |
| Data | Fabric Composition | Text | ✅ |
| Data | Fabric GSM | Number | |
| Data | Fabric Color | Text | |
| Data | Trim Supplier | Dropdown | |
| Data | Trim Type | Text | |
| Data | Component Details | Textarea | |
| Attachments | Fabric Swatches | File | |
| Attachments | Supplier Quotes | File | |
| Output | Material Approval Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Prototype Sample |

---

### T04 — Prototype Sample Template
**Department:** Sampling | **Phase:** Product Development | **Triggers Next:** Costing

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Pattern Cutting Completed | Checkbox | ✅ |
| Tasks | Sample Sewing Completed | Checkbox | ✅ |
| Tasks | Sample Assembly Completed | Checkbox | ✅ |
| Tasks | Sample Reviewed vs Tech Pack | Checkbox | ✅ |
| Tasks | Measurement Check Done | Checkbox | ✅ |
| Tasks | Brand Review Requested | Checkbox | ✅ |
| Data | Sample Reference Number | Text | ✅ |
| Data | Sample Date | Date | ✅ |
| Data | Measurement Results | Textarea | |
| Data | Fit Notes | Textarea | |
| Data | Sample Review Comments | Textarea | |
| Data | Issues Found | Textarea | |
| Data | Revision Required | Dropdown | Yes / No |
| Attachments | Sample Images (Front / Back / Side) | File | ✅ |
| Attachments | Measurement Sheet | File | |
| Output | Sample Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser / QC Manager | |
| Approval | Next Department | Fixed | Costing |

---

### T05 — Costing Template
**Department:** Costing / Merchandising | **Phase:** Product Development | **Triggers Next:** Material Testing

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Data | Fabric Cost (per unit) | Decimal | ✅ |
| Data | Trim Cost (per unit) | Decimal | ✅ |
| Data | Labor Cost (per unit) | Decimal | ✅ |
| Data | Overhead Cost (per unit) | Decimal | ✅ |
| Data | Packaging Cost (per unit) | Decimal | |
| Data | Freight / Logistics Cost | Decimal | |
| Data | Agent Commission | Decimal | |
| Data | Total FOB Cost | Decimal | Auto |
| Data | Target FOB | Decimal | |
| Data | Cost Margin | Decimal | Auto |
| Data | Currency | Dropdown | USD / EUR / CNY |
| Data | BOM (Bill of Materials) | Textarea | |
| Attachments | Cost Sheet Upload | File | ✅ |
| Attachments | BOM Document | File | |
| Output | Costing Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Material Testing |

---

### T06 — Material / Sample Testing Template
**Department:** Quality | **Phase:** Testing | **Triggers Next:** Final Sample Approval

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Lab Test Requested | Checkbox | ✅ |
| Tasks | Fabric GSM Test Done | Checkbox | ✅ |
| Tasks | Color Fastness Test Done | Checkbox | ✅ |
| Tasks | Shrinkage Test Done | Checkbox | |
| Tasks | Tear / Tensile Strength Test Done | Checkbox | |
| Tasks | Function Test Done | Checkbox | |
| Tasks | Chemical / Compliance Test Done | Checkbox | |
| Data | Lab Name | Text | |
| Data | Test Report Reference | Text | |
| Data | Fabric GSM Result | Number | |
| Data | Color Fastness Result | Dropdown | Pass / Fail / Conditional |
| Data | Shrinkage % | Number | |
| Data | Tear Strength Result | Dropdown | Pass / Fail |
| Data | Function Test Result | Dropdown | Pass / Fail |
| Data | Chemical Test Result | Dropdown | Pass / Fail |
| Data | Overall Test Result | Dropdown | ✅ |
| Data | Test Notes / Comments | Textarea | |
| Attachments | Lab Test Report | File | ✅ |
| Output | Testing Status | Dropdown | ✅ |
| Approval | Approver | QC Manager | |
| Approval | Next Department | Fixed | Final Sample Approval |

---

### T07 — Final Sample Approval Template
**Department:** QC / Merchandising | **Phase:** Testing | **Triggers Next:** Final Costing

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Data | PP Sample Reference | Text | ✅ |
| Data | PP Sample Date | Date | ✅ |
| Tasks | PP Sample Received | Checkbox | ✅ |
| Tasks | Fit Approval Completed | Checkbox | ✅ |
| Tasks | Appearance Approval Completed | Checkbox | ✅ |
| Tasks | Function Test Completed | Checkbox | ✅ |
| Tasks | Label / Trim Approval Completed | Checkbox | ✅ |
| Tasks | Measurement Check Completed | Checkbox | ✅ |
| Data | Fit Approved | Dropdown | Yes / No / Conditional |
| Data | Appearance Approved | Dropdown | Yes / No / Conditional |
| Data | Function Test Result | Dropdown | Pass / Fail |
| Data | Measurement Result | Dropdown | Pass / Fail |
| Data | PP Sample Comments | Textarea | |
| Data | Revisions Required | Textarea | |
| Data | Top Sample Reference | Text | |
| Data | Top Sample Result | Dropdown | Approved / Rejected / Pending |
| Attachments | PP Sample Photos | File | ✅ |
| Attachments | Measurement Sheet | File | |
| Output | Final Sample Status | Dropdown | ✅ |
| Approval | Approver | QC Manager / Admin / Brand Reviewer | |
| Approval | Next Department | Fixed | Final Costing |

---

### T08 — Final Costing Template
**Department:** Merchandising | **Phase:** Order Management | **Triggers Next:** Purchase Order

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Data | Updated Fabric Cost | Decimal | ✅ |
| Data | Updated Trim Cost | Decimal | ✅ |
| Data | Updated Labor Cost | Decimal | ✅ |
| Data | Updated Overhead | Decimal | ✅ |
| Data | Final FOB Cost | Decimal | Auto |
| Data | Confirmed Price with Brand | Decimal | ✅ |
| Data | Profit Margin % | Decimal | Auto |
| Data | Final Currency | Dropdown | ✅ |
| Attachments | Final Cost Sheet | File | ✅ |
| Output | Final Costing Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Purchase Order |

---

### T09 — Purchase Order Template
**Department:** Sales / Merchandising | **Phase:** Order Management | **Triggers Next:** Merchandising

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Data | Customer PO Number | Text | ✅ |
| Data | PO Date | Date | ✅ |
| Data | PO Quantity (per size/color) | Table | ✅ |
| Data | Unit Price | Decimal | ✅ |
| Data | Total PO Value | Decimal | Auto |
| Data | Delivery Terms | Dropdown | FOB / CIF / EXW |
| Data | Payment Terms | Text | |
| Data | Destination Country | Text | ✅ |
| Data | Destination Port | Text | |
| Data | ETD | Date | ✅ |
| Data | ETA | Date | |
| Attachments | Customer PO Document | File | ✅ |
| Attachments | Proforma Invoice | File | |
| Output | PO Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Merchandising |

---

### T10 — Merchandising Template
**Department:** Merchandising | **Phase:** Order Management | **Triggers Next:** Bulk Material Ordering

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Factory Confirmed | Checkbox | ✅ |
| Tasks | Production Timeline Created | Checkbox | ✅ |
| Tasks | Critical Path Issued | Checkbox | ✅ |
| Tasks | Vendor Communication Sent | Checkbox | ✅ |
| Data | Production Start Date | Date | ✅ |
| Data | Production End Date | Date | ✅ |
| Data | Delivery Date | Date | ✅ |
| Data | Critical Path Milestones | Textarea | |
| Data | Vendor Contacts Confirmed | Text | |
| Attachments | Critical Path Document | File | ✅ |
| Attachments | Factory Acknowledgment | File | |
| Output | Merchandising Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Bulk Material Ordering |

---

### T11 — Bulk Material Ordering Template
**Department:** Procurement / Sourcing | **Phase:** Production Prep | **Triggers Next:** Tooling

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Fabric Order Placed | Checkbox | ✅ |
| Tasks | Trim Order Placed | Checkbox | ✅ |
| Tasks | Accessories Order Placed | Checkbox | ✅ |
| Tasks | Packaging Material Ordered | Checkbox | ✅ |
| Tasks | ETA Confirmed from Suppliers | Checkbox | ✅ |
| Data | Fabric Supplier | Dropdown | ✅ |
| Data | Fabric Order Qty (meters/kg) | Number | ✅ |
| Data | Fabric ETA | Date | ✅ |
| Data | Trim Supplier | Dropdown | |
| Data | Trim ETA | Date | |
| Data | Packaging Supplier | Dropdown | |
| Data | Packaging ETA | Date | |
| Attachments | Purchase Orders to Suppliers | File | |
| Output | Materials Order Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Tooling |

---

### T12 — Tooling Template
**Department:** Production / Factory | **Phase:** Production Prep | **Triggers Next:** SOP

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Cutting Tools Prepared | Checkbox | ✅ |
| Tasks | Molds / Dies Ready | Checkbox | |
| Tasks | Sewing Machines Set Up | Checkbox | ✅ |
| Tasks | Assembly Equipment Ready | Checkbox | ✅ |
| Tasks | Tool Calibration Done | Checkbox | ✅ |
| Data | Machine Count | Number | |
| Data | Line Setup Notes | Textarea | |
| Data | Tooling Issues | Textarea | |
| Attachments | Tooling Evidence Photos | File | |
| Output | Tooling Status | Dropdown | ✅ |
| Approval | Approver | Production Manager / Factory Manager | |
| Approval | Next Department | Fixed | SOP |

---

### T13 — SOP Template
**Department:** QC / Production | **Phase:** Production Prep | **Triggers Next:** IQC

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Production SOP Created | Checkbox | ✅ |
| Tasks | Quality SOP Created | Checkbox | ✅ |
| Tasks | Packing SOP Created | Checkbox | ✅ |
| Tasks | Safety SOP Created | Checkbox | |
| Tasks | SOPs Issued to Floor | Checkbox | ✅ |
| Data | SOP Version | Text | ✅ |
| Data | Key Quality Points | Textarea | ✅ |
| Data | Critical Operations | Textarea | ✅ |
| Data | AQL Level for this Order | Dropdown | Level I / II / III |
| Attachments | Production SOP Document | File | ✅ |
| Attachments | Quality SOP Document | File | ✅ |
| Attachments | Packing SOP Document | File | ✅ |
| Output | SOP Status | Dropdown | ✅ |
| Approval | Approver | QC Manager / Production Manager | |
| Approval | Next Department | Fixed | IQC |

---

### T14 — IQC / Material In-housing Template
**Department:** Quality | **Phase:** Production Prep | **Triggers Next:** Production Planning

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Fabric Received and Counted | Checkbox | ✅ |
| Tasks | Fabric Inspection Done | Checkbox | ✅ |
| Tasks | Trim Inspection Done | Checkbox | ✅ |
| Tasks | Packaging Inspection Done | Checkbox | ✅ |
| Tasks | Approved / Rejected Decision Made | Checkbox | ✅ |
| Data | Fabric Received Qty (meters/kg) | Number | ✅ |
| Data | Fabric Inspected Qty | Number | ✅ |
| Data | Fabric Defect Rate % | Decimal | |
| Data | Fabric Inspection Result | Dropdown | Pass / Fail / Conditional |
| Data | Trim Inspection Result | Dropdown | Pass / Fail |
| Data | Packaging Inspection Result | Dropdown | Pass / Fail |
| Data | IQC Overall Result | Dropdown | ✅ |
| Data | IQC Comments | Textarea | |
| Attachments | IQC Inspection Photos | File | |
| Attachments | Fabric Test Reports | File | |
| Output | IQC Status | Dropdown | ✅ |
| Approval | Approver | QC Manager | |
| Approval | Next Department | Fixed | Production Planning |

---

### T15 — Production Planning Template
**Department:** Production | **Phase:** Production | **Triggers Next:** Cutting

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Data | Production Start Date | Date | ✅ |
| Data | Production End Date | Date | ✅ |
| Data | Production Line | Text | ✅ |
| Data | Line Supervisor | Dropdown | ✅ |
| Data | Total Workers Assigned | Number | ✅ |
| Data | Machines Assigned | Number | |
| Data | Planned Daily Output (units) | Number | ✅ |
| Data | Total Order Quantity | Number | Auto |
| Data | Production Days Required | Number | Auto |
| Data | Size Breakdown Plan | Textarea | ✅ |
| Data | Color Breakdown Plan | Textarea | ✅ |
| Data | Production Issues / Risks | Textarea | |
| Attachments | Production Schedule | File | |
| Output | Planning Status | Dropdown | ✅ |
| Approval | Approver | Production Manager | |
| Approval | Next Department | Fixed | Cutting |

---

### T16 — Cutting Template
**Department:** Production | **Phase:** Production | **Triggers Next:** Sewing

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Fabric Spreading Completed | Checkbox | ✅ |
| Tasks | Marker Planning Done | Checkbox | ✅ |
| Tasks | Cutting Completed | Checkbox | ✅ |
| Tasks | Cut Panels Counted and Bundled | Checkbox | ✅ |
| Tasks | Cutting QC Check Done | Checkbox | ✅ |
| Data | Cutting Date | Date | ✅ |
| Data | Fabric Layers | Number | |
| Data | Panels Cut | Number | ✅ |
| Data | Wastage % | Decimal | |
| Data | Cutting Defects Found | Number | |
| Data | Cutting Notes | Textarea | |
| Attachments | Cutting Evidence Photos | File | |
| Output | Cutting Status | Dropdown | ✅ |
| Approval | Approver | Factory Manager | |
| Approval | Next Department | Fixed | Sewing |

---

### T17 — Sewing / Stitching Template
**Department:** Production | **Phase:** Production | **Triggers Next:** Assembly

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Panel Joining Completed | Checkbox | ✅ |
| Tasks | Seam Quality Checked | Checkbox | ✅ |
| Tasks | SPI (Stitches Per Inch) Verified | Checkbox | ✅ |
| Tasks | Measurement Check Done | Checkbox | ✅ |
| Tasks | Inline Inspection at Sewing Done | Checkbox | ✅ |
| Data | Sewing Line | Text | ✅ |
| Data | Daily Output — Input | Number | ✅ |
| Data | Daily Output — Output | Number | ✅ |
| Data | Rejection at Sewing | Number | |
| Data | WIP at Sewing | Number | |
| Data | SPI Result | Number | |
| Data | Sewing Defects | Textarea | |
| Attachments | Sewing Evidence Photos | File | |
| Output | Sewing Status | Dropdown | ✅ |
| Approval | Approver | Factory Manager | |
| Approval | Next Department | Fixed | Assembly |

---

### T18 — Assembly / Lasting Template
**Department:** Production | **Phase:** Production | **Triggers Next:** Inline Inspection

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Final Assembly Completed | Checkbox | ✅ |
| Tasks | Trimming / Finishing Done | Checkbox | ✅ |
| Tasks | Label / Hang Tag Attached | Checkbox | ✅ |
| Tasks | Spot Checks Done | Checkbox | ✅ |
| Data | Assembly Line | Text | ✅ |
| Data | Input Qty | Number | ✅ |
| Data | Output Qty | Number | ✅ |
| Data | Rejection at Assembly | Number | |
| Data | WIP | Number | |
| Data | Assembly Notes | Textarea | |
| Attachments | Assembly Evidence Photos | File | |
| Output | Assembly Status | Dropdown | ✅ |
| Approval | Approver | Factory Manager | |
| Approval | Next Department | Fixed | Inline Inspection |

---

### T19 — Inline Inspection Template
**Department:** QC | **Phase:** Quality | **Triggers Next:** Packing
**Submitted By:** QC Inspector or 3rd Party Inspector

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Header | Inspector Type | Dropdown | Internal / 3rd Party |
| Header | Inspector Name | Dropdown | ✅ |
| Header | Inspection Date | Date | ✅ |
| Header | Inspection Stage | Dropdown | 30% / 50% / Final |
| Data | Lot Size | Number | ✅ |
| Data | Sample Size | Number | Auto (AQL) |
| Data | AQL Level | Dropdown | ✅ |
| Tasks | Workmanship Check | Checkbox | ✅ |
| Tasks | Measurement Verification | Checkbox | ✅ |
| Tasks | Stitching Check | Checkbox | ✅ |
| Tasks | Label Check | Checkbox | ✅ |
| Tasks | Color Shade Check | Checkbox | ✅ |
| Data | Defects Found — Minor | Number | ✅ |
| Data | Defects Found — Major | Number | ✅ |
| Data | Defects Found — Critical | Number | ✅ |
| Data | Defect Details | Defect Table | |
| Data | Inspection Result | Auto | Pass / Fail |
| Data | Inspector Comments | Textarea | |
| Attachments | Inspection Photos | File | ✅ |
| Approval | Approved By | QC Manager | |
| Approval | Factory Signature | Factory Manager | |
| Approval | Next Department | Fixed | Packing |

---

### T20 — Packing Template
**Department:** Production / Factory | **Phase:** Quality | **Triggers Next:** Final Inspection

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Polybag Packing Completed | Checkbox | ✅ |
| Tasks | Carton Packing Completed | Checkbox | ✅ |
| Tasks | Carton Marking Done | Checkbox | ✅ |
| Tasks | Barcode Labels Applied | Checkbox | ✅ |
| Tasks | Packing List Prepared | Checkbox | ✅ |
| Data | Total Cartons Packed | Number | ✅ |
| Data | Pieces per Carton | Number | ✅ |
| Data | Carton Length (cm) | Number | ✅ |
| Data | Carton Width (cm) | Number | ✅ |
| Data | Carton Height (cm) | Number | ✅ |
| Data | Carton Weight (kg) | Decimal | ✅ |
| Data | Total Packed Qty | Number | ✅ |
| Data | Packing Notes | Textarea | |
| Attachments | Packing Evidence Photos | File | ✅ |
| Attachments | Packing List Document | File | ✅ |
| Output | Packing Status | Dropdown | ✅ |
| Approval | Approver | Factory Manager | |
| Approval | Next Department | Fixed | Final Inspection |

---

### T21 — Final Inspection Template
**Department:** QC | **Phase:** Quality | **Triggers Next:** Dispatch
**Submitted By:** QC Inspector or 3rd Party Inspector

This is the most comprehensive template — based on the full inspection report structure.

| Section | Field | Type | Required |
|---------|-------|------|----------|
| Overview | Inspection Type | Dropdown | Final / Pre-shipment |
| Overview | Inspection Times | Dropdown | 1st / 2nd / 3rd |
| Overview | Inspector Type | Dropdown | Internal / 3rd Party |
| Overview | Inspector Name | Dropdown | ✅ |
| Overview | Inspection Date | Date | ✅ |
| AQL | Lot Size | Number | ✅ |
| AQL | Sample Size | Number | Auto |
| AQL | Minor Defects Found | Number | ✅ |
| AQL | Major Defects Found | Number | ✅ |
| AQL | Critical Defects Found | Number | ✅ |
| AQL | AQL Result | Auto | Pass / Fail |
| Quantity | Packing List Verified | Dropdown | Pass / Fail |
| Quantity | PO Quantity Verified | Dropdown | Pass / Fail |
| Carton | Carton Dimension Check | Dropdown | Pass / Fail |
| Carton | Carton Weight Check | Dropdown | Pass / Fail |
| Carton | Carton Marking Check | Dropdown | Pass / Fail |
| Carton | Drop Test | Dropdown | Pass / Fail |
| Carton | Moisture Test — Carton | Dropdown | Pass / Fail |
| Carton | Moisture Test — Goods | Dropdown | Pass / Fail |
| Carton | Metal / Needle Detection | Dropdown | Pass / Fail |
| Packaging | Barcode Readability | Dropdown | Pass / Fail |
| Packaging | Labeling Check | Dropdown | Pass / Fail |
| Packaging | Packaging Check | Dropdown | Pass / Fail |
| Product | Smell Test | Dropdown | Pass / Fail |
| Product | Weight / GSM Test | Dropdown | Pass / Fail |
| Product | Pull Test | Dropdown | Pass / Fail |
| Product | Adhesive Test | Dropdown | Pass / Fail |
| Product | Hand Feel Check | Dropdown | Pass / Fail |
| Product | Color Shade Check | Dropdown | Pass / Fail |
| Product | Color Fastness | Dropdown | Pass / Fail |
| Product | Function Test | Dropdown | Pass / Fail |
| Product | Seam Strength Test | Dropdown | Pass / Fail |
| Product | Stitching SPI | Dropdown | Pass / Fail |
| Product | Home Launder Test | Dropdown | Pass / Fail |
| Fitting | PP Sample Fitting | Dropdown | Pass / Fail |
| Fitting | Bulk Fitting | Dropdown | Pass / Fail |
| Print | Printing / Embroidery Check | Dropdown | Pass / Fail |
| Defects | Defect Table | Repeating | |
| Evidence | All Section Photos | File | ✅ |
| Signatures | Inspector Signature | Signature | ✅ |
| Signatures | Factory Signature | Signature | ✅ |
| Result | Final Inspection Result | Auto | Pass / Fail / Pending |
| Approval | Approved By | QC Manager | |
| Approval | Next Department | Fixed | Dispatch |

---

### T22 — Dispatch Template
**Department:** Logistics / Merchandising | **Phase:** Logistics | **Triggers Next:** Container Loading

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Packing List Finalized | Checkbox | ✅ |
| Tasks | Commercial Invoice Ready | Checkbox | ✅ |
| Tasks | Export Documents Ready | Checkbox | ✅ |
| Tasks | Goods Handed to Forwarder | Checkbox | ✅ |
| Data | Dispatch Date | Date | ✅ |
| Data | Forwarder Name | Text | ✅ |
| Data | Total Cartons | Number | ✅ |
| Data | Total CBM | Decimal | |
| Data | Total Weight (kg) | Decimal | |
| Data | Dispatch Notes | Textarea | |
| Attachments | Packing List | File | ✅ |
| Attachments | Commercial Invoice | File | ✅ |
| Output | Dispatch Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Container Loading |

---

### T23 — Container Loading Template
**Department:** Logistics | **Phase:** Logistics | **Triggers Next:** Shipment

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Container Inspected | Checkbox | ✅ |
| Tasks | Loading Started | Checkbox | ✅ |
| Tasks | Loading Completed | Checkbox | ✅ |
| Tasks | Container Sealed | Checkbox | ✅ |
| Data | Container Number | Text | ✅ |
| Data | Container Size | Dropdown | 20ft / 40ft / 40HC / LCL |
| Data | Container Seal Number | Text | ✅ |
| Data | Loading Date | Date | ✅ |
| Data | Cartons Loaded | Number | ✅ |
| Data | Total CBM Used | Decimal | |
| Data | Loading Photos Count | Number | |
| Data | Container Issues | Textarea | |
| Attachments | Container Loading Photos | File | ✅ |
| Attachments | Container Inspection Report | File | |
| Output | Loading Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Shipment |

---

### T24 — Shipment / Port Handover Template
**Department:** Logistics | **Phase:** Logistics | **Triggers Next:** Warehousing

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Data | Shipping Line | Text | ✅ |
| Data | Vessel Name | Text | |
| Data | Voyage Number | Text | |
| Data | ETD (Port of Loading) | Date | ✅ |
| Data | ETA (Port of Destination) | Date | ✅ |
| Data | Port of Loading | Text | ✅ |
| Data | Port of Destination | Text | ✅ |
| Data | Shipment Mode | Dropdown | Sea / Air |
| Data | Bill of Lading Number | Text | ✅ |
| Data | Airway Bill Number | Text | |
| Data | Forwarder Reference | Text | |
| Attachments | Bill of Lading / AWB | File | ✅ |
| Attachments | Customs Documents | File | |
| Output | Shipment Status | Dropdown | ✅ |
| Approval | Approver | Admin / Merchandiser | |
| Approval | Next Department | Fixed | Warehousing |

---

### T25 — Warehousing Template
**Department:** Warehouse | **Phase:** Destination | **Triggers Next:** COMPLETED

| Block | Field | Type | Required |
|-------|-------|------|----------|
| Tasks | Goods Received and Counted | Checkbox | ✅ |
| Tasks | Packing List Verified | Checkbox | ✅ |
| Tasks | Damages Noted | Checkbox | ✅ |
| Tasks | Goods Stored in Location | Checkbox | ✅ |
| Data | Received Date | Date | ✅ |
| Data | Warehouse Location | Text | ✅ |
| Data | Cartons Received | Number | ✅ |
| Data | Units Received | Number | ✅ |
| Data | Damaged Cartons | Number | |
| Data | Damaged Units | Number | |
| Data | Storage Rack / Bay | Text | |
| Data | Receiving Notes | Textarea | |
| Attachments | Receiving Evidence Photos | File | ✅ |
| Output | Receiving Status | Dropdown | ✅ |
| Approval | Approver | Warehouse Manager | |
| Approval | Workflow | COMPLETED ✅ | |

---

## 7. APPROVAL SYSTEM

### 7.1 Approval Flow Per Template

Every template follows this 3-level approval chain:

```
[SUBMITTER] fills and submits template
          ↓
[REVIEWER] reviews content, can comment or send back
          ↓
[APPROVER] formally approves or rejects
          ↓
[RECEIVER] next department is notified and template unlocked
```

### 7.2 Approval Status Values

| Status | Description | Who Sets |
|--------|-------------|---------|
| DRAFT | Template started but not submitted | Submitter |
| SUBMITTED | Awaiting review | Submitter |
| IN_REVIEW | Being reviewed | Reviewer |
| REVISION_REQUESTED | Sent back for changes | Reviewer / Approver |
| APPROVED | Formally approved | Approver |
| REJECTED | Rejected with reason | Approver |
| COMPLETED | Fully done, archived | System |

### 7.3 Approval & Handover Matrix — All 25 Templates

| # | Template | Submitted By | Reviewed By | Approved By | Receives Next |
|---|----------|-------------|-------------|-------------|---------------|
| T01 | Design | Merchandiser | Admin | Admin | Development Lead |
| T02 | Development | Merchandiser | Admin | Admin | Sourcing Team |
| T03 | Sample Sourcing | Merchandiser | Admin | Admin | Sampling Team |
| T04 | Prototype Sample | Factory Manager | QC Manager | Admin / Merchandiser | Costing Team |
| T05 | Costing | Merchandiser | Admin | Admin | QC Manager |
| T06 | Material Testing | QC Inspector | QC Manager | QC Manager | Merchandiser |
| T07 | Final Sample | QC Inspector | QC Manager | Admin / Merchandiser | Merchandiser |
| T08 | Final Costing | Merchandiser | Admin | Admin | Merchandiser |
| T09 | Purchase Order | Merchandiser | Admin | Admin | Merchandiser |
| T10 | Merchandising | Merchandiser | Admin | Admin | Procurement |
| T11 | Bulk Material | Merchandiser | Admin | Admin | Factory Manager |
| T12 | Tooling | Factory Manager | Production Manager | Production Manager | QC Manager |
| T13 | SOP | QC Manager | Production Manager | Admin | Factory Manager |
| T14 | IQC | QC Inspector | QC Manager | QC Manager | Production Manager |
| T15 | Production Planning | Production Manager | Admin | Production Manager | Factory Manager |
| T16 | Cutting | Factory QC | Factory Manager | Factory Manager | Factory Manager |
| T17 | Sewing | Factory QC | Factory Manager | Factory Manager | Factory Manager |
| T18 | Assembly | Factory QC | Factory Manager | Factory Manager | QC Inspector |
| T19 | Inline Inspection | QC Inspector / 3P | QC Manager | QC Manager | Factory Manager |
| T20 | Packing | Factory QC | Factory Manager | Factory Manager | QC Inspector |
| T21 | Final Inspection | QC Inspector / 3P | QC Manager | QC Manager | Merchandiser |
| T22 | Dispatch | Merchandiser | Admin | Admin | Logistics |
| T23 | Container Loading | Logistics / Merch | Admin | Admin | Merchandiser |
| T24 | Shipment | Merchandiser | Admin | Admin | Warehouse Manager |
| T25 | Warehousing | Warehouse Manager | Admin | Admin | DONE |

---

### 7.4 Approval Database Tables

```sql
-- approval_records table
CREATE TABLE approval_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_record_id UUID REFERENCES template_records(id),
    step VARCHAR(50),              -- SUBMITTED / IN_REVIEW / APPROVED / REJECTED
    action_by UUID REFERENCES users(id),
    action_date TIMESTAMP,
    comments TEXT,
    status VARCHAR(50)
);

-- handover_log table
CREATE TABLE handover_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_template_id UUID REFERENCES templates(id),
    to_template_id UUID REFERENCES templates(id),
    order_id UUID REFERENCES orders(id),
    handed_over_by UUID REFERENCES users(id),
    handed_over_to UUID REFERENCES users(id),
    handover_date TIMESTAMP,
    notes TEXT
);
```

---

## 8. INSPECTION ENGINE & AQL SYSTEM

### 8.1 Inspection Types

| Type | When | Who | Template |
|------|------|-----|---------|
| IQC — Material Inspection | On material receipt | Internal QC Inspector | T14 |
| Inline Inspection | During production (30%, 50%) | QC Inspector / 3rd Party | T19 |
| Final Inspection (Pre-shipment) | After packing, before dispatch | QC Inspector / 3rd Party | T21 |
| Lab Testing | During development / bulk | External lab / Internal QC | T06 |
| Factory Audit | Annual / Periodic | QC Manager / 3rd Party | QS04 |

### 8.2 AQL Standard (ANSI/ASQC Z1.4)

**Inspection Levels:** Level I (reduced) / Level II (normal) / Level III (tightened)

**AQL Sampling Table (Level II — Normal)**

| Lot Size | Sample Size | Critical (AQL 0) | Major (AQL 2.5) Accept/Reject | Minor (AQL 4.0) Accept/Reject |
|----------|-------------|-----------------|-------------------------------|-------------------------------|
| 2–8 | 2 | 0/1 | 0/1 | 0/1 |
| 9–15 | 3 | 0/1 | 0/1 | 0/1 |
| 16–25 | 5 | 0/1 | 0/1 | 0/1 |
| 26–50 | 8 | 0/1 | 0/1 | 0/1 |
| 51–90 | 13 | 0/1 | 0/1 | 1/2 |
| 91–150 | 20 | 0/1 | 1/2 | 1/2 |
| 151–280 | 32 | 0/1 | 1/2 | 2/3 |
| 281–500 | 50 | 0/1 | 2/3 | 3/4 |
| 501–1200 | 80 | 0/1 | 3/4 | 5/6 |
| 1201–3200 | 125 | 0/1 | 5/6 | 7/8 |
| 3201–10000 | 200 | 0/1 | 7/8 | 10/11 |
| 10001–35000 | 315 | 0/1 | 10/11 | 14/15 |
| 35001–150000 | 500 | 0/1 | 14/15 | 21/22 |

**AQL Decision Logic:**
```python
def calculate_aql_result(critical, major, minor, sample_size, lot_size):
    if critical > 0:
        return "FAIL"  # Zero tolerance for critical
    limits = get_aql_limits(sample_size)
    if major >= limits['major_reject']:
        return "FAIL"
    if minor >= limits['minor_reject']:
        return "FAIL"
    return "PASS"
```

### 8.3 Defect Severity Definitions

| Severity | Definition | AQL | Action |
|----------|-----------|-----|--------|
| Critical | Hazardous to consumer / legal violation / product unusable | 0 | Immediate FAIL — 100% sort or destroy |
| Major | Functional defect or appearance defect likely to cause return | 2.5 | FAIL if above limit — sort affected lot |
| Minor | Workmanship issue not affecting function, unlikely to cause return | 4.0 | FAIL if above limit — sort and repair |

### 8.4 Inspection Defect Table Schema

```sql
CREATE TABLE inspection_defects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES inspection_reports(id),
    defect_id UUID REFERENCES defects(id),
    defect_group VARCHAR(100),
    defect_code VARCHAR(50),
    remark TEXT,
    minor_count INT DEFAULT 0,
    major_count INT DEFAULT 0,
    critical_count INT DEFAULT 0,
    evidence_image TEXT,  -- file URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 9. DAILY PRODUCTION REPORT (DPR)

### 9.1 DPR Template — Complete Field List

**Header Fields**

| Field | Type | Required |
|-------|------|----------|
| Report Date | Date | ✅ |
| Factory | Dropdown | ✅ |
| Production Line | Text | ✅ |
| Supervisor | Dropdown | ✅ |
| Style Number | Auto (from order) | ✅ |
| PO Number | Auto (from order) | ✅ |
| Shift | Dropdown (Morning / Evening / Night) | ✅ |
| Working Hours | Number | ✅ |
| Workers Present | Number | ✅ |
| Machine Count | Number | |

**Production Process Table (one row per process)**

| Process | Input Qty | Output Qty | Rejected | WIP | Efficiency % |
|---------|-----------|-----------|----------|-----|-------------|
| Cutting | | | | | Auto |
| Sewing | | | | | Auto |
| Assembly | | | | | Auto |
| Packing | | | | | Auto |

**Efficiency Formula:**
```
Efficiency % = (Actual Output / Planned Output) × 100
```

**Defect Tracking (Inline at Production)**

| Defect Type | Quantity |
|------------|---------|
| Open Seam | |
| Broken Stitch | |
| Loose Thread | |
| Fabric Hole | |
| Measurement Out | |
| Color Variation | |
| Other | |

**Production Issues Log**

| Issue Type | Description | Impact | Action Taken |
|-----------|-------------|--------|-------------|
| Machine Breakdown | | | |
| Material Shortage | | | |
| Operator Absence | | | |
| Quality Hold | | | |

**Cumulative Progress Tracker**

| Metric | Value |
|--------|-------|
| Order Quantity | Auto |
| Cutting Completed to Date | Running total |
| Sewing Completed to Date | Running total |
| Assembly Completed to Date | Running total |
| Packed to Date | Running total |
| % Complete | Auto |

### 9.2 DPR Database Tables

```sql
CREATE TABLE production_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    factory_id UUID REFERENCES factories(id),
    report_date DATE,
    line VARCHAR(100),
    supervisor_id UUID REFERENCES users(id),
    shift VARCHAR(50),
    working_hours DECIMAL,
    workers_present INT,
    machine_count INT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE production_process_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES production_reports(id),
    process_name VARCHAR(100),
    planned_qty INT,
    input_qty INT,
    output_qty INT,
    reject_qty INT,
    wip_qty INT,
    efficiency_percent DECIMAL GENERATED ALWAYS AS
        (CASE WHEN planned_qty > 0 THEN (output_qty::DECIMAL / planned_qty) * 100 ELSE 0 END) STORED
);
```

---

## 10. QUALITY SYSTEM

### QS01 — Defect Library Template

Used to manage and standardize the defect database across all product categories.

| Field | Type | Options |
|-------|------|---------|
| Defect Code | Text | e.g. GAR-001, GLV-012 |
| Defect Name | Text | e.g. Open Seam, Fabric Hole |
| Defect Category | Dropdown | Stitching / Fabric / Finishing / Labeling / Packing / Measurement / Color |
| Severity | Dropdown | Critical / Major / Minor |
| Product Category | Multi-select | GAR / GLV / FTW / HDW / ACC / BAG |
| Description | Textarea | What it looks like |
| Cause | Textarea | Common root causes |
| Corrective Action | Textarea | Standard fix |
| Active | Boolean | |

---

### QS02 — Inspection Template Builder

Allows admins to create custom inspection checklists per product category.

**Sections:**
- Template Header (name, category, version)
- Checklist Builder (add/remove checklist items)
- Measurement Table Builder (spec vs actual)
- Defect Counter (link to defect library)
- Photo Upload Requirements
- AQL Configuration
- Result Calculation Logic

---

### QS03 — Supplier Scorecard Template

| Metric | Weight | Measurement |
|--------|--------|-------------|
| Inspection Pass Rate | 30% | % of inspections passed |
| Delivery Performance | 25% | % of orders shipped on time |
| Defect Rate | 25% | Defects per 1000 units |
| Audit Compliance Score | 20% | Audit score 0–100 |
| **Overall Score** | **100%** | Weighted average |

**Scorecard Ratings:**
| Score | Rating | Action |
|-------|--------|--------|
| 90–100 | ⭐ Excellent | Preferred supplier |
| 75–89 | ✅ Good | Standard supplier |
| 60–74 | ⚠️ Acceptable | Monitor closely |
| 45–59 | 🔴 Poor | Improvement plan required |
| < 45 | ❌ Critical | Suspension / exit plan |

---

### QS04 — Factory Audit Template

| Section | Fields |
|---------|--------|
| Factory Information | Name, location, capacity, manpower |
| Safety Compliance | Fire exits, PPE, first aid, machinery guards |
| Labor Compliance | Working hours, wages, contracts, age verification |
| Production Capability | Machines, process capability, capacity |
| Quality System | ISO certificates, QC procedures, inspection records |
| Environmental | Waste management, water, chemicals |
| Social Compliance | WRAP, BSCI, SA8000 status |

**Audit Scoring:**
- Each section scored 0–100
- Overall = average of all sections
- Pass threshold: ≥ 70

---

### QS05 — CAPA Template (Corrective Action & Preventive Action)

| Field | Type | Required |
|-------|------|----------|
| Issue ID | Auto | Auto |
| Source | Dropdown | Inspection / Audit / DPR / Customer Complaint |
| Linked Inspection / Report ID | UUID | |
| Issue Description | Textarea | ✅ |
| Defect Category | Dropdown | |
| Severity | Dropdown | ✅ |
| Root Cause Analysis | Textarea | ✅ |
| Immediate Corrective Action | Textarea | ✅ |
| Preventive Action | Textarea | ✅ |
| Responsible Person | Dropdown | ✅ |
| Due Date | Date | ✅ |
| Verification Method | Textarea | |
| Status | Dropdown | Open / In Progress / Closed / Overdue |
| Closure Date | Date | |
| Closure Evidence | File | |

---

### QS06 — Risk Assessment Template

| Field | Type | Options |
|-------|------|---------|
| Risk Area | Dropdown | Supplier / Production / Quality / Logistics / Compliance |
| Risk Description | Textarea | |
| Probability | Dropdown | Low / Medium / High |
| Impact | Dropdown | Low / Medium / High |
| Risk Level | Auto | Low / Medium / High / Critical |
| Mitigation Plan | Textarea | |
| Risk Owner | Dropdown | |
| Review Date | Date | |
| Status | Dropdown | Open / Mitigated / Closed |

---

## 11. SUPPLIER & FACTORY SCORECARDS

### 11.1 Scorecard Data Model

```sql
CREATE TABLE supplier_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    evaluation_period VARCHAR(50),    -- e.g. Q1 2025
    inspection_pass_rate DECIMAL,
    on_time_delivery_rate DECIMAL,
    defect_rate_per_1000 DECIMAL,
    audit_compliance_score INT,
    overall_score DECIMAL,
    rating VARCHAR(50),
    evaluated_by UUID REFERENCES users(id),
    evaluation_date DATE
);
```

### 11.2 Factory Profile Dashboard Cards

Each factory page shows 5 info cards:
1. **Certifications** — ISO, WRAP, BSCI, SA8000 with expiry dates
2. **Audit Compliance** — Last audit date, score, status
3. **Production Capacity** — Units/month per product category
4. **Total Manpower** — Worker count, skill levels
5. **Infrastructure** — Machine count, floor area, production lines

---

## 12. LOGISTICS & SHIPMENT TRACKING

### 12.1 Shipment Stage Tracker

| Stage | Status Options | Template | Responsible |
|-------|---------------|---------|-------------|
| Dispatch Preparation | Pending / In Progress / Done | T22 | Merchandiser |
| Container Loading | Pending / In Progress / Loaded | T23 | Logistics |
| Port Departure | Pending / Departed | T24 | Forwarder |
| In Transit | On Schedule / Delayed | Auto | System |
| Port Arrival | Pending / Arrived / Customs Hold | Auto | Forwarder |
| Customs Clearance | Pending / Cleared / Held | Manual | Logistics |
| Warehouse Delivery | Pending / Delivered | T25 | Warehouse |

### 12.2 Shipment Database Schema

```sql
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    container_number VARCHAR(100),
    container_type VARCHAR(50),
    seal_number VARCHAR(100),
    shipping_line VARCHAR(255),
    vessel_name VARCHAR(255),
    bl_number VARCHAR(100),
    etd DATE,
    eta DATE,
    port_of_loading VARCHAR(100),
    port_of_destination VARCHAR(100),
    shipment_mode VARCHAR(50),
    forwarder VARCHAR(255),
    current_stage VARCHAR(100),
    current_status VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id),
    event_stage VARCHAR(100),
    event_status VARCHAR(50),
    event_date TIMESTAMP,
    notes TEXT,
    recorded_by UUID REFERENCES users(id)
);
```

---

## 13. MASTER WORKFLOW TEMPLATE

### 13.1 Structure

The Master Workflow is a read-only aggregated view automatically built from all 25 department templates for each order. It cannot be manually filled — it is a live dashboard.

**Sections:**

**1. Product & Order Summary**
- Brand, product name, style, season, gender, age group
- PO number, order quantity, ETD
- Factory, vendor

**2. Department Workflow Tracker**

| # | Department | Status | Responsible | Submitted | Approved | Output |
|---|-----------|--------|-------------|-----------|----------|--------|
| 1 | Design | ✅ Complete | | | | Tech Pack |
| 2 | Development | ✅ Complete | | | | Dev Plan |
| 3 | Sample Sourcing | ✅ Complete | | | | Materials |
| 4 | Prototype Sample | ✅ Complete | | | | Proto Sample |
| 5 | Costing | ✅ Complete | | | | Cost Sheet |
| 6 | Material Testing | ✅ Complete | | | | Test Report |
| 7 | Final Sample | ✅ Complete | | | | PP Sample |
| 8 | Final Costing | ✅ Complete | | | | Final Cost |
| 9 | Purchase Order | ✅ Complete | | | | PO Confirmed |
| 10 | Merchandising | ✅ Complete | | | | Timeline |
| 11 | Bulk Material | ✅ Complete | | | | Ordered |
| 12 | Tooling | ✅ Complete | | | | Ready |
| 13 | SOP | ✅ Complete | | | | SOPs Issued |
| 14 | IQC | ✅ Complete | | | | IQC Report |
| 15 | Production Planning | ✅ Complete | | | | Schedule |
| 16 | Cutting | ⚙ In Progress | | | | — |
| 17 | Sewing | ⏳ Pending | | | | — |
| 18 | Assembly | ⏳ Pending | | | | — |
| 19 | Inline Inspection | ⏳ Pending | | | | — |
| 20 | Packing | ⏳ Pending | | | | — |
| 21 | Final Inspection | ⏳ Pending | | | | — |
| 22 | Dispatch | ⏳ Pending | | | | — |
| 23 | Container Loading | ⏳ Pending | | | | — |
| 24 | Shipment | ⏳ Pending | | | | — |
| 25 | Warehousing | ⏳ Pending | | | | — |

**3. Production Progress (Live from DPR)**

| Process | Order Qty | Completed | Remaining | % Done |
|---------|-----------|-----------|-----------|--------|
| Cutting | | | | |
| Sewing | | | | |
| Assembly | | | | |
| Packing | | | | |

**4. Inspection Summary**

| Inspection | Date | Inspector | Result | Report |
|-----------|------|-----------|--------|--------|
| IQC | | | | Link |
| Inline | | | | Link |
| Final | | | | Link |

**5. Shipment Tracking**
- Container number, vessel, ETD, ETA, current stage

**6. Quality Alerts**
- Any CAPA open for this order
- Any FAIL results with action required

---

## 14. DATABASE SCHEMA SUMMARY

### Core Tables

| Table | Purpose |
|-------|---------|
| users | All platform users |
| brands | Brand entities |
| factories | Manufacturing factories |
| suppliers | Supplier / vendor entities |
| third_parties | 3rd party inspection companies |
| products | Product master data |
| orders | Purchase orders / production orders |
| workflow_templates | Workflow configuration |
| workflow_stages | Stages within each workflow |
| workflow_instances | Per-order workflow tracking |
| templates | Template definitions (35) |
| template_sections | Sections within templates |
| template_fields | Fields within sections |
| template_records | Filled template instances |
| template_field_values | Individual field values |
| approval_records | Approval audit trail |
| handover_log | Department handovers |
| production_reports | Daily production reports |
| production_process_data | DPR process data |
| inspection_reports | Inspection records |
| inspection_defects | Defects found in inspections |
| defects | Defect library |
| aql_sampling | AQL sampling plan |
| aql_acceptance | AQL accept/reject limits |
| capa | Corrective actions |
| supplier_scores | Supplier scorecards |
| shipments | Shipment records |
| shipment_events | Shipment stage events |
| attachments | File uploads across all modules |
| notifications | In-app notification records |

**Total Tables: ~30**

---

## 15. DJANGO APP STRUCTURE

```
backend/
├── core/
│   ├── settings.py
│   ├── urls.py
│   └── permissions.py          ← Role-based permission classes
│
├── apps/
│   ├── users/                  ← User model, JWT auth, roles
│   ├── brands/                 ← Brand management
│   ├── factories/              ← Factory profiles + scorecards
│   ├── suppliers/              ← Supplier management
│   ├── third_parties/          ← 3rd party inspector management
│   ├── products/               ← Product master data
│   ├── orders/                 ← PO management
│   ├── workflows/              ← Workflow engine + stages
│   ├── templates_engine/       ← Template builder + records
│   ├── production/             ← DPR + production tracking
│   ├── inspections/            ← Inspection engine + AQL
│   ├── defects/                ← Defect library
│   ├── capa/                   ← CAPA management
│   ├── quality/                ← Audits + risk assessment
│   ├── shipments/              ← Logistics + shipment tracking
│   ├── warehouse/              ← Warehouse receiving
│   ├── notifications/          ← In-app + email notifications
│   ├── attachments/            ← File upload handling
│   └── analytics/              ← Reports + dashboard data
```

**Key Permission Classes:**
```python
# apps/core/permissions.py
class IsAdminOrQCManager(BasePermission): ...
class IsFactoryScoped(BasePermission): ...       # Filters to own factory only
class IsBrandScoped(BasePermission): ...         # Filters to own brand only
class IsThirdPartyInspector(BasePermission): ... # Submit inspection only
class CanApproveTemplate(BasePermission): ...    # Role + stage check
class CanViewCosting(BasePermission): ...        # Merchandiser / Admin only
```

---

## 16. API ENDPOINTS

### Core APIs

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET/POST | /api/brands/ | Brand list / create | Admin |
| GET/PUT | /api/brands/{id}/ | Brand detail | Admin |
| GET/POST | /api/factories/ | Factory list / create | Admin |
| GET | /api/factories/{id}/scorecard/ | Factory scorecard | QC Manager+ |
| GET/POST | /api/suppliers/ | Supplier list | Admin, Merch |
| GET/POST | /api/users/ | User management | Admin |
| GET/POST | /api/products/ | Product catalog | All |
| GET/POST | /api/orders/ | Order management | Merch+ |
| GET | /api/orders/{id}/workflow/ | Master workflow view | All scoped |

### Template APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/templates/ | List all template definitions |
| POST | /api/template-records/ | Submit a filled template |
| GET | /api/template-records/{id}/ | View template record |
| POST | /api/template-records/{id}/submit/ | Submit for review |
| POST | /api/template-records/{id}/approve/ | Approve template |
| POST | /api/template-records/{id}/reject/ | Reject with reason |

### Inspection APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/inspections/ | Inspection list / create |
| GET | /api/inspections/{id}/ | Inspection detail |
| POST | /api/inspections/{id}/submit/ | Submit inspection |
| POST | /api/inspections/{id}/approve/ | Approve inspection |
| GET | /api/aql/sampling-plan/ | Get AQL sample size |
| GET | /api/defects/ | Defect library |

### Production APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/production/reports/ | DPR list / create |
| GET | /api/production/reports/{id}/ | DPR detail |
| GET | /api/production/efficiency/ | Efficiency analytics |
| GET | /api/production/progress/{order_id}/ | Order progress tracker |

### Quality APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/capa/ | CAPA list / create |
| GET/POST | /api/audits/ | Audit records |
| GET/POST | /api/supplier-scores/ | Scorecard data |
| GET | /api/analytics/quality/ | Quality KPIs |

---

## 17. NEXT.JS FRONTEND STRUCTURE

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── dashboard/
│   │   └── page.tsx              ← Master KPI dashboard
│   │
│   ├── orders/
│   │   ├── page.tsx              ← Order list
│   │   ├── new/page.tsx          ← Create order
│   │   └── [orderId]/
│   │       ├── page.tsx          ← Master workflow view
│   │       └── templates/
│   │           └── [templateId]/page.tsx ← Fill template
│   │
│   ├── production/
│   │   ├── page.tsx              ← DPR dashboard
│   │   └── new/page.tsx          ← Submit DPR
│   │
│   ├── inspections/
│   │   ├── page.tsx              ← Inspection list
│   │   ├── new/page.tsx          ← New inspection
│   │   └── [inspectionId]/page.tsx
│   │
│   ├── factories/
│   │   ├── page.tsx
│   │   └── [factoryId]/page.tsx  ← Factory profile + 5 cards
│   │
│   ├── suppliers/
│   │   ├── page.tsx
│   │   └── [supplierId]/page.tsx
│   │
│   ├── quality/
│   │   ├── defects/page.tsx
│   │   ├── capa/page.tsx
│   │   └── audits/page.tsx
│   │
│   ├── shipments/
│   │   └── page.tsx
│   │
│   ├── reports/
│   │   └── page.tsx
│   │
│   └── settings/
│       ├── users/page.tsx
│       ├── roles/page.tsx
│       └── notifications/page.tsx
│
├── components/
│   ├── templates/
│   │   ├── TemplateForm.tsx       ← Dynamic form renderer
│   │   ├── ApprovalPanel.tsx      ← Approve / Reject UI
│   │   └── HandoverBadge.tsx      ← Next dept indicator
│   ├── workflow/
│   │   ├── WorkflowTracker.tsx    ← 25-stage progress bar
│   │   └── StageCard.tsx
│   ├── inspection/
│   │   ├── AQLCalculator.tsx
│   │   ├── DefectTable.tsx
│   │   └── InspectionResult.tsx
│   ├── production/
│   │   ├── DPRForm.tsx
│   │   ├── EfficiencyChart.tsx
│   │   └── ProgressTracker.tsx
│   ├── factories/
│   │   └── FactoryInfoCards.tsx   ← 5 info cards
│   ├── logo/
│   │   └── SankalpHubLogo.tsx     ← Adaptive logo component
│   └── shared/
│       ├── NotificationBell.tsx
│       ├── RoleBadge.tsx
│       └── StatusBadge.tsx
```

---

## 18. NOTIFICATION & ALERT SYSTEM

### 18.1 Notification Triggers

| Event | Recipients | Channel |
|-------|-----------|---------|
| Template submitted for review | Reviewer | In-app + Email |
| Template approved | Submitter + Next dept receiver | In-app + Email |
| Template rejected | Submitter | In-app + Email |
| Inspection result: FAIL | QC Manager + Merchandiser + Brand | In-app + Email |
| Inspection result: PASS | QC Manager + Merchandiser | In-app |
| DPR submitted | Production Manager | In-app |
| Production efficiency < 70% | Production Manager + Admin | In-app + Email |
| CAPA overdue | Responsible person + Admin | In-app + Email |
| Shipment departed | Merchandiser + Warehouse | In-app + Email |
| Goods received at warehouse | Merchandiser + Admin | In-app + Email |
| Factory audit score < 70 | Admin + QC Manager | In-app + Email |
| 3rd Party inspection scheduled | Factory Manager | Email |
| Approval overdue (48hrs) | Admin + Approver | In-app + Email |

### 18.2 Notification Database Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    related_module VARCHAR(50),
    related_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 19. BUILD ROADMAP

### Phase 1 — Core System (Weeks 1–6)
- [ ] Django project setup + PostgreSQL + JWT auth
- [ ] User, Role, Brand, Factory, Supplier models
- [ ] Product + Order management
- [ ] Workflow engine (stages + instances)
- [ ] Template engine (dynamic form builder)
- [ ] First 8 department templates (T01–T08)
- [ ] Next.js basic layout + auth
- [ ] Dashboard shell

### Phase 2 — Production & Quality (Weeks 7–10)
- [ ] Templates T09–T21 (Order → Final Inspection)
- [ ] AQL calculator + inspection engine
- [ ] Daily Production Report (DPR)
- [ ] Defect library
- [ ] Approval workflow + notifications
- [ ] Factory profile page with 5 info cards

### Phase 3 — Logistics & Quality System (Weeks 11–13)
- [ ] Templates T22–T25 (Dispatch → Warehousing)
- [ ] Shipment tracker
- [ ] CAPA system
- [ ] Supplier scorecard
- [ ] Factory audit template

### Phase 4 — Master Dashboard & Analytics (Weeks 14–16)
- [ ] Master workflow view per order
- [ ] Production efficiency charts
- [ ] Inspection analytics
- [ ] Supplier performance dashboard
- [ ] PDF report generation for inspection reports
- [ ] Mobile responsiveness sprint

### Phase 5 — Enterprise Features (Post-launch)
- [ ] 3rd Party inspector portal
- [ ] Brand review portal
- [ ] Defect trend analytics
- [ ] Risk assessment module
- [ ] API documentation
- [ ] Bulk import (orders, products)

---

## TEMPLATE COUNT FINAL SUMMARY

| Category | Templates |
|----------|-----------|
| Department Templates (T01–T25) | 25 |
| Production Control (DPR) | 1 |
| Shipment Tracking Combined | 1 |
| Defect Library | 1 |
| Inspection Template Builder | 1 |
| Supplier Scorecard | 1 |
| Factory Audit | 1 |
| CAPA | 1 |
| Risk Assessment | 1 |
| Master Workflow | 1 |
| Master Production Dashboard | 1 |
| **TOTAL** | **35** |

---

*SankalpHub.in — Production Intelligence Platform*
*Plan Version 1.0 — Django/DRF + PostgreSQL + Next.js*
*Ready for Claude Code Implementation*
