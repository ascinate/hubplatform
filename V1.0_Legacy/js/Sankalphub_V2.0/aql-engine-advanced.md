# AQL Calculation Engine — Implementation Guide
### SankalpHub.in · Production & Inspection Intelligence Platform
### Standard: ANSI / ASQ Z1.4 · Version 2.0

---

> **Document Scope:** Full AQL engine implementation for garment, gloves, footwear, headwear, and accessories inspection.
> Covers: Corrected sampling tables · SQL schema · Prisma schema · REST API · JavaScript/TypeScript service · React hook · Real-time defect counter · WebSocket logic.

---

## ⚠️ Corrections from v1.0

The following errors in the original document have been corrected in this version:

| # | Original Issue | Correction Applied |
|---|---------------|-------------------|
| 1 | Acceptance limits table missing sample sizes 2, 3, 5, 8, 13, 20, 32 | Full table added — all 16 sample sizes covered |
| 2 | `lot_size_max` undefined for `500001+` — causes SQL `NULL` failure | Set to `999999999` (safe INT max) |
| 3 | `critical_accept / critical_reject` columns absent from SQL schema | Added to schema; Critical AQL = 0.0 (zero tolerance) |
| 4 | Inspection levels I / III not implemented — code letter shifts ignored | Level I/II/III lookup table added with correct letter shifts |
| 5 | AQL 1.0 column entirely missing | Full AQL 1.0 column added to all tables |
| 6 | Sample size 500 / Minor = 21/22 — incorrect (arrow rule applies) | Arrow rule (`↑`) logic implemented in JS engine |
| 7 | SQL has no indexes — slow range queries on lot size | Composite indexes added |
| 8 | No `inspection_sessions` persistence table | Full session + defect log tables added |
| 9 | JS functions have no error handling, validation, or exports | Full TypeScript-typed service class with validation |
| 10 | No AQL level labels on acceptance limit columns | Columns renamed to `aql_X_X_accept/reject` pattern |

---

## 1. AQL Standard Reference (ANSI / ASQ Z1.4)

### 1.1 Inspection Levels

| Level | Code | Description | When to Use |
|-------|------|-------------|-------------|
| I | Reduced | One step left on code letter table | Low-risk supplier, excellent history |
| **II** | **Normal** | **Standard — default for all inspections** | **Most common; use unless history dictates otherwise** |
| III | Tightened | One step right on code letter table | New supplier, poor quality history, critical order |

> **Default: Level II.** Switch to Level III after 2 consecutive FAIL results. Revert to Level II after 5 consecutive PASS results on Level III.

---

### 1.2 Lot Size → Code Letter (All Three Levels)

| Lot Size | Level I | **Level II** | Level III |
|----------|---------|-------------|-----------|
| 2 – 8 | A | **A** | B |
| 9 – 15 | A | **B** | C |
| 16 – 25 | B | **C** | D |
| 26 – 50 | C | **D** | E |
| 51 – 90 | C | **E** | F |
| 91 – 150 | D | **F** | G |
| 151 – 280 | E | **G** | H |
| 281 – 500 | F | **H** | J |
| 501 – 1,200 | G | **J** | K |
| 1,201 – 3,200 | H | **K** | L |
| 3,201 – 10,000 | J | **L** | M |
| 10,001 – 35,000 | K | **M** | N |
| 35,001 – 150,000 | L | **N** | P |
| 150,001 – 500,000 | M | **P** | Q |
| 500,001 + | N | **Q** | R |

---

### 1.3 Code Letter → Sample Size

| Code | Sample Size | Code | Sample Size |
|------|------------|------|------------|
| A | 2 | J | 80 |
| B | 3 | K | 125 |
| C | 5 | L | 200 |
| D | 8 | M | 315 |
| E | 13 | N | 500 |
| F | 20 | P | 800 |
| G | 32 | Q | 1,250 |
| H | 50 | R | 2,000 |

---

### 1.4 Complete Acceptance Limits Table

> `Ac` = Accept if defects ≤ this number · `Re` = Reject if defects ≥ this number
> `↑` = Use next larger sample size / row · `↓` = Use next smaller sample size / row
> **Critical AQL = 0.0 (zero tolerance) — any Critical defect = automatic FAIL**

| Sample Size | AQL 1.0 Ac/Re | **AQL 2.5 Ac/Re** | **AQL 4.0 Ac/Re** |
|-------------|---------------|-------------------|-------------------|
| 2 | `↑` | `↑` | `↑` |
| 3 | `↑` | `↑` | 0 / 1 |
| 5 | 0 / 1 | `↑` | 0 / 1 |
| 8 | 0 / 1 | 0 / 1 | 1 / 2 |
| 13 | 0 / 1 | 1 / 2 | 1 / 2 |
| 20 | 0 / 1 | 1 / 2 | 2 / 3 |
| 32 | 1 / 2 | 2 / 3 | 3 / 4 |
| **50** | 1 / 2 | **3 / 4** | **5 / 6** |
| **80** | 2 / 3 | **5 / 6** | **7 / 8** |
| **125** | 3 / 4 | **7 / 8** | **10 / 11** |
| **200** | 5 / 6 | **10 / 11** | **14 / 15** |
| **315** | 7 / 8 | **14 / 15** | **21 / 22** |
| **500** | 10 / 11 | **21 / 22** | `↑` (use 315 row) |
| 800 | 14 / 15 | 21 / 22 | `↑` |
| 1,250 | 21 / 22 | 21 / 22 | `↑` |
| 2,000 | 21 / 22 | `↑` | `↑` |

> **Common apparel range highlighted in bold:** lot sizes 281–10,000 = sample sizes 50–315.

---

### 1.5 AQL Levels by Defect Classification

| Defect Class | AQL Level | Accept # (sample 80) | Reject # (sample 80) | Disposition |
|---|---|---|---|---|
| **Critical** | **0.0 (zero tolerance)** | **0** | **1** | **HALT — do not ship** |
| **Major** | **2.5** | **5** | **6** | Rework or reject lot |
| **Minor** | **4.0** | **7** | **8** | Conditional accept |

---

## 2. SQL Database Schema

### 2.1 Sampling Plan Table

```sql
CREATE TABLE aql_sampling_plan (
    id              SERIAL          PRIMARY KEY,
    lot_size_min    INT             NOT NULL,
    lot_size_max    INT             NOT NULL,  -- ✅ Fixed: was NULL for 500001+
    code_letter_l1  VARCHAR(2)      NOT NULL,  -- ✅ Added: Level I code letter
    code_letter_l2  VARCHAR(2)      NOT NULL,  -- Level II (default)
    code_letter_l3  VARCHAR(2)      NOT NULL,  -- ✅ Added: Level III code letter
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- ✅ Index for fast lot size range lookup
CREATE INDEX idx_aql_lot_range
    ON aql_sampling_plan (lot_size_min, lot_size_max);
```

### 2.2 Code Letter → Sample Size Table

```sql
CREATE TABLE aql_code_sample (
    id          SERIAL      PRIMARY KEY,
    code_letter VARCHAR(2)  NOT NULL UNIQUE,
    sample_size INT         NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_aql_code ON aql_code_sample (code_letter);
```

### 2.3 Acceptance Limits Table

```sql
CREATE TABLE aql_acceptance_limits (
    id                  SERIAL      PRIMARY KEY,
    sample_size         INT         NOT NULL UNIQUE,
    -- AQL 1.0 (used for Critical in some systems)
    aql_10_accept       INT,            -- NULL = use arrow rule (↑/↓)
    aql_10_reject       INT,
    aql_10_arrow        VARCHAR(5),     -- '↑' or '↓' or NULL
    -- AQL 2.5 (Major defects)
    aql_25_accept       INT,
    aql_25_reject       INT,
    aql_25_arrow        VARCHAR(5),
    -- AQL 4.0 (Minor defects)
    aql_40_accept       INT,
    aql_40_reject       INT,
    aql_40_arrow        VARCHAR(5),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_aql_sample ON aql_acceptance_limits (sample_size);
```

### 2.4 Inspection Sessions Table *(NEW — required for SankalpHub persistence)*

```sql
CREATE TABLE inspection_sessions (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            VARCHAR(100)    NOT NULL,
    product_id          VARCHAR(100)    NOT NULL,
    product_category    VARCHAR(50)     NOT NULL,   -- 'garments' | 'gloves' | 'footwear' etc.
    style_number        VARCHAR(50),
    lot_size            INT             NOT NULL,
    inspection_level    SMALLINT        NOT NULL DEFAULT 2,  -- 1 | 2 | 3
    code_letter         VARCHAR(2)      NOT NULL,
    sample_size         INT             NOT NULL,
    inspector_id        UUID,
    factory_id          UUID,
    inspection_date     DATE            NOT NULL DEFAULT CURRENT_DATE,
    status              VARCHAR(20)     NOT NULL DEFAULT 'IN_PROGRESS',
    -- status: 'IN_PROGRESS' | 'PASS' | 'FAIL' | 'PENDING_REVIEW'
    critical_found      INT             NOT NULL DEFAULT 0,
    major_found         INT             NOT NULL DEFAULT 0,
    minor_found         INT             NOT NULL DEFAULT 0,
    aql_result          VARCHAR(10),    -- 'PASS' | 'FAIL' | NULL while in progress
    notes               TEXT,
    created_at          TIMESTAMPTZ     DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX idx_session_order     ON inspection_sessions (order_id);
CREATE INDEX idx_session_product   ON inspection_sessions (product_id);
CREATE INDEX idx_session_factory   ON inspection_sessions (factory_id);
CREATE INDEX idx_session_date      ON inspection_sessions (inspection_date);
CREATE INDEX idx_session_result    ON inspection_sessions (aql_result);
```

### 2.5 Defect Log Table *(NEW — per-defect granular tracking)*

```sql
CREATE TABLE inspection_defect_log (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID            NOT NULL REFERENCES inspection_sessions(id) ON DELETE CASCADE,
    defect_code         VARCHAR(20)     NOT NULL,   -- e.g. 'G-MJ-01', 'FW-CR-02'
    defect_name         VARCHAR(200)    NOT NULL,
    defect_type         VARCHAR(50)     NOT NULL,   -- 'Fabric' | 'Stitching' | 'Assembly' etc.
    severity            VARCHAR(10)     NOT NULL,   -- 'CRITICAL' | 'MAJOR' | 'MINOR'
    quantity_found      INT             NOT NULL DEFAULT 1,
    garment_number      INT,                        -- which piece in sample (1 of 80, etc.)
    location_on_product VARCHAR(100),               -- e.g. 'Left sleeve', 'Front panel'
    photo_url           TEXT,
    inspector_note      TEXT,
    logged_at           TIMESTAMPTZ     DEFAULT NOW()
);

CREATE INDEX idx_defect_session  ON inspection_defect_log (session_id);
CREATE INDEX idx_defect_code     ON inspection_defect_log (defect_code);
CREATE INDEX idx_defect_severity ON inspection_defect_log (severity);
```

---

## 3. SQL Seed Data

### 3.1 Sampling Plan (All Levels)

```sql
INSERT INTO aql_sampling_plan
    (lot_size_min, lot_size_max, code_letter_l1, code_letter_l2, code_letter_l3)
VALUES
    (2,          8,          'A', 'A', 'B'),
    (9,          15,         'A', 'B', 'C'),
    (16,         25,         'B', 'C', 'D'),
    (26,         50,         'C', 'D', 'E'),
    (51,         90,         'C', 'E', 'F'),
    (91,         150,        'D', 'F', 'G'),
    (151,        280,        'E', 'G', 'H'),
    (281,        500,        'F', 'H', 'J'),
    (501,        1200,       'G', 'J', 'K'),
    (1201,       3200,       'H', 'K', 'L'),
    (3201,       10000,      'J', 'L', 'M'),
    (10001,      35000,      'K', 'M', 'N'),
    (35001,      150000,     'L', 'N', 'P'),
    (150001,     500000,     'M', 'P', 'Q'),
    (500001,     999999999,  'N', 'Q', 'R');  -- ✅ Fixed: was NULL, now 999999999
```

### 3.2 Code Letter → Sample Size

```sql
INSERT INTO aql_code_sample (code_letter, sample_size) VALUES
    ('A',  2),
    ('B',  3),
    ('C',  5),
    ('D',  8),
    ('E',  13),
    ('F',  20),
    ('G',  32),
    ('H',  50),
    ('J',  80),
    ('K',  125),
    ('L',  200),
    ('M',  315),
    ('N',  500),
    ('P',  800),
    ('Q',  1250),
    ('R',  2000);
```

### 3.3 Acceptance Limits (Complete — all sample sizes) ✅

```sql
-- ✅ Fixed: Original table was missing sample sizes 2–32
-- NULL = arrow rule applies (resolve in application layer)
INSERT INTO aql_acceptance_limits
    (sample_size,
     aql_10_accept, aql_10_reject, aql_10_arrow,
     aql_25_accept, aql_25_reject, aql_25_arrow,
     aql_40_accept, aql_40_reject, aql_40_arrow)
VALUES
--  size  |  AQL 1.0         |  AQL 2.5         |  AQL 4.0
    (2,    NULL,NULL,'↑',    NULL,NULL,'↑',    NULL,NULL,'↑'),
    (3,    NULL,NULL,'↑',    NULL,NULL,'↑',    0,   1,   NULL),
    (5,    0,   1,   NULL,   NULL,NULL,'↑',    0,   1,   NULL),
    (8,    0,   1,   NULL,   0,   1,   NULL,   1,   2,   NULL),
    (13,   0,   1,   NULL,   1,   2,   NULL,   1,   2,   NULL),
    (20,   0,   1,   NULL,   1,   2,   NULL,   2,   3,   NULL),
    (32,   1,   2,   NULL,   2,   3,   NULL,   3,   4,   NULL),
    (50,   1,   2,   NULL,   3,   4,   NULL,   5,   6,   NULL),
    (80,   2,   3,   NULL,   5,   6,   NULL,   7,   8,   NULL),
    (125,  3,   4,   NULL,   7,   8,   NULL,   10,  11,  NULL),
    (200,  5,   6,   NULL,   10,  11,  NULL,   14,  15,  NULL),
    (315,  7,   8,   NULL,   14,  15,  NULL,   21,  22,  NULL),
    (500,  10,  11,  NULL,   21,  22,  NULL,   NULL,NULL,'↑'),
    (800,  14,  15,  NULL,   21,  22,  NULL,   NULL,NULL,'↑'),
    (1250, 21,  22,  NULL,   21,  22,  NULL,   NULL,NULL,'↑'),
    (2000, 21,  22,  NULL,   NULL,NULL,'↑',    NULL,NULL,'↑');
```

---

## 4. Prisma Schema *(Modern Alternative for SankalpHub.in)*

```prisma
// schema.prisma

model AqlSamplingPlan {
  id             Int      @id @default(autoincrement())
  lotSizeMin     Int
  lotSizeMax     Int
  codeLetterL1   String   @db.VarChar(2)
  codeLetterL2   String   @db.VarChar(2)
  codeLetterL3   String   @db.VarChar(2)
  createdAt      DateTime @default(now())

  @@index([lotSizeMin, lotSizeMax])
  @@map("aql_sampling_plan")
}

model AqlCodeSample {
  id          Int      @id @default(autoincrement())
  codeLetter  String   @unique @db.VarChar(2)
  sampleSize  Int
  createdAt   DateTime @default(now())

  @@map("aql_code_sample")
}

model AqlAcceptanceLimits {
  id             Int      @id @default(autoincrement())
  sampleSize     Int      @unique
  aql10Accept    Int?
  aql10Reject    Int?
  aql10Arrow     String?  @db.VarChar(5)
  aql25Accept    Int?
  aql25Reject    Int?
  aql25Arrow     String?  @db.VarChar(5)
  aql40Accept    Int?
  aql40Reject    Int?
  aql40Arrow     String?  @db.VarChar(5)
  createdAt      DateTime @default(now())

  @@map("aql_acceptance_limits")
}

model InspectionSession {
  id               String    @id @default(uuid())
  orderId          String
  productId        String
  productCategory  String    @db.VarChar(50)
  styleNumber      String?   @db.VarChar(50)
  lotSize          Int
  inspectionLevel  Int       @default(2)
  codeLetter       String    @db.VarChar(2)
  sampleSize       Int
  inspectorId      String?
  factoryId        String?
  inspectionDate   DateTime  @default(now()) @db.Date
  status           String    @default("IN_PROGRESS") @db.VarChar(20)
  criticalFound    Int       @default(0)
  majorFound       Int       @default(0)
  minorFound       Int       @default(0)
  aqlResult        String?   @db.VarChar(10)
  notes            String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  defects          InspectionDefectLog[]

  @@index([orderId])
  @@index([productId])
  @@index([inspectionDate])
  @@index([aqlResult])
  @@map("inspection_sessions")
}

model InspectionDefectLog {
  id                String    @id @default(uuid())
  sessionId         String
  session           InspectionSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  defectCode        String    @db.VarChar(20)
  defectName        String    @db.VarChar(200)
  defectType        String    @db.VarChar(50)
  severity          String    @db.VarChar(10)
  quantityFound     Int       @default(1)
  garmentNumber     Int?
  locationOnProduct String?   @db.VarChar(100)
  photoUrl          String?
  inspectorNote     String?
  loggedAt          DateTime  @default(now())

  @@index([sessionId])
  @@index([defectCode])
  @@index([severity])
  @@map("inspection_defect_log")
}
```

---

## 5. TypeScript AQL Service

```typescript
// services/aql.service.ts

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type InspectionLevel = 1 | 2 | 3;
export type Severity        = 'CRITICAL' | 'MAJOR' | 'MINOR';
export type AQLResult       = 'PASS' | 'FAIL' | 'PENDING';
export type ArrowDirection  = '↑' | '↓' | null;

export interface LotSizeRow {
  lotSizeMin:    number;
  lotSizeMax:    number;
  codeLetterL1:  string;
  codeLetterL2:  string;
  codeLetterL3:  string;
}

export interface AcceptanceLimitRow {
  sampleSize:  number;
  aql10Accept: number | null;
  aql10Reject: number | null;
  aql10Arrow:  ArrowDirection;
  aql25Accept: number | null;
  aql25Reject: number | null;
  aql25Arrow:  ArrowDirection;
  aql40Accept: number | null;
  aql40Reject: number | null;
  aql40Arrow:  ArrowDirection;
}

export interface AQLInput {
  lotSize:          number;
  criticalDefects:  number;
  majorDefects:     number;
  minorDefects:     number;
  inspectionLevel?: InspectionLevel;  // default: 2
}

export interface AQLOutput {
  codeLetter:     string;
  sampleSize:     number;
  limits: {
    critical: { accept: number; reject: number };
    major:    { accept: number; reject: number };
    minor:    { accept: number; reject: number };
  };
  counts: {
    critical: number;
    major:    number;
    minor:    number;
  };
  result:     AQLResult;
  failReason: string | null;
  warnings:   string[];
}

// ─── EMBEDDED REFERENCE DATA (no DB call needed for simple use) ──────────────

const LOT_SIZE_TABLE: LotSizeRow[] = [
  { lotSizeMin: 2,      lotSizeMax: 8,         codeLetterL1: 'A', codeLetterL2: 'A', codeLetterL3: 'B' },
  { lotSizeMin: 9,      lotSizeMax: 15,        codeLetterL1: 'A', codeLetterL2: 'B', codeLetterL3: 'C' },
  { lotSizeMin: 16,     lotSizeMax: 25,        codeLetterL1: 'B', codeLetterL2: 'C', codeLetterL3: 'D' },
  { lotSizeMin: 26,     lotSizeMax: 50,        codeLetterL1: 'C', codeLetterL2: 'D', codeLetterL3: 'E' },
  { lotSizeMin: 51,     lotSizeMax: 90,        codeLetterL1: 'C', codeLetterL2: 'E', codeLetterL3: 'F' },
  { lotSizeMin: 91,     lotSizeMax: 150,       codeLetterL1: 'D', codeLetterL2: 'F', codeLetterL3: 'G' },
  { lotSizeMin: 151,    lotSizeMax: 280,       codeLetterL1: 'E', codeLetterL2: 'G', codeLetterL3: 'H' },
  { lotSizeMin: 281,    lotSizeMax: 500,       codeLetterL1: 'F', codeLetterL2: 'H', codeLetterL3: 'J' },
  { lotSizeMin: 501,    lotSizeMax: 1200,      codeLetterL1: 'G', codeLetterL2: 'J', codeLetterL3: 'K' },
  { lotSizeMin: 1201,   lotSizeMax: 3200,      codeLetterL1: 'H', codeLetterL2: 'K', codeLetterL3: 'L' },
  { lotSizeMin: 3201,   lotSizeMax: 10000,     codeLetterL1: 'J', codeLetterL2: 'L', codeLetterL3: 'M' },
  { lotSizeMin: 10001,  lotSizeMax: 35000,     codeLetterL1: 'K', codeLetterL2: 'M', codeLetterL3: 'N' },
  { lotSizeMin: 35001,  lotSizeMax: 150000,    codeLetterL1: 'L', codeLetterL2: 'N', codeLetterL3: 'P' },
  { lotSizeMin: 150001, lotSizeMax: 500000,    codeLetterL1: 'M', codeLetterL2: 'P', codeLetterL3: 'Q' },
  { lotSizeMin: 500001, lotSizeMax: 999999999, codeLetterL1: 'N', codeLetterL2: 'Q', codeLetterL3: 'R' },
];

const CODE_SAMPLE_MAP: Record<string, number> = {
  A: 2, B: 3, C: 5, D: 8, E: 13, F: 20,
  G: 32, H: 50, J: 80, K: 125, L: 200,
  M: 315, N: 500, P: 800, Q: 1250, R: 2000,
};

/** Ordered for arrow-rule resolution */
const CODE_ORDER = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R'];

const ACCEPTANCE_LIMITS: AcceptanceLimitRow[] = [
  { sampleSize: 2,    aql10Accept: null, aql10Reject: null, aql10Arrow: '↑', aql25Accept: null, aql25Reject: null, aql25Arrow: '↑', aql40Accept: null, aql40Reject: null, aql40Arrow: '↑' },
  { sampleSize: 3,    aql10Accept: null, aql10Reject: null, aql10Arrow: '↑', aql25Accept: null, aql25Reject: null, aql25Arrow: '↑', aql40Accept: 0,    aql40Reject: 1,    aql40Arrow: null },
  { sampleSize: 5,    aql10Accept: 0,    aql10Reject: 1,    aql10Arrow: null, aql25Accept: null, aql25Reject: null, aql25Arrow: '↑', aql40Accept: 0,    aql40Reject: 1,    aql40Arrow: null },
  { sampleSize: 8,    aql10Accept: 0,    aql10Reject: 1,    aql10Arrow: null, aql25Accept: 0,    aql25Reject: 1,    aql25Arrow: null, aql40Accept: 1,    aql40Reject: 2,    aql40Arrow: null },
  { sampleSize: 13,   aql10Accept: 0,    aql10Reject: 1,    aql10Arrow: null, aql25Accept: 1,    aql25Reject: 2,    aql25Arrow: null, aql40Accept: 1,    aql40Reject: 2,    aql40Arrow: null },
  { sampleSize: 20,   aql10Accept: 0,    aql10Reject: 1,    aql10Arrow: null, aql25Accept: 1,    aql25Reject: 2,    aql25Arrow: null, aql40Accept: 2,    aql40Reject: 3,    aql40Arrow: null },
  { sampleSize: 32,   aql10Accept: 1,    aql10Reject: 2,    aql10Arrow: null, aql25Accept: 2,    aql25Reject: 3,    aql25Arrow: null, aql40Accept: 3,    aql40Reject: 4,    aql40Arrow: null },
  { sampleSize: 50,   aql10Accept: 1,    aql10Reject: 2,    aql10Arrow: null, aql25Accept: 3,    aql25Reject: 4,    aql25Arrow: null, aql40Accept: 5,    aql40Reject: 6,    aql40Arrow: null },
  { sampleSize: 80,   aql10Accept: 2,    aql10Reject: 3,    aql10Arrow: null, aql25Accept: 5,    aql25Reject: 6,    aql25Arrow: null, aql40Accept: 7,    aql40Reject: 8,    aql40Arrow: null },
  { sampleSize: 125,  aql10Accept: 3,    aql10Reject: 4,    aql10Arrow: null, aql25Accept: 7,    aql25Reject: 8,    aql25Arrow: null, aql40Accept: 10,   aql40Reject: 11,   aql40Arrow: null },
  { sampleSize: 200,  aql10Accept: 5,    aql10Reject: 6,    aql10Arrow: null, aql25Accept: 10,   aql25Reject: 11,   aql25Arrow: null, aql40Accept: 14,   aql40Reject: 15,   aql40Arrow: null },
  { sampleSize: 315,  aql10Accept: 7,    aql10Reject: 8,    aql10Arrow: null, aql25Accept: 14,   aql25Reject: 15,   aql25Arrow: null, aql40Accept: 21,   aql40Reject: 22,   aql40Arrow: null },
  { sampleSize: 500,  aql10Accept: 10,   aql10Reject: 11,   aql10Arrow: null, aql25Accept: 21,   aql25Reject: 22,   aql25Arrow: null, aql40Accept: null, aql40Reject: null, aql40Arrow: '↑' },
  { sampleSize: 800,  aql10Accept: 14,   aql10Reject: 15,   aql10Arrow: null, aql25Accept: 21,   aql25Reject: 22,   aql25Arrow: null, aql40Accept: null, aql40Reject: null, aql40Arrow: '↑' },
  { sampleSize: 1250, aql10Accept: 21,   aql10Reject: 22,   aql10Arrow: null, aql25Accept: 21,   aql25Reject: 22,   aql25Arrow: null, aql40Accept: null, aql40Reject: null, aql40Arrow: '↑' },
  { sampleSize: 2000, aql10Accept: 21,   aql10Reject: 22,   aql10Arrow: null, aql25Accept: null, aql25Reject: null, aql25Arrow: '↑', aql40Accept: null, aql40Reject: null, aql40Arrow: '↑' },
];

// ─── AQL SERVICE CLASS ────────────────────────────────────────────────────────

export class AQLService {

  // ── Step 1: Get code letter from lot size ──────────────────────────────────
  getCodeLetter(lotSize: number, level: InspectionLevel = 2): string {
    if (lotSize < 2) throw new Error('Lot size must be at least 2');

    const row = LOT_SIZE_TABLE.find(
      r => lotSize >= r.lotSizeMin && lotSize <= r.lotSizeMax
    );
    if (!row) throw new Error(`No code letter found for lot size ${lotSize}`);

    const key = `codeLetterL${level}` as keyof LotSizeRow;
    return row[key] as string;
  }

  // ── Step 2: Get sample size from code letter ───────────────────────────────
  getSampleSize(codeLetter: string): number {
    const size = CODE_SAMPLE_MAP[codeLetter.toUpperCase()];
    if (size === undefined) throw new Error(`Unknown code letter: ${codeLetter}`);
    return size;
  }

  // ── Step 3: Resolve arrow rule — find effective limits ────────────────────
  private resolveArrow(
    sampleSize: number,
    aqlKey: 'aql10' | 'aql25' | 'aql40'
  ): { accept: number; reject: number; resolvedSampleSize: number } {
    const acceptKey = `${aqlKey}Accept` as keyof AcceptanceLimitRow;
    const rejectKey = `${aqlKey}Reject` as keyof AcceptanceLimitRow;
    const arrowKey  = `${aqlKey}Arrow`  as keyof AcceptanceLimitRow;

    // Walk up the table until we find a non-arrow row
    const sortedLimits = [...ACCEPTANCE_LIMITS].sort((a, b) => a.sampleSize - b.sampleSize);
    const startIdx = sortedLimits.findIndex(r => r.sampleSize === sampleSize);
    if (startIdx === -1) throw new Error(`No acceptance limits for sample size ${sampleSize}`);

    let idx = startIdx;
    const row = sortedLimits[idx];
    const arrow = row[arrowKey] as ArrowDirection;

    if (arrow === null) {
      return {
        accept: row[acceptKey] as number,
        reject: row[rejectKey] as number,
        resolvedSampleSize: sampleSize,
      };
    }

    // Follow arrow direction
    const direction = arrow === '↑' ? 1 : -1;
    while (idx >= 0 && idx < sortedLimits.length) {
      idx += direction;
      if (idx < 0 || idx >= sortedLimits.length) break;
      const candidate = sortedLimits[idx];
      const candidateArrow = candidate[arrowKey] as ArrowDirection;
      if (candidateArrow === null && candidate[acceptKey] !== null) {
        return {
          accept: candidate[acceptKey] as number,
          reject: candidate[rejectKey] as number,
          resolvedSampleSize: candidate.sampleSize,
        };
      }
    }

    throw new Error(`Arrow rule could not be resolved for sample size ${sampleSize} / ${aqlKey}`);
  }

  // ── Step 4: Get acceptance limits for a sample size ───────────────────────
  getAcceptanceLimits(sampleSize: number): {
    major: { accept: number; reject: number };
    minor: { accept: number; reject: number };
  } {
    const major = this.resolveArrow(sampleSize, 'aql25');
    const minor = this.resolveArrow(sampleSize, 'aql40');
    return {
      major: { accept: major.accept, reject: major.reject },
      minor: { accept: minor.accept, reject: minor.reject },
    };
  }

  // ── Step 5: Calculate full AQL result ─────────────────────────────────────
  calculate(input: AQLInput): AQLOutput {
    // Input validation
    if (!Number.isInteger(input.lotSize) || input.lotSize < 2) {
      throw new Error('lotSize must be an integer ≥ 2');
    }
    if (input.criticalDefects < 0 || input.majorDefects < 0 || input.minorDefects < 0) {
      throw new Error('Defect counts cannot be negative');
    }

    const level       = input.inspectionLevel ?? 2;
    const codeLetter  = this.getCodeLetter(input.lotSize, level);
    const sampleSize  = this.getSampleSize(codeLetter);
    const limits      = this.getAcceptanceLimits(sampleSize);

    const failReasons: string[] = [];
    const warnings:   string[] = [];

    // Critical — always zero tolerance
    if (input.criticalDefects > 0) {
      failReasons.push(
        `CRITICAL defects found: ${input.criticalDefects}. Zero tolerance — automatic FAIL.`
      );
    }

    // Major
    if (input.majorDefects >= limits.major.reject) {
      failReasons.push(
        `Major defects (${input.majorDefects}) ≥ reject number (${limits.major.reject}) for AQL 2.5.`
      );
    } else if (input.majorDefects === limits.major.accept) {
      warnings.push(
        `⚠ Major defects (${input.majorDefects}) at accept limit — one more will FAIL.`
      );
    }

    // Minor
    if (input.minorDefects >= limits.minor.reject) {
      failReasons.push(
        `Minor defects (${input.minorDefects}) ≥ reject number (${limits.minor.reject}) for AQL 4.0.`
      );
    } else if (input.minorDefects === limits.minor.accept) {
      warnings.push(
        `⚠ Minor defects (${input.minorDefects}) at accept limit — one more will FAIL.`
      );
    }

    // Sample size warning
    if (sampleSize > input.lotSize) {
      warnings.push(
        `⚠ Calculated sample size (${sampleSize}) exceeds lot size (${input.lotSize}). Inspect 100%.`
      );
    }

    const result: AQLResult = failReasons.length > 0 ? 'FAIL' : 'PASS';

    return {
      codeLetter,
      sampleSize,
      limits: {
        critical: { accept: 0, reject: 1 },
        major:    limits.major,
        minor:    limits.minor,
      },
      counts: {
        critical: input.criticalDefects,
        major:    input.majorDefects,
        minor:    input.minorDefects,
      },
      result,
      failReason: failReasons.length > 0 ? failReasons.join(' | ') : null,
      warnings,
    };
  }

  // ── Real-time: Check if inspection should stop immediately ────────────────
  shouldStopImmediately(
    criticalCount: number,
    majorCount:    number,
    minorCount:    number,
    sampleSize:    number
  ): { stop: boolean; reason: string | null } {
    if (criticalCount > 0) {
      return { stop: true, reason: 'Critical defect found — HALT inspection immediately.' };
    }
    const limits = this.getAcceptanceLimits(sampleSize);
    if (majorCount >= limits.major.reject) {
      return { stop: true, reason: `Major defects reached reject limit (${limits.major.reject}).` };
    }
    if (minorCount >= limits.minor.reject) {
      return { stop: true, reason: `Minor defects reached reject limit (${limits.minor.reject}).` };
    }
    return { stop: false, reason: null };
  }

  // ── Defect rate as percentage ─────────────────────────────────────────────
  defectRate(defectCount: number, sampleSize: number): string {
    return ((defectCount / sampleSize) * 100).toFixed(2) + '%';
  }
}

export const aqlService = new AQLService();
```

---

## 6. REST API — Express.js Route Handlers

```typescript
// routes/aql.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { aqlService } from '../services/aql.service';

const router = Router();

// ── POST /api/aql/calculate ───────────────────────────────────────────────────
/**
 * @route   POST /api/aql/calculate
 * @desc    Calculate AQL pass/fail result for an inspection
 * @body    { lot_size, critical_defects, major_defects, minor_defects, inspection_level? }
 */
router.post('/calculate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      lot_size,
      critical_defects = 0,
      major_defects    = 0,
      minor_defects    = 0,
      inspection_level = 2,
    } = req.body;

    if (!lot_size) {
      return res.status(400).json({ error: 'lot_size is required' });
    }

    const result = aqlService.calculate({
      lotSize:         Number(lot_size),
      criticalDefects: Number(critical_defects),
      majorDefects:    Number(major_defects),
      minorDefects:    Number(minor_defects),
      inspectionLevel: Number(inspection_level) as 1 | 2 | 3,
    });

    return res.json({
      success: true,
      data: {
        code_letter:    result.codeLetter,
        sample_size:    result.sampleSize,
        limits: {
          critical: result.limits.critical,
          major:    result.limits.major,
          minor:    result.limits.minor,
        },
        counts: result.counts,
        result:         result.result,          // 'PASS' | 'FAIL'
        fail_reason:    result.failReason,
        warnings:       result.warnings,
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/aql/sample-size ──────────────────────────────────────────────────
/**
 * @route   GET /api/aql/sample-size?lot_size=1200&level=2
 * @desc    Get code letter and sample size for a given lot size
 */
router.get('/sample-size', (req: Request, res: Response, next: NextFunction) => {
  try {
    const lotSize = Number(req.query.lot_size);
    const level   = Number(req.query.level ?? 2) as 1 | 2 | 3;

    if (isNaN(lotSize) || lotSize < 2) {
      return res.status(400).json({ error: 'lot_size must be a number ≥ 2' });
    }

    const codeLetter = aqlService.getCodeLetter(lotSize, level);
    const sampleSize = aqlService.getSampleSize(codeLetter);

    return res.json({
      success:     true,
      lot_size:    lotSize,
      level,
      code_letter: codeLetter,
      sample_size: sampleSize,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/aql/limits?sample_size=80 ───────────────────────────────────────
/**
 * @route   GET /api/aql/limits?sample_size=80
 * @desc    Get accept/reject limits for a given sample size
 */
router.get('/limits', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sampleSize = Number(req.query.sample_size);
    if (isNaN(sampleSize)) {
      return res.status(400).json({ error: 'sample_size must be a number' });
    }

    const limits = aqlService.getAcceptanceLimits(sampleSize);

    return res.json({
      success:     true,
      sample_size: sampleSize,
      limits: {
        critical: { accept: 0, reject: 1, aql: '0.0 (zero tolerance)' },
        major:    { ...limits.major, aql: '2.5' },
        minor:    { ...limits.minor, aql: '4.0' },
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/aql/quick-check — real-time live check during inspection ──────
/**
 * @route   GET /api/aql/quick-check?sample_size=80&critical=0&major=4&minor=6
 * @desc    Real-time status check — used by live inspector UI
 */
router.get('/quick-check', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sampleSize = Number(req.query.sample_size);
    const critical   = Number(req.query.critical   ?? 0);
    const major      = Number(req.query.major      ?? 0);
    const minor      = Number(req.query.minor      ?? 0);

    const stopCheck = aqlService.shouldStopImmediately(critical, major, minor, sampleSize);
    const limits    = aqlService.getAcceptanceLimits(sampleSize);

    return res.json({
      success: true,
      should_stop: stopCheck.stop,
      stop_reason: stopCheck.reason,
      current: { critical, major, minor },
      limits: {
        critical: { accept: 0, reject: 1 },
        major:    limits.major,
        minor:    limits.minor,
      },
      status: {
        critical: critical > 0          ? 'FAIL'    : 'OK',
        major:    major >= limits.major.reject ? 'FAIL'
               : major === limits.major.accept ? 'WARNING' : 'OK',
        minor:    minor >= limits.minor.reject ? 'FAIL'
               : minor === limits.minor.accept ? 'WARNING' : 'OK',
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
```

---

## 7. React Hook — `useAQLInspection`

```typescript
// hooks/useAQLInspection.ts
import { useState, useCallback, useMemo } from 'react';
import { aqlService, AQLOutput, InspectionLevel } from '../services/aql.service';

interface UseAQLInspectionProps {
  lotSize:          number;
  inspectionLevel?: InspectionLevel;
}

interface DefectCounts {
  critical: number;
  major:    number;
  minor:    number;
}

interface LiveStatus {
  critical: 'OK' | 'WARNING' | 'FAIL';
  major:    'OK' | 'WARNING' | 'FAIL';
  minor:    'OK' | 'WARNING' | 'FAIL';
  overall:  'PASS' | 'FAIL' | 'IN_PROGRESS';
}

export function useAQLInspection({ lotSize, inspectionLevel = 2 }: UseAQLInspectionProps) {
  const [defects, setDefects] = useState<DefectCounts>({
    critical: 0, major: 0, minor: 0,
  });

  // Pre-compute code letter and sample size (stable for this lot)
  const { codeLetter, sampleSize, limits } = useMemo(() => {
    const cl  = aqlService.getCodeLetter(lotSize, inspectionLevel);
    const ss  = aqlService.getSampleSize(cl);
    const lim = aqlService.getAcceptanceLimits(ss);
    return { codeLetter: cl, sampleSize: ss, limits: lim };
  }, [lotSize, inspectionLevel]);

  // Live status computed on every defect change
  const liveStatus = useMemo((): LiveStatus => {
    const getStatus = (count: number, accept: number, reject: number) => {
      if (count >= reject)  return 'FAIL';
      if (count >= accept)  return 'WARNING';
      return 'OK';
    };

    const critStatus = defects.critical > 0 ? 'FAIL' : 'OK';
    const majStatus  = getStatus(defects.major, limits.major.accept, limits.major.reject);
    const minStatus  = getStatus(defects.minor, limits.minor.accept, limits.minor.reject);

    const overall = (critStatus === 'FAIL' || majStatus === 'FAIL' || minStatus === 'FAIL')
      ? 'FAIL' : 'IN_PROGRESS';

    return { critical: critStatus, major: majStatus, minor: minStatus, overall };
  }, [defects, limits]);

  // Add a defect
  const addDefect = useCallback((severity: keyof DefectCounts, count = 1) => {
    setDefects(prev => ({ ...prev, [severity]: prev[severity] + count }));
  }, []);

  // Remove a defect (correction)
  const removeDefect = useCallback((severity: keyof DefectCounts, count = 1) => {
    setDefects(prev => ({
      ...prev,
      [severity]: Math.max(0, prev[severity] - count),
    }));
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    setDefects({ critical: 0, major: 0, minor: 0 });
  }, []);

  // Final result calculation
  const finalResult = useCallback((): AQLOutput => {
    return aqlService.calculate({
      lotSize,
      criticalDefects: defects.critical,
      majorDefects:    defects.major,
      minorDefects:    defects.minor,
      inspectionLevel,
    });
  }, [lotSize, inspectionLevel, defects]);

  return {
    // Session info
    codeLetter,
    sampleSize,
    limits,
    // Live state
    defects,
    liveStatus,
    // Actions
    addDefect,
    removeDefect,
    resetSession,
    finalResult,
  };
}
```

### React Component Usage Example

```tsx
// components/LiveInspectionPanel.tsx
import { useAQLInspection } from '../hooks/useAQLInspection';

const STATUS_COLORS = {
  OK:          '#1A8A4A',
  WARNING:     '#E67E22',
  FAIL:        '#C0392B',
  IN_PROGRESS: '#2E86C1',
  PASS:        '#1A8A4A',
};

export function LiveInspectionPanel({ lotSize }: { lotSize: number }) {
  const {
    codeLetter, sampleSize, limits,
    defects, liveStatus,
    addDefect, removeDefect, resetSession, finalResult,
  } = useAQLInspection({ lotSize, inspectionLevel: 2 });

  return (
    <div className="inspection-panel">
      {/* Session Info */}
      <div className="session-info">
        <span>Lot: <strong>{lotSize}</strong></span>
        <span>Code: <strong>{codeLetter}</strong></span>
        <span>Sample: <strong>{sampleSize} pcs</strong></span>
      </div>

      {/* Live Defect Counter */}
      {(['critical', 'major', 'minor'] as const).map(sev => (
        <div key={sev} className="defect-row"
             style={{ borderLeft: `4px solid ${STATUS_COLORS[liveStatus[sev]]}` }}>
          <span className="sev-label">{sev.toUpperCase()}</span>
          <span className="count">
            {defects[sev]} / {sev === 'critical' ? 0 : limits[sev].accept}
          </span>
          <span className="limit">
            Reject ≥ {sev === 'critical' ? 1 : limits[sev].reject}
          </span>
          <span className={`badge badge-${liveStatus[sev].toLowerCase()}`}>
            {liveStatus[sev] === 'WARNING' ? '⚠ Near Limit'
           : liveStatus[sev] === 'FAIL'    ? '❌ FAIL'
           :                                 '✓ OK'}
          </span>
          <button onClick={() => addDefect(sev)}>＋</button>
          <button onClick={() => removeDefect(sev)}>－</button>
        </div>
      ))}

      {/* Overall Status */}
      <div className="overall-status"
           style={{ background: STATUS_COLORS[liveStatus.overall] }}>
        {liveStatus.overall}
      </div>

      <button onClick={resetSession}>Reset Session</button>
    </div>
  );
}
```

---

## 8. Real-Time WebSocket Defect Counter

```typescript
// websocket/inspection.ws.ts
// For live inspection rooms — multiple devices updating defect count simultaneously

import { Server as SocketServer } from 'socket.io';
import { aqlService } from '../services/aql.service';

interface InspectionRoom {
  sessionId:   string;
  sampleSize:  number;
  defects:     { critical: number; major: number; minor: number };
  inspectors:  Set<string>;
}

const rooms = new Map<string, InspectionRoom>();

export function initInspectionWebSocket(io: SocketServer) {

  io.on('connection', socket => {

    // ── Join an inspection session room ──────────────────────────────────────
    socket.on('join_session', ({ sessionId, sampleSize }) => {
      socket.join(sessionId);

      if (!rooms.has(sessionId)) {
        rooms.set(sessionId, {
          sessionId,
          sampleSize,
          defects: { critical: 0, major: 0, minor: 0 },
          inspectors: new Set(),
        });
      }

      const room = rooms.get(sessionId)!;
      room.inspectors.add(socket.id);

      // Send current state to joining inspector
      socket.emit('session_state', buildState(room));
    });

    // ── Inspector records a defect ───────────────────────────────────────────
    socket.on('add_defect', ({
      sessionId,
      severity,   // 'critical' | 'major' | 'minor'
      defectCode,
      garmentNo,
    }) => {
      const room = rooms.get(sessionId);
      if (!room) return socket.emit('error', { message: 'Session not found' });

      // Increment count
      room.defects[severity as keyof typeof room.defects]++;

      // Check if inspection should stop
      const stopCheck = aqlService.shouldStopImmediately(
        room.defects.critical,
        room.defects.major,
        room.defects.minor,
        room.sampleSize
      );

      const state = buildState(room);

      // Broadcast updated state to all in room
      io.to(sessionId).emit('defect_update', {
        ...state,
        last_defect: { severity, defectCode, garmentNo },
        should_stop: stopCheck.stop,
        stop_reason: stopCheck.reason,
      });

      // Alert if inspection must stop
      if (stopCheck.stop) {
        io.to(sessionId).emit('inspection_halt', {
          reason: stopCheck.reason,
          final_counts: room.defects,
        });
      }
    });

    // ── Remove/correct a defect ──────────────────────────────────────────────
    socket.on('remove_defect', ({ sessionId, severity }) => {
      const room = rooms.get(sessionId);
      if (!room) return;
      const key = severity as keyof typeof room.defects;
      room.defects[key] = Math.max(0, room.defects[key] - 1);
      io.to(sessionId).emit('defect_update', buildState(room));
    });

    // ── Finalise session ─────────────────────────────────────────────────────
    socket.on('finalise_session', ({ sessionId }) => {
      const room = rooms.get(sessionId);
      if (!room) return;
      const finalResult = aqlService.shouldStopImmediately(
        room.defects.critical, room.defects.major, room.defects.minor, room.sampleSize
      );
      const result = finalResult.stop ? 'FAIL' : 'PASS';
      io.to(sessionId).emit('session_complete', {
        result,
        final_counts: room.defects,
        fail_reason: finalResult.reason,
      });
      rooms.delete(sessionId);
    });

    // ── Cleanup on disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      rooms.forEach(room => {
        room.inspectors.delete(socket.id);
      });
    });
  });
}

function buildState(room: InspectionRoom) {
  const limits = aqlService.getAcceptanceLimits(room.sampleSize);
  return {
    sessionId:  room.sessionId,
    sampleSize: room.sampleSize,
    defects:    room.defects,
    limits: {
      critical: { accept: 0, reject: 1 },
      major:    limits.major,
      minor:    limits.minor,
    },
    status: {
      critical: room.defects.critical > 0                                ? 'FAIL'
              :                                                             'OK',
      major:    room.defects.major >= limits.major.reject                 ? 'FAIL'
              : room.defects.major >= limits.major.accept                 ? 'WARNING' : 'OK',
      minor:    room.defects.minor >= limits.minor.reject                 ? 'FAIL'
              : room.defects.minor >= limits.minor.accept                 ? 'WARNING' : 'OK',
    },
    inspectorCount: room.inspectors.size,
  };
}
```

---

## 9. Inspection UI States — Display Logic

### Standard Display

```
┌──────────────────────────────────────────┐
│  INSPECTION STATUS          Sample: 80   │
├──────────────────────────────────────────┤
│  Critical   0 / 0     Reject ≥ 1   ✓ OK │
│  Major      4 / 5     Reject ≥ 6   ✓ OK │
│  Minor      6 / 7     Reject ≥ 8   ✓ OK │
├──────────────────────────────────────────┤
│  Status: ● PASS                          │
└──────────────────────────────────────────┘
```

### Warning State *(at accept limit — one more = FAIL)*

```
┌──────────────────────────────────────────┐
│  INSPECTION STATUS          Sample: 80   │
├──────────────────────────────────────────┤
│  Critical   0 / 0     Reject ≥ 1   ✓ OK │
│  Major      5 / 5     Reject ≥ 6  ⚠ AT LIMIT │
│  Minor      6 / 7     Reject ≥ 8   ✓ OK │
├──────────────────────────────────────────┤
│  Status: ⚠ IN PROGRESS — 1 more Major = FAIL  │
└──────────────────────────────────────────┘
```

### Fail State

```
┌──────────────────────────────────────────┐
│  INSPECTION STATUS          Sample: 80   │
├──────────────────────────────────────────┤
│  Critical   0 / 0     Reject ≥ 1   ✓ OK │
│  Major      6 / 5     Reject ≥ 6  ❌ FAIL │
│  Minor      7 / 7     Reject ≥ 8   ✓ OK │
├──────────────────────────────────────────┤
│  Status: ❌ FAIL — Major defects exceed AQL 2.5 │
└──────────────────────────────────────────┘
```

### Critical Halt State *(immediate stop)*

```
┌──────────────────────────────────────────┐
│  🛑 INSPECTION HALTED                    │
│  Critical defect found — STOP immediately│
│  Do not proceed. Notify QC Manager.      │
└──────────────────────────────────────────┘
```

---

## 10. AQL Quick-Reference — Common Apparel Inspection Scenarios

| Lot Size | Level | Code | Sample | Major (Ac/Re) | Minor (Ac/Re) | Critical |
|----------|-------|------|--------|--------------|--------------|---------|
| 350 | II | H | 50 | 3 / 4 | 5 / 6 | 0 / 1 |
| 800 | II | J | 80 | 5 / 6 | 7 / 8 | 0 / 1 |
| 1,500 | II | K | 125 | 7 / 8 | 10 / 11 | 0 / 1 |
| 5,000 | II | L | 200 | 10 / 11 | 14 / 15 | 0 / 1 |
| 8,000 | II | L | 200 | 10 / 11 | 14 / 15 | 0 / 1 |
| 15,000 | II | M | 315 | 14 / 15 | 21 / 22 | 0 / 1 |
| 800 | III | K | 125 | 7 / 8 | 10 / 11 | 0 / 1 |
| 800 | I | H | 50 | 3 / 4 | 5 / 6 | 0 / 1 |

---

## 11. SankalpHub.in Integration Checklist

```
✅ Database
  □ Run SQL schema migrations (or prisma db push)
  □ Seed aql_sampling_plan (15 rows)
  □ Seed aql_code_sample (16 rows)
  □ Seed aql_acceptance_limits (16 rows)
  □ Verify indexes created

✅ Backend
  □ Import AQLService into your inspection controller
  □ Mount aql.routes.ts at /api/aql
  □ Initialise WebSocket server with initInspectionWebSocket()
  □ Add error-handling middleware for AQL service errors

✅ Frontend
  □ Install useAQLInspection hook in inspection form
  □ Wire addDefect() to defect type buttons
  □ Connect WebSocket events: defect_update, inspection_halt, session_complete
  □ Style status badges using STATUS_COLORS map
  □ Add lot size input → auto-calculates sample size on change

✅ Testing
  □ Lot size 1200 → Code J → Sample 80 → Major (5/6) Minor (7/8)
  □ Lot size 350  → Code H → Sample 50 → Major (3/4) Minor (5/6)
  □ Critical = 1  → always FAIL regardless of major/minor counts
  □ Arrow rule: sample 500 / AQL 4.0 → resolves to 315 row (21/22)
```

---

## 12. Recommended Enhancements (Roadmap)

| Priority | Feature | Description |
|----------|---------|-------------|
| 🔴 High | Tightened/Reduced switching | Auto-switch Level III after 2 FAIL, revert after 5 PASS |
| 🔴 High | Supplier risk scoring | Weight AQL level by supplier defect history |
| 🟠 Medium | Product-specific AQL rules | Different AQL per product category (e.g. stricter for HiVis) |
| 🟠 Medium | Photo capture in defect log | Camera integration for defect documentation |
| 🟡 Low | Offline inspection mode | PWA with IndexedDB sync for factory floor without WiFi |
| 🟡 Low | Automated inspection report PDF | Auto-generate inspection report on session close |
| 🟡 Low | Defect trend heatmap | Visual map of defect frequency by product and factory |

---

*Standard: ANSI / ASQ Z1.4 — Sampling Procedures and Tables for Inspection by Attributes*
*Platform: SankalpHub.in QC Intelligence Module v2.0*
*Generated for: Claude Code integration — Node.js / TypeScript / React*
