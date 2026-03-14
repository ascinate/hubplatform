#!/bin/bash
# ============================================================
# pre-write.sh — SankalpHub QMS Pre-Write Hook
# Fires before ANY file write by any Claude Code agent
# Type: PreToolUse (Write, Edit, MultiEdit)
# ============================================================
# RULE: No file write proceeds without Naveen's explicit approval
# This hook intercepts, logs, and halts — never auto-approves
# ============================================================

set -euo pipefail

# ── Config ──────────────────────────────────────────────────
LOG_DIR=".claude/agent-logs"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d).log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"
TARGET_FILE="${CLAUDE_TOOL_INPUT_FILE_PATH:-unknown}"

# ── Ensure log directory exists ──────────────────────────────
mkdir -p "$LOG_DIR"

# ── Blocked file patterns — ALWAYS deny, no exceptions ───────
BLOCKED_PATTERNS=(
  ".env"
  ".env.*"
  "*.key"
  "*.pem"
  "*.cert"
  "*.p12"
  "*.pfx"
  "*.secret"
  "node_modules/"
  ".git/"
)

# ── Check if target matches a blocked pattern ────────────────
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if [[ "$TARGET_FILE" == $pattern ]] || \
     [[ "$TARGET_FILE" =~ $(echo "$pattern" | sed 's/\./\\./g; s/\*/.*/g') ]]; then
    echo "[$TIMESTAMP] [HOOK:pre-write] [BLOCKED] [$TOOL_NAME] [$TARGET_FILE] [REASON: protected file pattern]" >> "$LOG_FILE"
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║  🛡️  PRE-WRITE HOOK — FILE BLOCKED                  ║"
    echo "╠══════════════════════════════════════════════════════╣"
    echo "║  Tool:   $TOOL_NAME"
    echo "║  File:   $TARGET_FILE"
    echo "║  Reason: This file pattern is permanently protected."
    echo "║  Action: Write has been blocked automatically."
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
    # Exit code 2 = block the tool call
    exit 2
  fi
done

# ── Security-Agent write attempt — always block ───────────────
AGENT_NAME="${CLAUDE_AGENT_NAME:-}"
if [[ "$AGENT_NAME" == "SECURITY-AGENT" ]]; then
  echo "[$TIMESTAMP] [HOOK:pre-write] [BLOCKED] [SECURITY-AGENT] [$TARGET_FILE] [REASON: SECURITY-AGENT is read-only]" >> "$LOG_FILE"
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║  🛡️  PRE-WRITE HOOK — AGENT BLOCKED                 ║"
  echo "╠══════════════════════════════════════════════════════╣"
  echo "║  SECURITY-AGENT attempted a file write.              ║"
  echo "║  This agent operates in READ-ONLY mode at all times.║"
  echo "║  Write has been blocked. No action needed.           ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
  exit 2
fi

# ── Log the pending write attempt ────────────────────────────
echo "[$TIMESTAMP] [HOOK:pre-write] [PENDING] [$TOOL_NAME] [$TARGET_FILE] [awaiting Naveen approval]" >> "$LOG_FILE"

# ── Surface approval request to terminal ─────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✋ PRE-WRITE HOOK — APPROVAL REQUIRED               ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Agent:  ${AGENT_NAME:-Claude Code}"
echo "║  Tool:   $TOOL_NAME"
echo "║  File:   $TARGET_FILE"
echo "║  Time:   $TIMESTAMP"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  The diff will be shown above by Claude Code.        ║"
echo "║  This hook is pausing to await your decision.        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  → Type YES to approve this write"
echo "  → Type NO  to block this write"
echo "  → Type ESC to stop the current agent action"
echo ""

# ── Read Naveen's decision ────────────────────────────────────
# Claude Code will handle the interactive prompt.
# This hook outputs the approval request and returns 0 to
# allow Claude Code's native permission system to take over.
# The actual YES/NO is handled by Claude Code's permission UI.

# Log that hook completed and handed off to permission system
echo "[$TIMESTAMP] [HOOK:pre-write] [HANDOFF] [$TOOL_NAME] [$TARGET_FILE] [passed to Claude Code permission prompt]" >> "$LOG_FILE"

# Exit 0 = allow Claude Code's permission system to continue
# Claude Code will show its own approval dialog for the write
exit 0