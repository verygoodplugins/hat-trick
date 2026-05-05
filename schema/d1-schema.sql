CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'hattrick-landing',
  created_at TEXT NOT NULL,
  confirmed BOOLEAN DEFAULT 1,
  unsubscribed BOOLEAN DEFAULT 0,
  metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_confirmed ON waitlist(confirmed);
CREATE INDEX IF NOT EXISTS idx_waitlist_unsubscribed ON waitlist(unsubscribed);

CREATE VIEW IF NOT EXISTS waitlist_stats AS
SELECT
  COUNT(*) AS total_signups,
  SUM(CASE WHEN confirmed = 1 THEN 1 ELSE 0 END) AS confirmed_count,
  SUM(CASE WHEN unsubscribed = 1 THEN 1 ELSE 0 END) AS unsubscribed_count,
  DATE(MIN(created_at)) AS first_signup,
  DATE(MAX(created_at)) AS last_signup
FROM waitlist;
