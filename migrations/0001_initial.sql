-- TOPS Pizza — D1 schema for review-funnel leads
-- Run: wrangler d1 execute tops-pizza-leads --file=migrations/0001_initial.sql --remote

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Lead source
  type TEXT NOT NULL,              -- 'feedback' | 'reviewer-thanks'
  source TEXT,                     -- which page/QR they came from

  -- Contact info (all optional except: phone OR email required)
  name TEXT,
  email TEXT,
  phone TEXT,                      -- E.164 format ideally (+14035551212)

  -- Consent (CASL: explicit opt-in required for marketing)
  sms_optin INTEGER NOT NULL DEFAULT 0,    -- 0/1
  email_optin INTEGER NOT NULL DEFAULT 0,  -- 0/1

  -- Feedback-only fields
  sentiment TEXT,                  -- 'great' | 'ok' | 'meh' | 'bad'
  story TEXT,
  fix TEXT,

  -- Drip tracking — flip to 1 once the message is sent
  welcome_sent INTEGER NOT NULL DEFAULT 0,
  welcome_sent_at TEXT,
  drip_30_sent INTEGER NOT NULL DEFAULT 0,
  drip_30_sent_at TEXT,
  drip_60_sent INTEGER NOT NULL DEFAULT 0,
  drip_60_sent_at TEXT,

  -- Unsubscribe / STOP handling
  unsubscribed INTEGER NOT NULL DEFAULT 0,
  unsubscribed_at TEXT,
  unsubscribe_reason TEXT,

  -- Misc
  user_agent TEXT,
  ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_type ON leads(type);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_drip30 ON leads(drip_30_sent, sms_optin, created_at) WHERE unsubscribed = 0;
CREATE INDEX IF NOT EXISTS idx_leads_drip60 ON leads(drip_60_sent, sms_optin, created_at) WHERE unsubscribed = 0;

-- Suppression list for STOP responses (Twilio webhook target eventually)
CREATE TABLE IF NOT EXISTS suppressions (
  phone TEXT PRIMARY KEY,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
