-- TOPS Pizza — owner photo uploads
-- Run: wrangler d1 execute tops-pizza-leads --file=migrations/0003_owner_photos.sql --remote

CREATE TABLE IF NOT EXISTS owner_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_by TEXT,                -- email from CF Access JWT
  item_name TEXT NOT NULL,          -- "TOPS Original pizza" / "Sports bar interior" / "Caesar salad"
  notes TEXT,                       -- optional context
  r2_key TEXT NOT NULL,             -- path in R2 bucket, e.g. uploads/2026-05-26-tops-original.jpg
  r2_url TEXT,                      -- full public URL (constructed at insert time)
  mime TEXT NOT NULL,               -- image/jpeg, image/png, etc.
  size_bytes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',  -- 'new' | 'wired' | 'rejected' | 'archived'
  status_updated_at TEXT,
  wired_to TEXT,                    -- which pizza/page slug it was assigned to (filled later by Steve or VPS Claude)
  steve_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_owner_photos_status ON owner_photos(status, created_at);
