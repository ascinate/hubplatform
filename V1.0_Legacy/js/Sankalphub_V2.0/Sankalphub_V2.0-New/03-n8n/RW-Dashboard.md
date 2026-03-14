# 📊 n8n — RW Production QC Dashboard

  

> **Complete documentation for RefrigiWear QC automation workflow in n8n**

>

> 🔗 Back to [[00-Home|🏠 Home]] | [[01-Plans/Roadmap|📋 Roadmap]] | [[04-Clients/RefrigiWear|🏭 RefrigiWear]]

  

---

  

## 🎯 Overview

Automated QC dashboard that reads inspection report files (PDF/XLSX/XLS) from a folder, processes pass/fail logic and generates a live HTML dashboard for RefrigiWear production team.

  

---

  

## 🖥️ Access Points

  

| Service | URL | Purpose |

|---------|-----|---------|

| n8n Editor | http://localhost:5678 | Build & manage workflows |

| QC Dashboard | Open via Desktop shortcut | View live dashboard |

  

---

  

## 📁 Folder Structure

  

```

/Users/naveenkumar/.n8n-files/

├── incoming/ → Drop report files here

│ ├── *.pdf → PDF inspection reports

│ ├── *.xlsx → Excel inspection reports

│ └── *.xls → Legacy Excel reports

└── output/

└── qc_dashboard.html → Generated dashboard

```

  

---

  

## 🖥️ Desktop Shortcuts

  

| Shortcut | Purpose |

|----------|---------|

| `Start_n8n.command` | Starts n8n + copies dashboard to Desktop |

| `QC_Dashboard.html` | Right-click → Open With → your browser |

  

---

  

## ⚙️ Workflow ID

```

5uH4iUZq6emBwmPt

```

  

---

  

## 🔄 Workflow Nodes

  

### Node 1 — Schedule Trigger

- Runs workflow automatically on schedule

- Can also run manually by clicking "Execute"

  

### Node 2 — Read Files from Disk

- Reads ALL files from `/Users/naveenkumar/.n8n-files/incoming/`

- Supports: PDF, XLSX, XLS, XLSX formats

- Returns file metadata: name, extension, size, directory

  

### Node 3 — If Node

- Filters valid files only

- Checks file extension is pdf, xlsx or xls

  

### Node 4 — Code in JavaScript (Node 1)

**Purpose:** Extract pass/fail status from filename

  

**Logic:**

```javascript

// Detects FAIL from filename keywords

isFail = filename includes 'fail' or 'rejected'

  

// Detects PASS from filename keywords

isPass = filename includes 'pass' or 'approved'

  

// Detects report type

isAQL = filename includes 'aql' or 'shipment'

isInline = filename includes 'inline' or 'vendor'

  

// Sets inspection result

Lot Rejected → if isFail

Lot Approved → if isPass or isAQL

Pending → if inline/vendor process

```

  

**Output fields:**

- `fileName` — original file name

- `fileExtension` — pdf/xlsx/xls

- `reportType` — AQL Shipment / Inline Process

- `inspectionResult` — Lot Approved / Lot Rejected

- `status` — Approved / Rejected / Pending

  

### Node 5 — Code in JavaScript (Node 2)

**Purpose:** Aggregate data + generate HTML dashboard

  

**Logic:**

- Groups files by factory name

- Counts total, approved, rejected per factory

- Calculates pass rates

- Generates complete HTML dashboard

  

**Key metrics calculated:**

- `totalLots` — total inspection files

- `approvedLots` — passed inspections

- `rejectedLots` — failed inspections

- `fpAqlPercent` — first pass AQL percentage

- `failRate` — rejection rate percentage

  

### Node 6 — Write File to Disk

- Writes generated HTML to output folder

- Path: `/Users/naveenkumar/.n8n-files/output/qc_dashboard.html`

  

---

  

## 📊 Dashboard Sections

  

| Section | Description |

|---------|-------------|

| **KPI Cards** | Total, Passed, Failed, First-Pass AQL |

| **Donut Chart** | Approved vs Rejected visual |

| **Defect Rate Bars** | Stitching, Surface, Lasting, Labeling |

| **Factory Performance Map** | Per-file pass rate table (scrollable) |

| **Live Inspection Stream** | All inspections with status (scrollable) |

  

---

  

## 🏭 Supported Report Types

  

| Report Type | Extension | Pass/Fail Logic |

|-------------|-----------|-----------------|

| AQL Shipment Reports | PDF | Filename keyword detection |

| Garment Style Inspection | XLSX | Inline Process → Review |

| Vendor Inline Process | XLSX | Inline Process → Review |

| Vendor Sample-Based | XLS | Filename keyword detection |

| Refrigiwear China Petcher | PDF | Filename keyword detection |

| RW China Fujian Gerxing | PDF | AQL → Pass by default |

  

---

  

## 🚀 Daily Startup Routine

  

**Step 1 — Start n8n:**

```bash

# Double-click Start_n8n.command on Desktop

# OR run in Terminal:

nvm use 20 && N8N_RESTRICT_FILE_ACCESS_TO=/Users/naveenkumar/ n8n start

```

  

**Step 2 — Open Dashboard:**

```bash

# Right-click QC_Dashboard.html on Desktop

# → Open With → Safari / Chrome / Edge

```

  

**Step 3 — Add new reports:**

```bash

# Drop new PDF/XLSX files into:

/Users/naveenkumar/.n8n-files/incoming/

```

  

**Step 4 — Run workflow:**

- Go to http://localhost:5678

- Open workflow `5uH4iUZq6emBwmPt`

- Click "Execute Workflow"

- Refresh dashboard to see updated data

  

---

  

## 🔧 Troubleshooting

  

| Problem | Solution |

|---------|---------|

| Dashboard shows old data | Re-run workflow in n8n |

| Port 5678 already in use | n8n already running — use existing terminal |

| Port 9090 already in use | Run: `lsof -ti:9090 \| xargs kill -9` |

| Dashboard shows 404 | Check output folder has qc_dashboard.html |

| File not detected | Check file is in incoming/ folder |

| Wrong pass/fail status | Check filename has 'Pass' or 'Fail' keyword |

  

---

  

## 🔮 Future Improvements

- [ ] Extract REAL defect data from Excel files

- [ ] Parse PDF content for actual pass/fail status

- [ ] Move to cloud server for 24/7 access

- [ ] Share dashboard link with USA colleagues

- [ ] Email alerts for failed inspections

- [ ] Date filtering and history tracking

- [ ] Connect to SankalpHub API

  

---

  

## 📝 Notes

> *Add any workflow updates or issues here*

  

---

  

*Last updated: {{date}}*

*🔗 Related: [[02-Specs/QMS-Module]] · [[04-Clients/RefrigiWear]] · [[01-Plans/Roadmap]]*