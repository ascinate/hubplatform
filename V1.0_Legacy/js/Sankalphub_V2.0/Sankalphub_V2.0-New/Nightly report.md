# Skill: Nightly Report

> **Trigger:** Runs daily at midnight via `/loop 24h`

> **Agent:** QC-LEAD (aggregates from all agents) → surfaces to Naveen

> **Severity:** REPORT

> **Write Access:** ✅ Append to `.claude/agent-logs/reports/` only

  

---

  

## Purpose

  

Compile a comprehensive end-of-day summary covering all QMS activity, inspection outcomes, security status, improvement ideas surfaced during the day, and a prioritised list of open items for Naveen to review the next morning. This is the single most important output of the day — it should be clear, actionable, and honest.

  

---

  

## Report Assembly Sequence

  

QC-LEAD coordinates all agents to contribute their section, then assembles the final report.

  

---

  

### Section 1 — Production Summary (PIPELINE-AGENT)

  

Aggregate from today's logs:

  

- **Total PDFs parsed:** count of successful and failed parses

- **Factory templates seen:** list of template types processed today

- **Parse success rate:** `successful / total * 100`

- **KPI dashboard updates:** count of times dashboard was refreshed

- **n8n pipeline uptime:** calculated from pulse check logs (uptime % today)

  

```

Production Summary — [DATE]

PDFs parsed: 18 (17 success, 1 failed)

Templates seen: RefrigiWear-v2, Factory-B-v1

Parse success rate: 94.4%

Dashboard refreshes: 72

n8n uptime today: 99.1%

```

  

---

  

### Section 2 — Inspection Results (AQL-AGENT)

  

Aggregate from today's inspection data:

  

- **Active lots today:** count

- **Inspections completed:** count by stage

- **AQL pass rate:** percentage of lots that passed

- **AQL fail rate:** percentage of lots that failed or were halted

- **Defects found today:** count by severity tier

  

```

Inspection Results — [DATE]

Active lots today: 12

Inspections done: 47 (across 21 stages)

AQL pass rate: 83.3% (10/12 lots)

AQL fail rate: 16.7% (2/12 lots — see open items)

  

Defects logged:

Critical (CRT): 2

Major (MAJ): 14

Minor (MIN): 31

Total: 47

```

  

**RefrigiWear Stage Completion (today):**

| Phase | Completed | In Progress | Not Started |

|-------|-----------|-------------|-------------|

| Pre-Production | 3 | 1 | 1 |

| Cutting | 5 | 0 | 0 |

| Sewing | 4 | 2 | 0 (awaiting) |

| Finishing | 3 | 1 | 0 |

| Final | 1 | 0 | 2 (pending) |

  

---

  

### Section 3 — Defects Library Activity (DEFECTS-AGENT)

  

- **New defect codes added today:** list with source (PDF / manual)

- **Codes classified today:** list with assigned severity

- **Codes still pending classification:** list for Naveen to action

- **Severity changes today:** any changes with who/what triggered them

  

```

Defects Library — [DATE]

New codes added: 3 (2 from PDF parse, 1 manual)

Codes classified: 2

Pending classification: 1 (MAJ-new-047 — see open items)

Severity changes: 0

```

  

---

  

### Section 4 — Security Summary (SECURITY-AGENT)

  

Aggregate from today's 4 security sweep cycles:

  

- **Sweeps completed:** count (expect 4 per day)

- **Critical findings:** count (should always be 0)

- **High findings:** list (npm audit, CORS, etc.)

- **Files with unexpected changes:** list

- **Overall security status:** CLEAN / ATTENTION NEEDED

  

```

Security Summary — [DATE]

Sweeps completed: 4/4

Critical findings: 0 ✅

High findings: 1 (lodash CVE — see open items)

File integrity: CLEAN

.env exposure: NONE DETECTED

Overall status: ATTENTION NEEDED (1 high)

```

  

---

  

### Section 5 — Improvement Ideas (All Agents)

  

All improvement ideas surfaced during the day, tagged by agent and priority:

  

```

💡 Improvement Ideas — [DATE]

  

[PIPELINE-AGENT] HIGH

Factory-B PDF templates are shifting their defect column positions between

batches. Suggest adding a column-position auto-detect step to the parser

to handle template drift without manual intervention.

→ Discuss: YES / DEFER / DISCARD

  

[AQL-AGENT] MEDIUM

3 lots today had lot sizes of exactly 500 — right at the H/J boundary in

Z1.4 tables. Consider adding a boundary-alert rule to flag these for

manual verification of sample size code assignment.

→ Discuss: YES / DEFER / DISCARD

  

[DEFECTS-AGENT] LOW

The term "stitching gap" and "stitch skip" appear in 2 separate defect

codes (MIN-031 and MIN-044) and likely describe the same defect. Consider

reviewing for consolidation.

→ Discuss: YES / DEFER / DISCARD

```

  

---

  

### Section 6 — Tips & Tricks (QC-LEAD)

  

One actionable Claude Code / QMS tip per day, rotated from a curated set:

  

```

💡 Today's Tip:

Use `/plan` before asking Claude Code to refactor any AQL calculation logic.

It will show you exactly what it intends to change — file by file — before

touching anything. Saves time and avoids surprises on critical inspection code.

```

  

---

  

### Section 7 — Open Items (Prioritised)

  

All unresolved items from today requiring Naveen's decision, ranked by urgency:

  

```

📋 Open Items — [DATE]

Requires action before next business day:

  

🔴 URGENT

1. [SECURITY] lodash@4.17.20 has CVE-2021-23337 (High severity).

Recommend: npm update lodash → Approve? YES / DEFER

  

🟡 IMPORTANT

2. [DEFECTS] MAJ-new-047 — "Reflective tape delamination" found in

today's parse, no severity tier assigned yet.

Classify as: CRITICAL / MAJOR / MINOR

  

3. [AQL] Lot #RW-2026-089 failed Final Random Inspection (3 Major defects,

Re=2). Lot is currently halted.

Decision: Re-inspect / Rework & reinspect / Reject lot

  

🔵 WHEN CONVENIENT

4. [PIPELINE] Factory-B template drift detected (column positions shifted).

Want me to build an auto-detect fix? YES / DEFER / SHOW ME FIRST

  

5. [DEFECTS] Potential duplicate codes: MIN-031 vs MIN-044.

Review and consolidate? YES / DEFER / DISCARD

```

  

---

  

## Report Storage

  

Save completed report to:

```

.claude/agent-logs/reports/nightly-report-YYYY-MM-DD.md

```

  

Also append one-line summary to:

```

.claude/agent-logs/YYYY-MM-DD.log

```

  

```

[2026-03-09 00:00:00] [QC-LEAD] [NIGHTLY-REPORT] [COMPLETE] [5 open items — Naveen action needed]

```

  

---

  

## Report Delivery

  

QC-LEAD surfaces the full report as a single formatted block in the terminal, followed by a prompt:

  

```

╔══════════════════════════════════════════════════════╗

║ QC-LEAD · NIGHTLY REPORT · [TIMESTAMP] ║

╠══════════════════════════════════════════════════════╣

║ [Full report rendered above] ║

║ ║

║ 5 items need your attention. ║

║ Reply with item numbers to discuss: ║

║ e.g. "1 3 5" or "all" or "skip for now" ║

║ AWAITING YOUR RESPONSE → ║

╚══════════════════════════════════════════════════════╝

```