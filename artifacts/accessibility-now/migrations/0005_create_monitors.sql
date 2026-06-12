CREATE TABLE IF NOT EXISTS monitored_urls (
  id TEXT PRIMARY KEY NOT NULL,
  url TEXT NOT NULL,
  email TEXT NOT NULL,
  frequency TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  next_scan_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS monitored_urls_next_scan_at_idx ON monitored_urls (next_scan_at);
CREATE INDEX IF NOT EXISTS monitored_urls_token_idx ON monitored_urls (token);

CREATE TABLE IF NOT EXISTS monitoring_scans (
  id TEXT PRIMARY KEY NOT NULL,
  monitored_url_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  total_violations INTEGER NOT NULL,
  critical_violations INTEGER NOT NULL,
  serious_violations INTEGER NOT NULL,
  violations TEXT NOT NULL DEFAULT '[]',
  violations_ref TEXT,
  passed_checks INTEGER NOT NULL,
  total_checks INTEGER NOT NULL,
  scanned_at TEXT NOT NULL,
  FOREIGN KEY (monitored_url_id) REFERENCES monitored_urls(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS monitoring_scans_monitored_url_id_idx ON monitoring_scans (monitored_url_id);
