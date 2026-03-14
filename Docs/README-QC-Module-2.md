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

## 📚 Complete Defects Library — All Product Categories

> Defect types covered: **Fabric · Stitching · Measurement · Labeling · Printing · Assembly · Trims · Packaging · Safety**
> Severity levels: 🔴 **Critical** (AQL 1.0) · 🟠 **Major** (AQL 2.5) · 🟡 **Minor** (AQL 4.0)

---

### 1️⃣ Garments Defects
*Applies to: Men's Outerwear · Women's Outerwear · Coveralls · Bibs · Vests · Layers*

#### 🔴 Critical
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| G-CR-01 | Broken needle inside garment | Safety | Inline / Final | HALT — metal detector pass mandatory; reject entire lot pending scan |
| G-CR-02 | Sharp object inside garment | Safety | Inline / Final | HALT — 100% metal detector sweep; root cause investigation |
| G-CR-03 | Chemical contamination | Safety | Material / Final | HALT — segregate lot; lab test; do not ship |
| G-CR-04 | Incorrect safety labeling | Labeling | PP Sample / Final | HALT — replace all labels; re-inspect 100% before release |
| G-CR-05 | Flammable material non-compliance | Safety | Development / Material | HALT — flame test (ASTM D6413); do not proceed to bulk |

#### 🟠 Major
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| G-MJ-01 | Open seam | Stitching | Sewing / Inline | Rework at sewing station; re-inspect after repair |
| G-MJ-02 | Broken stitch | Stitching | Sewing / Inline | Identify machine/operator; rework affected garments |
| G-MJ-03 | Skip stitch | Stitching | Sewing / Inline | Replace needle; adjust tension; rework affected pcs |
| G-MJ-04 | Uneven stitching | Stitching | Sewing / Inline | Retrain operator; check presser foot and feed dog |
| G-MJ-05 | Seam puckering | Stitching | Sewing / Inline | Adjust thread tension and differential feed |
| G-MJ-06 | Misaligned panels | Assembly | Cutting / Sewing | Check pattern notches; retrain alignment technique |
| G-MJ-07 | Fabric hole | Fabric | Material / Inline | Reject panel at cutting; trace back to fabric lot |
| G-MJ-08 | Fabric tear | Fabric | Material / Inline | Reject panel; inspect adjacent panels in same roll |
| G-MJ-09 | Oil stain | Fabric | Inline / Final | Rework — attempt solvent removal; reject if permanent |
| G-MJ-10 | Dye stain | Fabric | Material / Inline | Reject fabric lot; issue supplier NCR |
| G-MJ-11 | Color shading variation | Fabric | Material / Cutting | Enforce dye lot control; segregate mixed-lot cuts |
| G-MJ-12 | Incorrect measurement | Measurement | Sewing / Final | 100% re-measure; rework or reject out-of-spec pieces |
| G-MJ-13 | Missing label | Labeling | Sewing / Inline | Halt bundle; apply correct label; trace operator |
| G-MJ-14 | Wrong size label | Labeling | Sewing / Inline | 100% label audit on affected bundle; re-label |
| G-MJ-15 | Twisted seam | Stitching | Sewing / Inline | Rework; check grain line alignment at cutting |
| G-MJ-16 | Loose stitching | Stitching | Sewing / Inline | Check SPI; verify thread tension; rework affected seams |
| G-MJ-17 | Raw edge exposed | Stitching | Sewing / Assembly | Rework with overlock or binding; update SOP |

#### 🟡 Minor
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| G-MN-01 | Loose thread | Stitching | Inline / Final / Packing | Trim at finishing station before packing |
| G-MN-02 | Minor crease | Fabric | Final / Packing | Steam press at finishing; update folding method |
| G-MN-03 | Slight shade variation | Fabric | Inline / Final | Note on inspection report; conditionally accept |
| G-MN-04 | Minor dirt mark | Fabric | Inline / Final | Spot clean; reject if not removable |
| G-MN-05 | Slight seam waviness | Stitching | Inline / Final | Note; accept if within 3mm of spec line |
| G-MN-06 | Minor print misalignment | Printing | Assembly / Final | Accept if within ±5mm tolerance; note on report |

---

### 2️⃣ Gloves Defects
*Applies to: Performance Gloves · Leather Gloves · Cut-Resistant · Touchscreen · Mitts · Liners*

#### 🔴 Critical
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| GL-CR-01 | Cut resistant material failure | Safety | Material / PP Sample | HALT — TDM-100 retest; reject lot; issue supplier NCR |
| GL-CR-02 | Sharp metal fragment inside glove | Safety | Assembly / Final | HALT — 100% metal detector scan; root cause investigation |
| GL-CR-03 | Chemical contamination | Safety | Material / Final | HALT — segregate; lab analysis; do not ship |
| GL-CR-04 | Missing safety marking (ANSI/EN 388) | Labeling | PP Sample / Final | HALT — replace all labels; 100% re-inspect before release |

#### 🟠 Major
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| GL-MJ-01 | Open seam | Stitching | Sewing / Inline | Rework at sewing; re-inspect seam strength |
| GL-MJ-02 | Broken stitching | Stitching | Sewing / Inline | Identify machine; rework; check SPI |
| GL-MJ-03 | Uneven finger length | Measurement | Cutting / Sewing | Re-check pattern template; measure vs spec |
| GL-MJ-04 | Incorrect glove size | Measurement | Cutting / Final | Re-measure hand circumference; re-label if needed |
| GL-MJ-05 | Palm reinforcement missing | Assembly | Assembly / Inline | Halt bundle; identify missing operation; rework |
| GL-MJ-06 | Padding / insulation missing | Assembly | Assembly / Inline | Halt and rework; trace back to insulation station |
| GL-MJ-07 | Stitch skipped | Stitching | Sewing / Inline | Replace needle; rework affected gloves |
| GL-MJ-08 | Fabric tear | Fabric | Material / Cutting | Reject panel; inspect adjacent pieces same lot |

#### 🟡 Minor
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| GL-MN-01 | Loose threads | Stitching | Final / Packing | Trim at finishing before packing |
| GL-MN-02 | Minor color variation | Fabric | Inline / Final | Note on report; conditionally accept if within Grade 4 |
| GL-MN-03 | Slight printing defect | Printing | Assembly / Final | Accept if within ±3mm; note on inspection report |
| GL-MN-04 | Minor dirt mark | Fabric | Final | Spot clean; reject if not removable |

---

### 3️⃣ Footwear Defects
*Applies to: Pac Boots · Leather Boots · Crossover Boots · Women's Boots · Socks*

#### 🔴 Critical
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| FW-CR-01 | Sharp object inside shoe | Safety | Assembly / Final | HALT — 100% metal detector scan; investigate tooling |
| FW-CR-02 | Sole detachment risk (bond failure) | Safety | Assembly / Final | HALT — peel test all pairs; reject lot if >AQL 1.0 |
| FW-CR-03 | Chemical contamination | Safety | Material / Final | HALT — segregate lot; lab test before any release |
| FW-CR-04 | Safety compliance label missing | Labeling | PP Sample / Final | HALT — replace all labels; 100% audit before ship |

#### 🟠 Major
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| FW-MJ-01 | Sole separation | Assembly | Assembly / Inline | Peel test all pairs; re-cement with correct process |
| FW-MJ-02 | Glue overflow | Assembly | Assembly / Inline | Clean with solvent at finishing; re-inspect aesthetics |
| FW-MJ-03 | Uneven sole alignment | Assembly | Assembly / Final | Re-last; re-press; check lasting template |
| FW-MJ-04 | Incorrect shoe size | Measurement | Cutting / Final | Re-measure against last spec; re-label if needed |
| FW-MJ-05 | Heel instability | Assembly | Assembly / Final | Re-bond heel counter; check heel cup spec |
| FW-MJ-06 | Toe cap deformation | Assembly | Assembly / Final | Replace toe cap; check lasting process |
| FW-MJ-07 | Stitch break (upper/welt) | Stitching | Sewing / Inline | Rework; check SPI and thread spec |
| FW-MJ-08 | Upper leather wrinkle | Fabric | Assembly / Final | Re-last; check upper moisture content |
| FW-MJ-09 | Eyelet misalignment | Assembly | Assembly / Inline | Re-set eyelet; check jig positioning |

#### 🟡 Minor
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| FW-MN-01 | Minor scuff marks | Fabric | Final / Packing | Buff at finishing; apply protective cream (leather) |
| FW-MN-02 | Minor glue stain | Assembly | Final / Packing | Clean at finishing; reject if cannot be removed |
| FW-MN-03 | Slight color mismatch (pair) | Fabric | Final | Compare pair under D65 light; flag if ΔE > 2.0 |
| FW-MN-04 | Minor surface scratch | Fabric | Final / Packing | Buff; note on report; conditionally accept |

---

### 4️⃣ Headwear Defects
*Applies to: Knit Caps · Balaclavas · Gaiters · Snap-On Hoods · HiVis Headwear · Hard Hat Liners*

#### 🔴 Critical
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| HW-CR-01 | Sharp component inside cap (needle fragment, wire) | Safety | Assembly / Final | HALT — metal detector scan; 100% inspect; investigate |
| HW-CR-02 | Chemical contamination | Safety | Material / Final | HALT — segregate lot; lab analysis; do not ship |

#### 🟠 Major
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| HW-MJ-01 | Panel misalignment | Assembly | Sewing / Inline | Rework; check stitch guide and panel registration |
| HW-MJ-02 | Broken stitching | Stitching | Sewing / Inline | Identify machine/operator; rework |
| HW-MJ-03 | Logo misprint | Printing | Assembly / Final | Reject piece; re-embroider or re-print; check artwork |
| HW-MJ-04 | Size incorrect | Measurement | Sewing / Final | Re-measure head circumference; re-label |
| HW-MJ-05 | Visor deformation (ball caps) | Assembly | Assembly / Final | Reject; check visor stiffener spec and heat-setting |
| HW-MJ-06 | Missing label | Labeling | Sewing / Inline | Halt bundle; apply correct label; trace operator |

#### 🟡 Minor
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| HW-MN-01 | Loose thread | Stitching | Final / Packing | Trim at finishing before packing |
| HW-MN-02 | Minor color variation | Fabric | Inline / Final | Note on report; check within Grade 4 tolerance |
| HW-MN-03 | Slight embroidery misalignment | Printing | Assembly / Final | Accept if within ±3mm of approved position |

---

### 5️⃣ Accessories Defects
*Applies to: Pallet Covers · Tote Bags · Thermometers · Hand & Foot Warmers · Safety Gear*

#### 🔴 Critical
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| AC-CR-01 | Sharp edges (exposed metal/plastic) | Safety | Assembly / Final | HALT — 100% edge inspection; rework or reject |
| AC-CR-02 | Chemical contamination | Safety | Material / Final | HALT — segregate; lab analysis; do not ship |

#### 🟠 Major
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| AC-MJ-01 | Broken zipper | Trims | Assembly / Final | Replace zipper; re-inspect operation |
| AC-MJ-02 | Zipper misalignment | Assembly | Assembly / Inline | Re-attach; check tape alignment at sewing |
| AC-MJ-03 | Velcro failure (delamination/weak bond) | Trims | Assembly / Final | Re-bond or re-sew; peel test after repair |
| AC-MJ-04 | Buckle defect (cracked/non-closing) | Trims | Material / Assembly | Replace buckle; check incoming component quality |
| AC-MJ-05 | Snap button failure | Trims | Assembly / Final | Replace snap; re-test 10-cycle operation |
| AC-MJ-06 | Label missing | Labeling | Sewing / Final | Apply correct label; 100% audit affected bundle |

#### 🟡 Minor
| Code | Defect | Type | Detection Stage | Action |
|------|--------|------|----------------|--------|
| AC-MN-01 | Minor scratch | Fabric | Final / Packing | Note on report; conditionally accept |
| AC-MN-02 | Slight color variation | Fabric | Inline / Final | Note on report; check within Grade 4 tolerance |
| AC-MN-03 | Minor stitching irregularity | Stitching | Inline / Final | Accept if structurally sound; note on report |

---

### 🗂️ Defect Type Index

| Defect Type | Scope | Key Checks | Stage to Catch |
|-------------|-------|-----------|----------------|
| **Fabric** | All categories | Delamination, holes, tears, staining, shade variation | Material · Cutting · Inline |
| **Stitching** | All sewn products | SPI, open seams, skip stitches, puckering, tension | Sewing · Inline · Final |
| **Measurement** | Garments, Gloves, Footwear | Spec sheet tolerance ±1.5cm garments, ±3mm gloves | Size Set · Sewing · Final |
| **Labeling** | All products | Care, size, brand, COO, compliance (ANSI/EN) labels | PP Sample · Sewing · Final |
| **Printing** | Garments, Headwear | Logo, branding, reflective tape placement accuracy | Assembly · Inline · Final |
| **Assembly** | All categories | Hardware attachment, bonding, insulation, tape | Assembly · Inline · Final |
| **Trims** | Garments, Accessories | Zippers, snaps, Velcro, buckles, rivets, buttons | Material · Assembly · Final |
| **Packaging** | All products | Carton labeling, packing list accuracy, protection | Packing |
| **Safety** | All products | Needles/sharps, chemicals, ANSI/EN compliance labels | Material · Final · Metal Detect |

---

### 🚦 Quick Severity Reference

```
🔴 CRITICAL (AQL 1.0)  →  Consumer safety risk OR compliance failure
                           Action: HALT PRODUCTION · 100% inspect · Do not ship

🟠 MAJOR    (AQL 2.5)  →  Functional failure OR significant quality issue
                           Action: Rework or reject AQL sample lot

🟡 MINOR    (AQL 4.0)  →  Cosmetic or slight deviation from standard
                           Action: Note on report · Conditional accept
```

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

*Module: SankalpHub.in QC Intelligence Library v1.0*
