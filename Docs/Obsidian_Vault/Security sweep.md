# Skill: Security Sweep

> **Trigger:** Runs every 6 hours via `/loop 6h`

> **Agent:** SECURITY-AGENT (isolated, read-only — no exceptions)

> **Severity:** CRITICAL

> **Write Access:** ❌ NONE — SECURITY-AGENT never writes any file

  

---

  

## Purpose

  

Automated security audit of the SankalpHub codebase, environment, and infrastructure. Scans for exposed credentials, misconfigured access policies, vulnerable dependencies, and unusual file changes. If a critical finding is detected, all agent loops are halted immediately and Naveen is alerted before anything else happens.

  

---

  

## SECURITY-AGENT Rules (Non-Negotiable)

  

1. **Read-only mode at all times** — this agent never calls any write tool

2. **Never log raw credential values** — only log that a credential was found and its file location

3. **Never transmit findings to external services** — report only to terminal and `.claude/agent-logs/`

4. **Halt all loops immediately** on any Critical finding — do not continue the sweep

5. **Do not attempt to fix anything** — surface the finding and wait for Naveen's decision

  

---

  

## Scan Sequence

  

### Scan 1 — Credential & Secret Exposure

  

Search the following locations for exposed secrets (patterns only — do not log values):

  

**Files to scan:**

```

src/

config/

prisma/

n8n/ (if present in project)

scripts/

*.json (excluding node_modules, package-lock.json)

*.ts

*.js

*.md (excluding CLAUDE.md itself)

```

  

**Patterns to detect:**

```

# API Keys

sk_live_[a-zA-Z0-9]{20,} # Stripe live key

sk_test_[a-zA-Z0-9]{20,} # Stripe test key

[Aa][Pp][Ii][_-]?[Kk][Ee][Yy]\s*=\s*["'][^"']{8,} # Generic API key

Bearer [a-zA-Z0-9\-._~+/]{20,} # Bearer tokens

  

# Database URLs

postgresql://[^:]+:[^@]+@ # Postgres with credentials

mysql://[^:]+:[^@]+@ # MySQL with credentials

mongodb\+srv://[^:]+:[^@]+@ # MongoDB Atlas

  

# Private Keys

-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----

  

# Webhook secrets

WEBHOOK_SECRET\s*=\s*["'][^"']{8,}

N8N_.*SECRET\s*=\s*["'][^"']{8,}

  

# JWT secrets

JWT_SECRET\s*=\s*["'][^"']{8,}

```

  

**Result:**

- ✅ None found → Log and continue

- 🚨 Found → **HALT ALL LOOPS** → Surface Critical alert immediately

  

---

  

### Scan 2 — .env File Audit

  

```bash

# List all .env files — do NOT read contents

find . -name ".env*" -not -path "*/node_modules/*" -not -path "*/.git/*"

```

  

- Confirm `.env` files are present in `.gitignore`

- Confirm `.env` files are NOT tracked by git:

```bash

git ls-files --error-unmatch .env 2>&1

```

- If exit code 0 (file IS tracked): **CRITICAL FINDING** — halt and alert

- Check `.env.example` exists with placeholder values (not real credentials)

  

---

  

### Scan 3 — Dependency Vulnerability Check

  

```bash

# npm audit — read-only, no fixes

npm audit --audit-level=high --json 2>/dev/null | head -200

```

  

**Thresholds:**

| Severity | Action |

|----------|--------|

| Critical | Halt loops + alert Naveen immediately |

| High | Surface discussion card, continue sweep |

| Moderate | Log in nightly report |

| Low | Log in nightly report |

  

---

  

### Scan 4 — CORS Policy Check

  

Scan Express.js route files and middleware for CORS configuration:

  

```bash

grep -r "cors(" src/ --include="*.ts" --include="*.js" -n

grep -r "Access-Control-Allow-Origin" src/ --include="*.ts" --include="*.js" -n

```

  

**Flags:**

- `origin: '*'` in production config → HIGH finding

- `credentials: true` combined with `origin: '*'` → CRITICAL finding

- Missing CORS configuration on API routes → WARN finding

  

---

  

### Scan 5 — n8n Webhook Security

  

```bash

# Check n8n webhook configurations (no credentials)

grep -r "webhook" src/ --include="*.ts" --include="*.js" -n

grep -r "n8n" config/ -n 2>/dev/null

```

  

- Confirm webhook URLs are not hardcoded with tokens in source files

- Confirm n8n is not exposed on a public port without authentication

- Verify webhook paths are not predictable (e.g. `/webhook/test` on production)

  

---

  

### Scan 6 — File Integrity Check

  

Compare current state of sensitive files against last known baseline:

  

```bash

# Generate current checksums

md5sum CLAUDE.md package.json prisma/schema.prisma 2>/dev/null

```

  

- Compare against `.claude/agent-logs/integrity-baseline.md5` (created on first run)

- Flag any unexpected change to `prisma/schema.prisma` outside of a logged migration

- Flag any change to `package.json` that wasn't preceded by a logged `npm install` approval

  

---

  

### Scan 7 — Prisma Schema Exposure

  

```bash

grep -r "datasource db" prisma/ -n

```

  

- Confirm `DATABASE_URL` is referenced as `env("DATABASE_URL")` — NOT hardcoded

- Confirm no migration files contain actual data (only schema DDL)

- Confirm `prisma/migrations/` is in `.gitignore` or reviewed before commit

  

---

  

## Output

  

### If no Critical findings:

```

[SECURITY-SWEEP] ✅ Clean — [TIMESTAMP]

· Credential scan: CLEAN

· .env git status: EXCLUDED (gitignore confirmed)

· npm audit: 0 critical, <n> high (logged)

· CORS policy: Configured (no wildcard)

· n8n webhooks: No hardcoded tokens found

· File integrity: No unexpected changes

· Prisma schema: DATABASE_URL via env() ✓

```

  

### Critical Finding Alert:

```

╔══════════════════════════════════════════════════════╗

║ SECURITY-AGENT · 🚨 CRITICAL · [TIMESTAMP] ║

╠══════════════════════════════════════════════════════╣

║ ⛔ ALL AGENT LOOPS HALTED ║

║ ║

║ FINDING: Exposed credential detected ║

║ FILE: src/config/database.ts (line 14) ║

║ TYPE: PostgreSQL connection string with password ║

║ ACTION: No agent will proceed until you respond. ║

║ ║

║ OPTIONS: [A] I'll fix it — resume loops after ║

║ [B] False positive — resume loops now ║

║ [C] Investigate further with me ║

║ AWAITING YOUR DECISION → ║

╚══════════════════════════════════════════════════════╝

```

  

---

  

## Log Entry Format

```

[2026-03-09 18:00:00] [SECURITY-AGENT] [SWEEP] [CREDENTIALS] [CLEAN]

[2026-03-09 18:00:01] [SECURITY-AGENT] [SWEEP] [NPM-AUDIT] [HIGH: 2 packages flagged]

[2026-03-09 18:00:02] [SECURITY-AGENT] [SWEEP] [CORS] [CLEAN]

[2026-03-09 18:00:03] [SECURITY-AGENT] [SWEEP] [INTEGRITY] [CLEAN]

[2026-03-09 18:00:04] [SECURITY-AGENT] [SWEEP] [SUMMARY] [CLEAN: 0 critical, 2 high logged]

```