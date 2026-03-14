# Skill: QC Deep Scan

> **Trigger:** Runs every 2 hours via `/loop 2h`

> **Agent:** AQL-AGENT + DEFECTS-AGENT (parallel) → REVIEW-AGENT → QC-LEAD (report)

> **Severity:** WARN

> **Write Access:** ❌ None — read-only audit only

  

---

  

## Purpose

  

Full audit of the AQL engine, defect library, and production stage coverage. This scan validates that every active inspection lot is operating within ANSI/ASQ Z1.4 parameters, that all defect codes are properly mapped to severity tiers, and that the 21-stage workflow has no gaps in coverage. Surfaces anomalies as discussion cards for Naveen.

  

---

  

## Part A — AQL Engine Audit (AQL-AGENT)

  

### A1. Sample Size Validation

For every active inspection lot:

- Retrieve lot size from database (read-only Prisma query)

- Cross-reference with ANSI/ASQ Z1.4 sample size table (Inspection Level II by default)

- Verify actual sample size taken matches the standard requirement

- Flag any lot where sample size is under the required minimum

  

**Z1.4 Quick Reference (Normal Inspection, Level II):**

| Lot Size | Sample Size Code | Sample Size |

|----------|-----------------|-------------|

| 2–8 | A | 2 |

| 9–15 | B | 3 |

| 16–25 | C | 5 |

| 26–50 | D | 8 |

| 51–90 | E | 13 |

| 91–150 | F | 20 |

| 151–280 | G | 32 |

| 281–500 | H | 50 |

| 501–1200 | J | 80 |

| 1201–3200 | K | 125 |

| 3201–10000 | L | 200 |

  

### A2. Accept/Reject Threshold Check

For each active lot:

- Confirm acceptance number (Ac) and rejection number (Re) are correctly set per Z1.4

- Verify no agent or user has manually overridden these without a logged approval

- Check that Critical defects are set to Ac=0 (zero tolerance) on all RefrigiWear lots

- Flag any lot where Ac for Critical defects is > 0 as a **CRITICAL anomaly**

  

### A3. Inspection Level Consistency

- Confirm all RefrigiWear lots default to Inspection Level II unless explicitly switched

- Check for any lots on Level I (Reduced) without a logged justification

- Check for any lots that should be on Level III (Tightened) due to prior failures but have not been escalated

  

### A4. Stage Coverage Check (21 Stages)

Verify inspection data exists for each active stage:

  

**Phase 1 — Pre-Production (5 stages)**

- [ ] Material Receipt

- [ ] Fabric Inspection

- [ ] Trim Inspection

- [ ] Pre-Production Meeting

- [ ] PP Sample Approval

  

**Phase 2 — Cutting (5 stages)**

- [ ] Marker Making

- [ ] Fabric Spreading

- [ ] Cutting

- [ ] Bundle Ticketing

- [ ] Cut Panel Inspection

  

**Phase 3 — Sewing (4 stages)**

- [ ] Line Setup

- [ ] In-Line Inspection

- [ ] End-Line Inspection

- [ ] Roving QC

  

**Phase 4 — Finishing (4 stages)**

- [ ] Finishing Inspection

- [ ] Measurement Check

- [ ] Appearance Check

- [ ] Packing Inspection

  

**Phase 5 — Final (3 stages)**

- [ ] Pre-Final Inspection

- [ ] Final Random Inspection

- [ ] Shipment Approval

  

Flag any active production lot that has skipped a mandatory stage without a logged bypass approval.

  

---

  

## Part B — Defects Library Audit (DEFECTS-AGENT)

  

### B1. Unmapped Defect Codes

- Query defects database for any defect code without an assigned severity tier

- New defects added via PDF parsing that haven't been classified yet

- Surface each unmapped code as a classification request to Naveen

  

### B2. Severity Drift Detection

- Compare current severity assignments against the baseline snapshot in `.claude/agent-logs/defects-baseline.json`

- Flag any code whose severity has changed without a logged approval entry

- Specifically watch for Critical → Major downgrades (high risk)

  

### B3. Catalog Completeness Check

- Verify all RefrigiWear product categories have at least one defect entry per severity tier

- Check for product categories with zero Critical defect definitions (gap risk)

- Verify ANSI/ISEA 107-2020 safety vest compliance defects are all present and mapped as Critical

  

### B4. Duplicate Code Detection

- Scan for defect codes that appear to describe the same issue (fuzzy text match)

- Report potential duplicates for Naveen's review — do not merge automatically

  

---

  

## Part C — Permission Chain Validation (QC-LEAD)

  

### C1. Approval Chain Integrity

For all inspection lots awaiting approval:

- Confirm approver role matches the required tier for that stage

- Brand (RefrigiWear) approval required for: PP Sample Approval, Final Random Inspection, Shipment Approval

- Factory approval required for: all in-line and end-line stages

- 3rd Party approval required for: Pre-Final and Final Random Inspection (when assigned)

  

### C2. Stalled Approvals

- Flag any approval pending for more than 24 hours

- Include lot ID, stage, waiting approver role, and time elapsed

  

---

  

## Output

  

### Summary Report to QC-LEAD

```

[QC-DEEP-SCAN] Report — [TIMESTAMP]

AQL Engine:

· Active lots scanned: <n>

· Sample size violations: <n>

· Threshold anomalies: <n>

· Stage coverage gaps: <n>

  

Defects Library:

· Unmapped codes found: <n>

· Severity drift instances: <n>

· Catalog gaps: <n>

· Potential duplicates: <n>

  

Permission Chain:

· Stalled approvals: <n>

· Chain violations: <n>

  

Action Required: YES / NO

```

  

### If anomalies found — Discussion Card per Issue:

```

╔══════════════════════════════════════════════════════╗

║ AQL-AGENT · THRESHOLD ANOMALY · [TIMESTAMP] ║

╠══════════════════════════════════════════════════════╣

║ SUMMARY: Lot #RW-2026-084 — Ac for Critical = 1 ║

║ DETAIL: Z1.4 requires Ac=0 for Critical defects. ║

║ Current setting allows 1 critical defect. ║

║ OPTIONS: [A] Reset to Ac=0 (recommended) ║

║ [B] Log exception with justification ║

║ [C] Investigate further first ║

║ AWAITING YOUR DECISION → ║

╚══════════════════════════════════════════════════════╝

```

  

---

  

## Log Entry Format

```

[2026-03-09 16:00:00] [AQL-AGENT] [DEEP-SCAN] [LOT-RW-084] [ANOMALY: Ac=1 for CRT defects]

[2026-03-09 16:00:01] [DEFECTS-AGENT] [DEEP-SCAN] [CODE-MAJ-047] [UNMAPPED: no severity tier]

[2026-03-09 16:00:02] [QC-LEAD] [DEEP-SCAN] [SUMMARY] [COMPLETE: 2 items need Naveen decision]

```