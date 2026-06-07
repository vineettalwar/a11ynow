CREATE TABLE IF NOT EXISTS leads (
  lead_id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  audit_id TEXT,
  company TEXT,
  service TEXT,
  message TEXT,
  website_url TEXT,
  source TEXT,
  created_at TEXT NOT NULL
);
