#!/bin/bash
# ============================================================
# security-alert.sh — SankalpHub QMS Security Alert Hook
# Fires when SECURITY-AGENT detects a critical finding
# Type: PostToolUse (Read) — pattern match on output
# Also usable as a manual trigger from security-sweep.md
# ============================================================
# RULE: On any critical security finding, halt ALL loops
#       immediately and alert Naveen. Do not continue.
# ============================================================

set -euo pipefail

# ── Config ──────────────────────────────────────────────────
LOG_DIR=".claude/agent-logs"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d).log"
ALERT_FILE="$LOG_DIR/SECURITY-ALERT-$(date +%Y-%m-%d-%H%M%S).log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ── Finding details (passed by calling agent or hook context) ─
FINDING_TYPE="${SECURITY_FINDING_TYPE:-UNKNOWN}"
FINDING_FILE="${SECURITY_FINDING_FILE:-unknown}"
FINDING_DETAIL="${SECURITY_FINDING_DETAIL:-No detail provided}"
FINDING_SEVERITY="${SECURITY_FINDING_SEVERITY:-CRITICAL}"

# ── Ensure log directory exists ──────────────────────────────
mkdir -p "$LOG_DIR"

# ── Credential pattern scan (if called directly on a file) ───
SCAN_TARGET="${1:-}"

if [[ -n "$SCAN_TARGET" ]] && [[ -f "$SCAN_TARGET" ]]; then

  # Define credential patterns to detect
  FOUND_CREDENTIAL=false
  FOUND_TYPE=""
  FOUND_LINE=""

  # Check for common credential patterns
  while IFS= read -r line; do
    LINE_NUM=$((LINE_NUM + 1))

    # Postgres / MySQL / MongoDB URLs with passwords
    if echo "$line" | grep -qiE '(postgresql|mysql|mongodb\+srv)://[^:]+:[^@]+@'; then
      FOUND_CREDENTIAL=true
      FOUND_TYPE="Database connection string with credentials"
      FOUND_LINE="Line ~$LINE_NUM"
      break
    fi

    # Stripe live keys
    if echo "$line" | grep -qE 'sk_live_[a-zA-Z0-9]{20,}'; then
      FOUND_CREDENTIAL=true
      FOUND_TYPE="Stripe live secret key"
      FOUND_LINE="Line ~$LINE_NUM"
      break
    fi

    # Private keys
    if echo "$line" | grep -q 'BEGIN.*PRIVATE KEY'; then
      FOUND_CREDENTIAL=true
      FOUND_TYPE="Private key block"
      FOUND_LINE="Line ~$LINE_NUM"
      break
    fi

    # Generic API key assignments
    if echo "$line" | grep -qiE '(api_key|apikey|api_secret|secret_key)\s*[=:]\s*["'"'"'][^"'"'"']{12,}'; then
      FOUND_CREDENTIAL=true
      FOUND_TYPE="Hardcoded API key or secret"
      FOUND_LINE="Line ~$LINE_NUM"
      break
    fi

  done < "$SCAN_TARGET"

  if [[ "$FOUND_CREDENTIAL" == "false" ]]; then
    echo "[$TIMESTAMP] [HOOK:security-alert] [SCAN] [$SCAN_TARGET] [CLEAN]" >> "$LOG_FILE"
    exit 0
  fi

  # Override finding details from scan
  FINDING_TYPE="$FOUND_TYPE"
  FINDING_FILE="$SCAN_TARGET ($FOUND_LINE)"
  FINDING_DETAIL="Credential pattern detected in source file"
  FINDING_SEVERITY="CRITICAL"
fi

# ── Write the security alert log ─────────────────────────────
{
  echo "========================================================"
  echo "  SECURITY ALERT — SankalpHub QMS"
  echo "  $TIMESTAMP"
  echo "========================================================"
  echo "  Severity:  $FINDING_SEVERITY"
  echo "  Type:      $FINDING_TYPE"
  echo "  File:      $FINDING_FILE"
  echo "  Detail:    $FINDING_DETAIL"
  echo ""
  echo "  ⛔ ALL AGENT LOOPS HALTED AT THIS TIMESTAMP"
  echo "  No agent action taken until Naveen responds."
  echo "========================================================"
} >> "$ALERT_FILE"

# Also append to daily log
echo "[$TIMESTAMP] [HOOK:security-alert] [🚨 CRITICAL] [$FINDING_TYPE] [$FINDING_FILE] [ALL LOOPS HALTED]" >> "$LOG_FILE"

# ── Terminal alert — maximum visibility ──────────────────────
echo ""
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║   🚨  SECURITY ALERT — SANKALPHUB QMS                  ║"
echo "║                                                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║   ⛔  ALL AGENT LOOPS HALTED IMMEDIATELY                ║"
echo "║                                                          ║"
echo "║   Severity:  $FINDING_SEVERITY"
echo "║   Type:      $FINDING_TYPE"
echo "║   File:      $FINDING_FILE"
echo "║                                                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║   No agent will take further action until you respond.  ║"
echo "║   Alert log saved to:                                    ║"
echo "║   $ALERT_FILE"
echo "║                                                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║   OPTIONS:                                               ║"
echo "║   [A] I'll fix it now — resume loops after I confirm    ║"
echo "║   [B] False positive — resume loops immediately         ║"
echo "║   [C] Investigate with me — walk through the finding    ║"
echo "║                                                          ║"
echo "║   >>>  AWAITING YOUR DECISION                           ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Exit code 2 = block current tool call and halt ───────────
# Claude Code interprets exit 2 as: stop current action, surface to user
exit 2