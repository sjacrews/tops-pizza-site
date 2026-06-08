#!/usr/bin/env bash
# ============================================================
# TOPS Pizza — VPS Claude owner-request processor
# ------------------------------------------------------------
# What it does:
#   1. Pulls latest main from git (in case Steve has made changes)
#   2. Queries D1 for new owner_requests (status='new')
#   3. For each request, invokes `claude` headlessly with the 3-tier prompt
#   4. Claude reads request, classifies tier, makes edits (auto/draft) or escalates
#   5. Commits + pushes + deploys (auto tier) or pushes preview branch (draft tier)
#   6. Updates D1 status, sends Twilio SMS to Peter (+ Steve for drafts/escalations)
#
# Run via cron — see crontab.example
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/../.."   # repo root: tops-pizza-site/

# Credentials for unattended (cron) runs — cron has no shell env.
[ -f "$HOME/.secrets/twilio.env" ] && . "$HOME/.secrets/twilio.env"
[ -f "$HOME/.secrets/cloudflare.env" ] && . "$HOME/.secrets/cloudflare.env"
export TWILIO_FROM_NUMBER="${TWILIO_FROM_NUMBER:-+15878702722}"
export STEVE_NOTIFY_NUMBER="${STEVE_NOTIFY_NUMBER:-+14038702669}"

LOG="vps-claude-jobs/process-owner-requests/process.log"
echo "===== $(date -Iseconds) starting run =====" | tee -a "$LOG"

# Pull latest main so we're not editing stale code
git fetch origin main && git checkout main && git pull --ff-only | tee -a "$LOG"

# Get new owner requests (limit 5 per run to be safe)
REQUESTS_JSON=$(npx wrangler d1 execute tops-pizza-leads --remote --json \
  --command="SELECT id, created_at, submitted_by, category, urgency, request_text FROM owner_requests WHERE status='new' ORDER BY id ASC LIMIT 5")

# Count how many — if zero, exit quietly
COUNT=$(echo "$REQUESTS_JSON" | jq '.[0].results | length')
if [ "$COUNT" -eq 0 ]; then
  echo "No new requests. Exiting." | tee -a "$LOG"
  exit 0
fi

echo "Found $COUNT new request(s). Processing..." | tee -a "$LOG"

# Hand each to Claude one at a time
echo "$REQUESTS_JSON" | jq -c '.[0].results[]' | while read -r REQUEST; do
  ID=$(echo "$REQUEST" | jq -r '.id')
  echo "→ Processing request #$ID" | tee -a "$LOG"

  # Mark as in-progress so re-runs don't double-process
  npx wrangler d1 execute tops-pizza-leads --remote \
    --command="UPDATE owner_requests SET status='in-progress', status_updated_at=datetime('now') WHERE id=$ID"

  # Build the prompt and feed it to Claude (headless)
  PROMPT_FILE="vps-claude-jobs/process-owner-requests/.tmp-prompt-$ID.md"
  cat vps-claude-jobs/process-owner-requests/system-prompt.md > "$PROMPT_FILE"
  echo "" >> "$PROMPT_FILE"
  echo "## Request from owner (D1 row #$ID)" >> "$PROMPT_FILE"
  echo "" >> "$PROMPT_FILE"
  echo "$REQUEST" | jq -r '"- Submitted: \(.created_at)\n- From: \(.submitted_by)\n- Category: \(.category)\n- Urgency: \(.urgency)\n\n**The request:**\n\n\(.request_text)"' >> "$PROMPT_FILE"

  # Invoke Claude headlessly — let it read the prompt and act.
  # PLUGIN-SAFE flags are mandatory here: a plain `claude` in cron loads the Telegram
  # poller plugin and KILLS Steve's live poller. --settings disables plugins,
  # --strict-mcp-config + cron-mcp.json bounds MCP, --allowedTools bounds capability,
  # and timeout caps a runaway run.
  timeout 1800 claude --print \
    --permission-mode bypassPermissions \
    --strict-mcp-config --mcp-config "$HOME/.claude/cron-mcp.json" \
    --settings '{"enabledPlugins":{}}' \
    --allowedTools "Bash,Read,Write,Edit,Glob,Grep" \
    < "$PROMPT_FILE" 2>&1 | tee -a "$LOG"

  rm -f "$PROMPT_FILE"
  echo "← Done with request #$ID" | tee -a "$LOG"
done

echo "===== $(date -Iseconds) run complete =====" | tee -a "$LOG"
