# RefrigiWear QC Intelligence Module
### For SankalpHub.in — Production & Inspection Intelligence Platform

---

## 📁 File Structure

```
refrigiwear-qc-data/
│
├── index.js                        ← MAIN ENTRY POINT — import this in your webapp
├── schema.json                     ← Data schema, category list, stage list, severity levels
├── README.md                       ← This file
│
├── products/
│   ├── mens-outerwear.json         ← Men's jackets, bibs, coveralls, vests
│   ├── womens-outerwear.json       ← Women's jackets, bibs, layers
│   ├── footwear.json               ← All boots, BOA systems, socks
│   ├── gloves.json                 ← All glove types (performance, cut-resist, touchscreen)
│   ├── headwear.json               ← Knit caps, balaclavas, hoods, hard hat liners
│   └── accessories.json            ← Blankets, bags, thermometers, warmers
│
├── defects/
│   └── master-defects.json         ← Full defect library with all 10 stage checks per defect
│
├── processes/
│   └── all-stages.json             ← 10 stage definitions + full checklists per stage per category
│
└── utils/
    └── size-charts.json            ← Men's, Women's, Glove, Footwear size charts + temp ratings
```

---

## ⚙️ 10 Manufacturing Process Stages

| # | Stage Key              | Code | Phase          | Description                                   |
|---|------------------------|------|----------------|-----------------------------------------------|
| 1 | `development_samples`  | DEV  | Pre-Production | Proto review, material/construction specs     |
| 2 | `size_set`             | SZS  | Pre-Production | Size grading accuracy across full size range  |
| 3 | `pp_samples`           | PPS  | Pre-Production | Pre-production approval with bulk materials   |
| 4 | `material`             | MAT  | Pre-Production | Incoming fabric, hardware, trims inspection   |
| 5 | `cutting`              | CUT  | Production     | Panel accuracy, grain line, lot segregation   |
| 6 | `sewing_stitching`     | SEW  | Production     | SPI, seam type, thread tension, needle mgmt   |
| 7 | `assembly`             | ASM  | Production     | Hardware, tape, BOA, rivets, zippers          |
| 8 | `inline_inspection`    | INL  | QC             | Real-time production quality monitoring       |
| 9 | `final_inspection`     | FIN  | QC             | AQL pre-shipment inspection                   |
|10 | `packing`              | PCK  | QC             | Carton, labels, hang tags, shipment prep      |

---

## 🏷️ Product Categories

| Category ID       | Label               | Key Products                                    |
|-------------------|---------------------|------------------------------------------------|
| `mens_outerwear`  | Men's Outerwear     | Iron-Tuff® Jackets, PolarForce®, Bibs, Coveralls |
| `womens_outerwear`| Women's Outerwear   | Women's Iron-Tuff®, PolarForce®, Bibs           |
| `footwear`        | Footwear            | Extreme Pac Boot, Extreme Hiker, Classic Moc Toe |
| `gloves`          | Gloves              | Iron-Tuff® Glove, ChillBreaker™, Touch-Rite™    |
| `headwear`        | Headwear            | HiVis Knit Cap, Sherpa Balaclava, Snap-On Hood  |
| `accessories`     | Accessories         | Pallet Covers, Tote Bags, Thermometers          |

---

## 🔌 API Usage — Claude Code Examples

### In Node.js / Claude Code
```js
const qc = require('./index');

// ── GET ALL PRODUCTS ──────────────────────────────────────────
const allProducts = qc.getAllProducts();
// Returns: [ { id, style, name, subcategory, colors, sizes, specs, ... }, ... ]

// ── GET BY CATEGORY ───────────────────────────────────────────
const gloves = qc.getProductsByCategory('gloves');

// ── GET PRODUCT BY STYLE ──────────────────────────────────────
const arcticJacket = qc.getProductByStyle('0489');
// Returns: { id: 'MNJKT-001', name: 'Iron-Tuff® Arctic Jacket', ... }

// ── GET STAGE CHECKLIST ───────────────────────────────────────
const finalInspChecks = qc.getChecklist('final_inspection', 'footwear');
// Returns: [ { check_id, item, type, severity }, ... ]

// ── GET DEFECTS FOR CATEGORY ──────────────────────────────────
const glovesDefects = qc.getDefectsByCategory('gloves');

// ── GET ALL CRITICAL DEFECTS ──────────────────────────────────
const criticals = qc.getCriticalDefects();

// ── GET DEFECT STAGE MAP ──────────────────────────────────────
const inlineDefects = qc.getDefectChecksByStage('inline_inspection');
// Returns defects that are ACTIVE at inline stage with their check details

// ── FULL PRODUCT INSPECTION PLAN ─────────────────────────────
const plan = qc.getProductInspectionPlan('0489');
// Returns: {
//   product: { ... },
//   stages: [
//     { stage_id, stage_label, phase, checklist, defect_checks },
//     ... × 10 stages
//   ]
// }
```

### In React Component (SankalpHub.in)
```jsx
import qc from '../data/refrigiwear-qc-data';

function InspectionChecklist({ stageKey, categoryId }) {
  const checklist = qc.getChecklist(stageKey, categoryId);
  const stage     = qc.getStage(stageKey);

  return (
    <div>
      <h2>{stage.label}</h2>
      {checklist.map(item => (
        <div key={item.check_id} className="check-item">
          <span className={`badge ${item.type}`}>{item.type}</span>
          <p>{item.item}</p>
        </div>
      ))}
    </div>
  );
}

function ProductDefectMap({ style }) {
  const plan = qc.getProductInspectionPlan(style);
  // Render all 10 stages with their defect checks
}
```

---

## 🧱 Data Architecture

### Product Object
```json
{
  "id": "MNJKT-001",
  "style": "0489",
  "name": "Iron-Tuff® Arctic Jacket",
  "subcategory": "Jackets",
  "collection": "Iron-Tuff®",
  "colors": ["Black", "Navy"],
  "description": "...",
  "sizes": ["S","M","L","XL","2XL","3XL","4XL","5XL"],
  "temp_rating_f": -50,
  "temp_rating_c": -46,
  "specs": { "shell": "...", "insulation": "...", ... },
  "size_chart_ref": "mens_garment_chart",
  "key_materials": [...]
}
```

### Defect Object
```json
{
  "id": "DEF-CON-001",
  "code": "CON-001",
  "name": "Seam Breakage / Open Seam",
  "type": "Construction",
  "applies_to": ["mens_outerwear", "womens_outerwear"],
  "severity": "CRITICAL",
  "aql_class": "1.0",
  "trend_risk": "CRITICAL",
  "test_standards": ["ASTM D5034"],
  "stage_checks": {
    "development_samples": { "active": true, "action": "...", "check": "...", "pass_criteria": "..." },
    "size_set":            { "active": true,  ... },
    "pp_samples":          { ... },
    "material":            { ... },
    "cutting":             { "active": false, ... },
    "sewing_stitching":    { "active": true,  ... },
    "assembly":            { ... },
    "inline_inspection":   { ... },
    "final_inspection":    { ... },
    "packing":             { ... }
  }
}
```

---

## 🎯 Severity & AQL Reference

| Severity  | AQL  | Action                                     | Color   |
|-----------|------|--------------------------------------------|---------|
| CRITICAL  | 1.0  | HALT production / 100% inspect             | #C0392B |
| MAJOR     | 2.5  | Reject AQL sample lot / rework             | #E67E22 |
| MINOR     | 4.0  | Note and monitor / conditional accept      | #2E86C1 |
| COSMETIC  | 6.5  | Accept with notation / 2nd quality eval    | #8E44AD |

---

## 🔄 Integration Notes for SankalpHub.in

1. **API Routes**: Map each `index.js` function to an Express.js or Next.js API route
2. **DB Migration**: Use `getAllProducts()` output to seed your products table
3. **Stage Workflow**: `getStages()` returns all 10 stages — use to build workflow progress tracker
4. **Defect Logging**: Use defect `code` as foreign key in your defect log table
5. **Dashboard**: Use `getDefectsBySeverity('CRITICAL')` to power critical defects widget
6. **Inspection Forms**: Use `getChecklist(stageKey, categoryId)` to dynamically render checklists
7. **Product Plan**: Use `getProductInspectionPlan(style)` to render full product QC timeline

---

## 📋 Extending This Module

To add new defects: add to `defects/master-defects.json` following the schema
To add new products: add to the relevant `products/*.json` file
To add new checklist items: add to `processes/all-stages.json` under the correct stage and category
To update size charts: edit `utils/size-charts.json`

---

*Source: pro.refrigiwear.com | Brand: RefrigiWear (RefrigiWear LLC)*
*Module: SankalpHub.in QC Intelligence Library v1.0*
