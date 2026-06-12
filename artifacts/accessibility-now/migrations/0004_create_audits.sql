CREATE TABLE IF NOT EXISTS audits (
  audit_id TEXT PRIMARY KEY NOT NULL,
  url TEXT NOT NULL,
  scanned_at TEXT NOT NULL,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  total_violations INTEGER NOT NULL,
  critical_violations INTEGER NOT NULL,
  serious_violations INTEGER NOT NULL,
  violations TEXT NOT NULL DEFAULT '[]',
  violations_ref TEXT,
  passed_checks INTEGER NOT NULL,
  total_checks INTEGER NOT NULL,
  scan_engine TEXT NOT NULL DEFAULT 'unknown',
  page_screenshot TEXT,
  scan_metadata TEXT
);

CREATE INDEX IF NOT EXISTS audits_scanned_at_idx ON audits (scanned_at);
