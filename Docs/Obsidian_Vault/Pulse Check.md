# Skill: Pulse Check

> **Trigger:** Runs every 15 minutes via `/loop 15m`

> **Agent:** PIPELINE-AGENT (primary) + QC-LEAD (report)

> **Severity:** INFO

> **Write Access:** ❌ None — read-only scan only

  

---

  

## Purpose

  

Quick health verification of all active SankalpHub QMS components. This skill checks that the n8n pipeline is alive, the AQL engine is responding, the last PDF parse succeeded, and the dashboard KPIs are fresh. It completes in under 60 seconds and only surfaces a discussion card if something is wrong.

  

---

  

## Checklist — Run in This Order

  

### 1. n8n Pipeline Health

```bash

# Check n8n process / webhook endpoint status

curl -s -o /dev/null -w "%{http_code}" http://localhost:5678/healthz

```

- ✅ `200` → Pipeline healthy, log and continue

- ⚠️ `non-200` or timeout → Trigger discussion card (see Notification Protocol below)

  

### 2. Last PDF Parse Result

- Open `.claude/agent-logs/` and read the most recent log entry tagged `[PIPELINE-AGENT]`

- Confirm the last PDF parse completed with status `SUCCESS`

- If last status is `FAILED` or `PARTIAL`:

- Retrieve the error message

- Show diff between last successful parse output and current

- Surface discussion card immediately

  

### 3. AQL Engine Validation

```bash

# Run AQL engine health check (read-only)

npx ts-node src/services/aql/AQLService.ts --healthcheck

```

- Confirm engine initializes without error

- Confirm ANSI/ASQ Z1.4 table is loaded

- Confirm at least one active inspection lot is tracked

  

### 4. Dashboard KPI Freshness

- Read the dashboard HTML output file (do not modify)

- Check the `data-last-updated` timestamp on KPI cards

- If timestamp is older than 2 hours → flag as stale in log

- If timestamp is older than 6 hours → surface discussion card

  

### 5. WebSocket Connectivity

- Check if WebSocket server process is running

- Confirm no error entries in the last 15 minutes of server logs

- Log connected device count (informational only)

  

### 6. Active Inspection Lots

- Query Prisma (read-only): count active inspection lots

- If count = 0 during production hours (08:00–18:00 IST): log as anomaly

- Do not raise alert — just log for nightly report

  

---

  

## Output

  

### If all checks pass:

```

[PULSE-CHECK] ✅ All systems healthy — 15:32:10

· n8n pipeline: OK (200)

· Last PDF parse: SUCCESS (14 min ago)

· AQL engine: Running (Z1.4 loaded)

· Dashboard KPIs: Fresh (updated 8 min ago)

· WebSocket: Active (2 devices)

· Active lots: 3

```

Log to `.claude/agent-logs/YYYY-MM-DD.log` and exit silently.

  

### If any check fails:

Surface a discussion card to Naveen:

```

╔══════════════════════════════════════════════════════╗

║ PIPELINE-AGENT · PULSE FAILURE · [TIMESTAMP] ║

╠══════════════════════════════════════════════════════╣

║ SUMMARY: <component> is not responding ║

║ DETAIL: <error message / last known state> ║

║ OPTIONS: [A] Investigate now [B] Skip this cycle ║

║ AWAITING YOUR DECISION → ║

╚══════════════════════════════════════════════════════╝

```

  

---

  

## Log Entry Format

```

[2026-03-09 15:32:10] [PIPELINE-AGENT] [PULSE-CHECK] [ALL] [OK]

[2026-03-09 15:32:10] [PIPELINE-AGENT] [PULSE-CHECK] [n8n] [FAILED: timeout after 5s]

```