# 🏭 SankalpHub — QMS Module Specs

  

> **Complete Quality Management System specification for SankalpHub platform**

>

> 🔗 Back to [[00-Home|🏠 Home]] | [[01-Plans/Roadmap|📋 Roadmap]]

  

---

  

## 🎯 Overview

SankalpHub QMS covers **21 production stages** across **5 phases** with role-based access control (RBAC) for 4 stakeholder types.

  

---

  

## 👥 Stakeholder Roles

  

| Role | Description | Access Level |

|------|-------------|--------------|

| **Brand** | RefrigiWear / Buyer | View reports, approve lots |

| **Factory** | Manufacturing unit | Submit inspections, view own data |

| **3rd Party** | Independent inspector | Conduct audits, submit reports |

| **Owner/Admin** | SankalpHub admin | Full access to all data |

  

---

  

## 📊 5 Phases of Production

  

| Phase | Name | Stages |

|-------|------|--------|

| Phase 1 | Pre-Production | Stages 1-4 |

| Phase 2 | In-Process | Stages 5-10 |

| Phase 3 | Mid-Line | Stages 11-14 |

| Phase 4 | Final Inspection | Stages 15-18 |

| Phase 5 | Post-Production | Stages 19-21 |

  

---

  

## 🔢 21 Production Stages

  

### 📦 Phase 1 — Pre-Production (Stages 1-4)

| Stage | Name | Description |

|-------|------|-------------|

| 1 | Raw Material Inspection | Fabric, trims, accessories check |

| 2 | Pre-Production Meeting | Style, construction, quality standards |

| 3 | Sample Approval | Pre-production sample sign-off |

| 4 | Pilot Run | First production run evaluation |

  

### ⚙️ Phase 2 — In-Process (Stages 5-10)

| Stage | Name | Description |

|-------|------|-------------|

| 5 | Cutting Inspection | Fabric cutting quality check |

| 6 | Sewing Start | First piece off line check |

| 7 | Inline Process | During sewing inspection |

| 8 | Measurement Check | Spec measurement verification |

| 9 | Workmanship Audit | Stitching, seam quality |

| 10 | Trims & Labels Check | Labels, tags, accessories |

  

### 🔍 Phase 3 — Mid-Line (Stages 11-14)

| Stage | Name | Description |

|-------|------|-------------|

| 11 | Mid-Line Inspection | 50% production check |

| 12 | Defect Analysis | Defect pattern identification |

| 13 | Corrective Action | Issue resolution tracking |

| 14 | Re-inspection | Post corrective action check |

  

### ✅ Phase 4 — Final Inspection (Stages 15-18)

| Stage | Name | Description |

|-------|------|-------------|

| 15 | Pre-Final Inspection | Before packing check |

| 16 | AQL Sampling | ANSI/ASQ Z1.4 sampling |

| 17 | Final Inspection | Complete lot inspection |

| 18 | Packing Inspection | Carton, packing quality |

  

### 🚢 Phase 5 — Post-Production (Stages 19-21)

| Stage | Name | Description |

|-------|------|-------------|

| 19 | Loading Supervision | Container loading check |

| 20 | Document Review | Shipping docs verification |

| 21 | Lot Disposition | Final approval / rejection |

  

---

  

## 🔐 Permissions Matrix

  

| Action | Brand | Factory | 3rd Party | Admin |

|--------|-------|---------|-----------|-------|

| View Reports | ✅ | ✅ Own only | ✅ | ✅ |

| Submit Inspection | ❌ | ✅ | ✅ | ✅ |

| Approve Lot | ✅ | ❌ | ❌ | ✅ |

| Reject Lot | ✅ | ❌ | ❌ | ✅ |

| Manage Users | ❌ | ❌ | ❌ | ✅ |

| View All Factories | ✅ | ❌ | ❌ | ✅ |

| Export Reports | ✅ | ✅ | ✅ | ✅ |

| Delete Records | ❌ | ❌ | ❌ | ✅ |

  

---

  

## 🐛 Defect Severity Tiers

  

| Tier | Name | Description | Action |

|------|------|-------------|--------|

| 🔴 Critical | Critical | Safety/compliance risk | Immediate rejection |

| 🟡 Major | Major | Affects functionality | AQL evaluation |

| 🟢 Minor | Minor | Cosmetic issue | Acceptable limit |

  

---

  

## 📐 AQL Standards

- **Standard:** ANSI/ASQ Z1.4

- **Inspection Levels:** I, II, III

- **Default Level:** II (General)

- **Lot Sizes:** As per Z1.4 table

- **Accept/Reject:** Based on AQL sampling plan

  

---

  

## 🗂️ Defect Categories

  

| Category | Examples |

|----------|---------|

| Stitching | Skip stitch, open seam, broken thread |

| Surface / Esthetic | Stain, hole, fabric defect |

| Lasting / Structural | Shape, padding, lining issues |

| Labeling / Packing | Wrong label, missing tag, wrong carton |

| Measurement | Out of spec measurements |

| Safety / Compliance | Missing safety labels, ANSI violations |

  

---

  

## 🖥️ UI Screens Planned

  

- [ ] Inspection Dashboard

- [ ] New Inspection Form

- [ ] Defect Entry Screen

- [ ] AQL Calculator

- [ ] Lot Approval Screen

- [ ] Factory Performance Map

- [ ] Reports & Export Screen

- [ ] User Management Screen

  

---

  

## 📝 Notes

> *Add any spec updates or new requirements here*

  

---

  

*Last updated: {{date}}*

*🔗 Related: [[01-Plans/Roadmap]] · [[04-Clients/RefrigiWear]] · [[03-n8n/RW-Dashboard]]*