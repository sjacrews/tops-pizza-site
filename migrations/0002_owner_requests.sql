-- TOPS Pizza — owner update portal D1 schema (migration 0002)
-- Stores change requests submitted via /owner/ form
-- Run: wrangler d1 execute tops-pizza-leads --file=migrations/0002_owner_requests.sql --remote

CREATE TABLE IF NOT EXISTS owner_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_by TEXT,             -- email from CF Access JWT (if present)
  category TEXT NOT NULL,        -- 'menu' | 'hours' | 'specials' | 'content' | 'photo' | 'other'
  urgency TEXT NOT NULL,         -- 'low' | 'medium' | 'high'
  request_text TEXT NOT NULL,    -- the actual change description
  status TEXT NOT NULL DEFAULT 'new',  -- 'new' | 'in-progress' | 'done' | 'rejected'
  status_updated_at TEXT,
  steve_notes TEXT,              -- notes from Steve while working on it
  user_agent TEXT,
  ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_owner_requests_status ON owner_requests(status, created_at);
