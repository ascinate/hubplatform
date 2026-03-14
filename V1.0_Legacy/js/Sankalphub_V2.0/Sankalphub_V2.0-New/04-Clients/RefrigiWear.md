# 🏭 RefrigiWear — Client Notes

  

> **Complete reference for RefrigiWear client account and QC requirements**

>

> 🔗 Back to [[00-Home|🏠 Home]] | [[01-Plans/Roadmap|📋 Roadmap]] | [[03-n8n/RW-Dashboard|📊 n8n Dashboard]]

  

---

  

## 🏢 Client Overview

  

| Field | Details |

|-------|---------|

| **Client Name** | RefrigiWear |

| **Industry** | Industrial Workwear |

| **Product Type** | Garments & Footwear |

| **Status** | 🟢 Active |

| **Platform** | SankalpHub QMS |

  

---

  

## 🏭 Factory Network

  

| Factory Code | Factory Name | Location | Product Type |

|-------------|--------------|----------|--------------|

| GA | Garment Style | — | Garments |

| RW | RW-China-Fujian Gerxing | China, Fujian | Garments |

| RW | RW-China-New Magma | China | Garments |

| CH | China Petcher | China | Footwear |

| RE | Refrigiwear China Petcher | China | Footwear |

| VE | Vendor Inline Process | — | Garments |

| VE | Vendor Sample-Based | — | Garments |

  

---

  

## 📦 Product Categories

  

| Category | Products |

|----------|---------|

| **Garments** | AQL Sample-Based Final Shipment |

| **Footwear** | AQL Sample-Based Final Shipment |

| **Workwear** | Industrial safety workwear |

  

---

  

## 📋 Inspection Report Types

  

| Report Type | Format | Source |

|-------------|--------|--------|

| AQL Sample-Based Final Shipment | PDF | Factories |

| Garment Style Inspection Template | XLSX | Internal |

| Vendor Inline Process | XLSX | Vendor |

| Vendor Sample-Based Final Shipment | XLS | Vendor |

  

---

  

## 🎯 QC Standards

  

| Standard | Details |

|----------|---------|

| **AQL Method** | ANSI/ASQ Z1.4 |

| **Inspection Level** | General Level II |

| **Critical AQL** | 0.0 (Zero tolerance) |

| **Major AQL** | 2.5 |

| **Minor AQL** | 4.0 |

| **Safety Standard** | ANSI/ISEA 107-2020 (Safety Vests) |

  

---

  

## ✅ Pass/Fail Logic

  

| Condition | Status | Dashboard |

|-----------|--------|-----------|

| Filename contains 'Pass' or 'Approved' | ✅ Lot Approved | PASS — Green |

| Filename contains 'Fail' or 'Rejected' | ❌ Lot Rejected | REVIEW — Red |

| AQL Shipment (no keyword) | ✅ Lot Approved | PASS — Green |

| Inline/Vendor Process | ⏳ Pending | REVIEW — Red |

  

---

  

## 📊 Current Dashboard Metrics

> *Updated each time n8n workflow runs*

  

| Metric | Value |

|--------|-------|

| Total Reports | 21 |

| Passed | 18 |

| Failed | 3 |

| First-Pass AQL | 85.7% |

| Rejection Rate | 14.3% |

  

---

  

## 🗂️ Defect Categories Tracked

  

| Category | Current Rate | Color |

|----------|-------------|-------|

| Stitching Defects | 42% | 🔵 Blue |

| Surface / Esthetic | 28% | 🟣 Purple |

| Lasting / Structural | 18% | 🟡 Amber |

| Labeling / Packing | 12% | 🔴 Red |

  

---

  

## 📁 File Locations

  

| Location | Path |

|----------|------|

| Incoming reports | `/Users/naveenkumar/.n8n-files/incoming/` |

| Generated dashboard | `/Users/naveenkumar/.n8n-files/output/qc_dashboard.html` |

| Desktop shortcut | `~/Desktop/QC_Dashboard.html` |

| OneDrive reports | `OneDrive-Refrigiwear/Documents/Automation_Approved_Reports/` |

  

---

  

## 👥 Team & Contacts

> *Add team contacts here*

  

| Name | Role | Location |

|------|------|----------|

| Naveen Kumar | QC Manager / SankalpHub | India |

| — | USA Colleague | USA |

  

---

  

## 🔮 Planned Improvements for RefrigiWear

  

- [ ] Real PDF content parsing for actual pass/fail

- [ ] Extract defect data from Excel files

- [ ] Cloud hosting for dashboard sharing with USA team

- [ ] Email alerts for failed lots

- [ ] WhatsApp notifications for critical defects

- [ ] Historical data tracking

- [ ] Date range filtering on dashboard

- [ ] Multi-factory comparison reports

  

---

  

## 📝 Meeting Notes & Updates

> *Add any client meeting notes or requirement updates here*

  

### {{date}}

- Initial QC dashboard live ✅

- Processing 21 reports from 7 factories ✅

- 85.7% first-pass AQL rate ✅

  

---

  

*Last updated: {{date}}*

*🔗 Related: [[03-n8n/RW-Dashboard]] · [[02-Specs/QMS-Module]] · [[01-Plans/Roadmap]]*