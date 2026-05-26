# VPS Claude — owner-request processor

Polls D1 for new owner-portal requests and processes them with 3-tier autonomy.

## Setup on the VPS (one-time)

```bash
# 1. Clone the repo somewhere stable
git clone <repo-url> /opt/tops-pizza-site
cd /opt/tops-pizza-site

# 2. Install deps
npm install

# 3. Make sure wrangler is authenticated to Cloudflare
npx wrangler whoami
# (if not, `npx wrangler login` first)

# 4. Make sure claude CLI is installed and authenticated
which claude
claude --version

# 5. Set the Twilio env vars (add to ~/.bashrc or /etc/environment)
export TWILIO_ACCOUNT_SID="AC..."
export TWILIO_AUTH_TOKEN="..."
export TWILIO_FROM_NUMBER="+14035551234"
export STEVE_NOTIFY_NUMBER="+14038702669"

# 6. Test a one-off run (no requests = exits cleanly)
./vps-claude-jobs/process-owner-requests/process.sh

# 7. Install the cron
crontab -e
# (paste contents of crontab.example, adjust timezone)
```

## Architecture

```
Peter submits via /owner/
    ↓
/api/owner-request stores row in D1: status='new'
    ↓
(every 15 min) cron runs process.sh
    ↓
process.sh:
    git pull
    query D1 for status='new' requests (limit 5)
    for each request:
        mark status='in-progress'
        invoke `claude --print < prompt.md` (with system-prompt.md + request text)
        Claude reads README + SETUP, classifies request tier, acts
    ↓
Tier 1 (auto):       edit → build → commit → push → npm run deploy
Tier 2 (draft):      edit on branch → preview deploy → SMS Steve
Tier 3 (escalate):   no changes → SMS Steve with summary
    ↓
Update D1 status, log to ./process.log
```

## Files

- `process.sh` — main entry, runs from cron
- `system-prompt.md` — the prompt fed to Claude with each request
- `daily-summary.sh` — (TODO) optional daily SMS summary of activity
- `process.log` — append-only log of all runs (rotate periodically)
- `crontab.example` — cron schedule

## Tuning

- **Cron interval**: 15 min is a good balance of latency vs cost. Drop to 5 min if Peter is actively making changes; raise to hourly if low volume.
- **Limit per run**: capped at 5 to prevent a flood from consuming the API budget. Increase if needed.
- **Business hours filter**: cron only runs 11am-11pm to avoid waking Steve with overnight notifications. Adjust if you want 24/7.
- **Tier rules**: live in `system-prompt.md`. Edit there to tighten or loosen Claude's autonomy.

## Audit trail

Every D1 row has `status`, `status_updated_at`, and `steve_notes`. Query anytime:

```bash
npx wrangler d1 execute tops-pizza-leads --remote \
  --command="SELECT id, created_at, category, urgency, status, status_updated_at, substr(request_text, 1, 60) AS preview, steve_notes FROM owner_requests ORDER BY id DESC LIMIT 20"
```

Git commit log is the other audit trail — every change made by VPS Claude is signed `VPS Claude <vps-claude@tops-pizza-automation>`.

## Failure modes & rollback

- Build fails → Claude rolls back local changes, escalates to Steve, doesn't push
- Deploy fails → same
- Git conflict on `git pull` → Claude escalates, doesn't touch anything
- Twilio fails → request still updates in D1; Steve can see it on next portal visit
- Claude API rate-limited → next cron run picks up where this one left off (D1 status persists)
