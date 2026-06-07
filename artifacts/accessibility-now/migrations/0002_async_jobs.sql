CREATE TABLE IF NOT EXISTS scan_jobs (
  job_id TEXT PRIMARY KEY NOT NULL,
  audit_id TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  profile TEXT NOT NULL DEFAULT 'default',
  multi_viewport INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS scan_jobs_audit_id_idx ON scan_jobs (audit_id);
CREATE INDEX IF NOT EXISTS scan_jobs_status_idx ON scan_jobs (status);

CREATE TABLE IF NOT EXISTS batch_jobs (
  batch_job_id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  discovery_source TEXT,
  scan_profile TEXT NOT NULL DEFAULT 'default',
  multi_viewport INTEGER NOT NULL DEFAULT 0,
  urls_json TEXT NOT NULL DEFAULT '[]',
  progress_json TEXT NOT NULL DEFAULT '[]',
  result_json TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS batch_jobs_status_idx ON batch_jobs (status);
