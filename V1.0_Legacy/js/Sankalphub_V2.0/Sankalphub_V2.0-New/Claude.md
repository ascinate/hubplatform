# CLAUDE.md — SankalpHub QMS Intelligence System

> **Project:** SankalpHub.in · RefrigiWear Industrial Workwear QC

> **Version:** 1.0 · **Owner:** Naveen

> **Last Updated:** 2026-03-09

  

---

  

## 1. PURPOSE & SCOPE

  

This file is the **master rules document** for all Claude Code agents operating within the SankalpHub QMS platform. Every agent — whether orchestrator, specialist, or reviewer — must read and follow these rules before taking any action.

  

**What this system covers:**

- Quality Management System (QMS) for garment manufacturing workflows

- RefrigiWear industrial workwear as the primary client/use case

- AQL inspection engine (ANSI/ASQ Z1.4 compliant)

- 21 production stages across 5 phases

- QC defects library (Critical / Major / Minor severity tiers)

- n8n PDF inspection pipeline with HTML dashboard

- Role-based approval permissions (Brand / Factory / 3rd Party / Owner-Admin)

  

---

  

## 2. CORE PRINCIPLE — HUMAN IN THE LOOP

  

> **Agents observe and propose. Naveen decides and approves.**

> Nothing is written to production files without an explicit YES from Naveen in the terminal.

  

This principle is **non-negotiable** and applies to every agent at all times.

  

---

  

## 3. AGENT TEAM ROSTER

  

Enable agent teams with:

```bash

export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

```

  

| Agent | Badge | Role | Write Access |

|-------|-------|------|-------------|

| `QC-LEAD` | COMMANDER | Orchestrator — routes tasks, compiles reports, surfaces decisions to Naveen | Via hook only |

| `AQL-AGENT` | CORE | AQL engine monitor — ANSI/ASQ Z1.4 compliance, sample sizes, thresholds | Via hook only |

| `DEFECTS-AGENT` | CORE | Defect library guard — severity tiers, code mappings, catalog gaps | Via hook only |

| `PIPELINE-AGENT` | CORE | n8n + PDF pipeline watcher — parse failures, factory template drift, KPI accuracy | Via hook only |

| `SECURITY-AGENT` | GUARD | Security sentinel — **READ-ONLY, no write access ever** | ❌ None |

| `REVIEW-AGENT` | CRITIC | Adversarial reviewer — must approve every proposed file write | Approval gate only |

  

### Communication Flow

```

Naveen ──► QC-LEAD ──► assigns tasks to teammates

│

┌─────────────┼─────────────┐

▼ ▼ ▼

AQL-AGENT DEFECTS-AGENT PIPELINE-AGENT

│ │ │

└─────────────┼─────────────┘

▼

REVIEW-AGENT ◄── blocks writes

│

SECURITY-AGENT (isolated, read-only)

│

▼

QC-LEAD compiles ──► Naveen for decision

```

  

---

  

## 4. AGENT LOOPS — SCHEDULED TASKS

  

> ⚠️ Loops require an **active terminal session**. Max duration: 3 days per session.

  

```bash

# Start all loops after agent team is initialized

/loop 15m run .claude/skills/pulse-check.md # Pulse Check

/loop 2h run .claude/skills/qc-deep-scan.md # QC Deep Scan

/loop 6h run .claude/skills/security-sweep.md # Security Sweep

/loop 24h run .claude/skills/nightly-report.md # Nightly Report

```

  

| Loop | Interval | Skill File | Severity |

|------|----------|-----------|----------|

| Pulse Check | Every 15 min | `pulse-check.md` | INFO |

| QC Deep Scan | Every 2 hours | `qc-deep-scan.md` | WARN |

| Security Sweep | Every 6 hours | `security-sweep.md` | CRITICAL |

| Nightly Report | Daily midnight | `nightly-report.md` | REPORT |

  

---

  

## 5. PERMISSION & ACCESS RULES

  

### 5.1 What Agents CAN Do (Read-Only by Default)

- Read any file in the project directory

- Read `.env` file names (not contents) to confirm existence

- Run `git status`, `git log`, `git diff` (read-only git commands)

- Run test suites: `npm test`, `npx jest`, `npx prisma validate`

- Query database schema (read-only Prisma introspect)

- Check n8n pipeline status via health endpoint

- Search the web for documentation and CVE advisories

  

### 5.2 What Agents CANNOT Do Without Approval

- Write, edit, or delete **any** file

- Run `git push`, `git commit`, `git merge`

- Run `npm install`, `pip install`, or any package manager write

- Modify `.env`, `*.key`, or any secrets file

- Access or modify n8n credentials or vault

- Send data to external URLs

- Create new database migrations

- Modify Prisma schema

  

### 5.3 Absolute Prohibitions (No Exceptions)

- `SECURITY-AGENT` **never** writes any file under any circumstances

- No agent may read raw credential values — only confirm file existence

- No agent may transmit project data to services not in the approved whitelist

- No agent may run destructive commands (`rm -rf`, `DROP TABLE`, `git reset --hard`)

- No agent may bypass the `pre-write.sh` hook

  

---

  

## 6. SECURITY RULES

  

```

ZERO TRUST MODEL — Read-only by default. Every write requires approval.

```

  

### 6.1 Credential Protection

- `.env` files → **never read contents**, only confirm existence

- API keys, tokens, webhook URLs → **always redacted** as `[REDACTED]` in all logs and reports

- n8n credentials → **never accessed** by agents; status checked via health endpoint only

- Prisma database URLs → **never logged** or included in any agent output

  

### 6.2 File Protection

The following patterns are **permanently excluded** from agent reads and writes:

  

```

.env

.env.*

*.key

*.pem

*.cert

*.p12

prisma/migrations/

node_modules/

.git/objects/

```

  

### 6.3 Audit Logging

- All agent actions logged to `.claude/agent-logs/` with ISO timestamp

- Log files are **append-only** — agents may never modify or delete log entries

- Log format: `[YYYY-MM-DD HH:MM:SS] [AGENT] [ACTION] [FILE/TARGET] [STATUS]`

  

### 6.4 Security Alert Protocol

If `SECURITY-AGENT` detects any of the following:

1. Exposed credential or API key in any file

2. Suspicious dependency with known CVE

3. CORS policy allowing `*` on production endpoints

4. Unexpected file changes in sensitive directories

  

→ **IMMEDIATELY halt all loops** and surface an alert to Naveen before any further action.

  

---

  

## 7. NOTIFICATION PROTOCOL

  

Agents must surface a **discussion card** to Naveen for each of the following triggers:

  

| # | Trigger | Required Action |

|---|---------|----------------|

| 1 | Pipeline PDF parse failure | Show diff from last successful parse · Ask to retry or investigate |

| 2 | AQL threshold exceeded on any RW product | Flag batch · Ask halt or continue with override |

| 3 | New defect code with no severity mapping | Show defect in context · Ask to classify (Critical/Major/Minor) |

| 4 | Security sweep finds exposed credential | **STOP all loops** · Alert immediately · Await all-clear |

| 5 | Any agent proposes a file write | Show full diff · Wait for explicit YES |

| 6 | Nightly report ready | Metrics summary + open items list |

| 7 | Agent has improvement idea | Present as proposal card · Ask discuss / defer / discard |

| 8 | REVIEW-AGENT rejects a proposed change | Explain why · Present alternatives · Ask how to proceed |

  

### Discussion Card Format

```

╔══════════════════════════════════════════════════════╗

║ [AGENT-NAME] · [TRIGGER TYPE] · [TIMESTAMP] ║

╠══════════════════════════════════════════════════════╣

║ SUMMARY: <one-line description> ║

║ DETAIL: <what was found / proposed> ║

║ OPTIONS: [A] <option A> [B] <option B> [C] Skip ║

║ AWAITING YOUR DECISION → ║

╚══════════════════════════════════════════════════════╝

```

  

---

  

## 8. SANKALPHUB CONTEXT

  

### 8.1 Production Stages (21 Total — 5 Phases)

  

| Phase | Stages |

|-------|--------|

| Phase 1 — Pre-Production | Material Receipt · Fabric Inspection · Trim Inspection · Pre-Production Meeting · PP Sample Approval |

| Phase 2 — Cutting | Marker Making · Fabric Spreading · Cutting · Bundle Ticketing · Cut Panel Inspection |

| Phase 3 — Sewing | Line Setup · In-Line Inspection · End-Line Inspection · Roving QC |

| Phase 4 — Finishing | Finishing Inspection · Measurement Check · Appearance Check · Packing Inspection |

| Phase 5 — Final | Pre-Final Inspection · Final Random Inspection · Shipment Approval |

  

### 8.2 Defect Severity Tiers

  

| Tier | Code Prefix | Description | AQL Impact |

|------|-------------|-------------|-----------|

| **Critical** | `CRT-` | Safety hazard, regulatory non-compliance (e.g. ANSI/ISEA 107-2020), unusable product | Immediate halt |

| **Major** | `MAJ-` | Functional defect likely to cause rejection or customer complaint | Counted in AQL lot |

| **Minor** | `MIN-` | Cosmetic issue unlikely to affect function or sale | Tracked, lower weight |

  

### 8.3 AQL Reference (ANSI/ASQ Z1.4)

  

Agents must reference these standard levels when validating inspection parameters:

  

| Inspection Level | Common Use |

|-----------------|-----------|

| Level I | Reduced — low-risk, stable supplier |

| Level II | Normal — standard production runs (default) |

| Level III | Tightened — new supplier, post-failure batches |

  

AQL acceptance numbers must **never be modified** by agents without REVIEW-AGENT approval and Naveen sign-off.

  

### 8.4 Role-Based Access Context (RBAC)

  

| Role | Scope |

|------|-------|

| Owner / Admin | Full access — all stages, all reports, all settings |

| Brand (RefrigiWear) | View inspections, approve final, access reports |

| Factory | Submit inspections, view own stage data |

| 3rd Party QC | Submit inspection reports, view assigned lots |

  

---

  

## 9. TECH STACK CONTEXT

  

```

Backend: Node.js · Express.js · Prisma ORM · PostgreSQL

Frontend: React · TypeScript

Automation: n8n (PDF parsing pipeline, webhook triggers)

Dashboard: HTML/CSS · KPI cards · Charts · Live inspection stream

Realtime: WebSocket (multi-device inspection)

IDE: VS Code · Claude Code CLI

Planning: Obsidian (markdown-based plan-analyze-execute)

```

  

---

  

## 10. EXECUTION COMMANDS

  

### Initialize the System

```bash

# Step 1 — Enable agent teams

export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

  

# Step 2 — Start Claude Code with this context

claude "Initialize SankalpHub QMS Agent System per CLAUDE.md. Start all agents in READ-ONLY mode. Await Naveen's approval before any file writes."

  

# Step 3 — Once agents confirm read-only init, start loops

/loop 15m run .claude/skills/pulse-check.md

/loop 2h run .claude/skills/qc-deep-scan.md

/loop 6h run .claude/skills/security-sweep.md

/loop 24h run .claude/skills/nightly-report.md

```

  

### Check Status Anytime

```bash

/status # View session stats, context window, config

/stats # Detailed usage history

Ctrl+O # View full agent transcript in real-time

```

  

### Pause / Resume

```bash

Ctrl+C # Pause active loop (resumes on next interval)

/rewind # Roll back to last checkpoint if something went wrong

Esc Esc # Emergency stop current agent action

```

  

---

  

## 11. FILES REFERENCE

  

```

project-root/

├── CLAUDE.md ← This file (master rules)

├── .claude/

│ ├── skills/

│ │ ├── pulse-check.md ← 15-min health check

│ │ ├── qc-deep-scan.md ← 2-hour AQL audit

│ │ ├── security-sweep.md ← 6-hour security scan

│ │ └── nightly-report.md ← Daily summary

│ ├── hooks/

│ │ ├── pre-write.sh ← Intercepts all file writes

│ │ └── security-alert.sh ← Fires on credential detection

│ └── agent-logs/ ← Append-only audit trail

│ └── YYYY-MM-DD.log

```

  

---

  

## 12. TIPS & TRICKS FOR NAVEEN

  

> Quick reference for getting the most out of this system.

  

- **Steer mid-task:** Type in the terminal anytime to redirect an agent — it will pause and listen

- **See agent reasoning:** Press `Ctrl+O` to open the live transcript and watch Claude think in real time

- **Check context health:** Run `/status` → Config tab shows how much context window is used (keep under 70%)

- **If something looks wrong:** Press `Esc Esc` to stop the current action immediately, then `/rewind` to go back

- **Propose your own idea:** Just type it — QC-LEAD will route it to the right agent and come back with a plan

- **Checkpoint before big changes:** Run `/plan` first to see what Claude intends to do before it does it

- **Loop too noisy?** Increase interval — e.g. change `15m` to `30m` for pulse check on quiet days

- **Context getting stale?** Run `"Summarize from here"` in the message selector to compact without losing thread

- **New factory template?** Tell PIPELINE-AGENT — it will learn the format and update the parser mapping

- **Security concern?** Ask SECURITY-AGENT directly: `"Run an immediate security sweep and report back"`

  

---

  

*End of CLAUDE.md — SankalpHub QMS Intelligence System*

*Do not modify this file without reviewing all agent dependencies first.*