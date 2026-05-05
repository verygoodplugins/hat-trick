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

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('busker', 'festival', 'supporter')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  location TEXT,
  answers TEXT NOT NULL,
  source TEXT DEFAULT 'hattrick-landing',
  status TEXT DEFAULT 'new',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type);
CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

CREATE VIEW IF NOT EXISTS application_stats AS
SELECT
  COUNT(*) AS total_applications,
  SUM(CASE WHEN type = 'busker' THEN 1 ELSE 0 END) AS busker_count,
  SUM(CASE WHEN type = 'festival' THEN 1 ELSE 0 END) AS festival_count,
  SUM(CASE WHEN type = 'supporter' THEN 1 ELSE 0 END) AS supporter_count,
  DATE(MIN(created_at)) AS first_application,
  DATE(MAX(created_at)) AS last_application
FROM applications;
