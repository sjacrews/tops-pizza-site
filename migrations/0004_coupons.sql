-- $5 review/visit coupon tracking (2026-06-15)
CREATE TABLE IF NOT EXISTS coupons (
  code        TEXT PRIMARY KEY,
  name        TEXT,
  phone       TEXT,
  email       TEXT,
  community   TEXT,
  amount      TEXT DEFAULT '$5',
  issued_at   TEXT DEFAULT (datetime('now')),
  redeemed    INTEGER DEFAULT 0,
  redeemed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_coupons_redeemed ON coupons(redeemed);
