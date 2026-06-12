import type { ScanJobStatus } from "@workspace/db";

type D1ScanJobRow = {
  job_id: string;
  audit_id: string;
  url: string;
  status: ScanJobStatus;
  profile: "default" | "strict";
  multi_viewport: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type D1ScanJob = {
  jobId: string;
  auditId: string;
  url: string;
  status: ScanJobStatus;
  profile: "default" | "strict";
  multiViewport: boolean;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

function rowToScanJob(row: D1ScanJobRow): D1ScanJob {
  return {
    jobId: row.job_id,
    auditId: row.audit_id,
    url: row.url,
    status: row.status,
    profile: row.profile,
    multiViewport: row.multi_viewport === 1,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  };
}

export async function d1CreateScanJob(
  db: D1Database,
  input: {
    jobId: string;
    auditId: string;
    url: string;
    profile: "default" | "strict";
    multiViewport: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO scan_jobs (
        job_id, audit_id, url, status, profile, multi_viewport,
        created_at, updated_at
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
    )
    .bind(
      input.jobId,
      input.auditId,
      input.url,
      input.profile,
      input.multiViewport ? 1 : 0,
      now,
      now,
    )
    .run();
}

export async function d1UpdateScanJobStatus(
  db: D1Database,
  jobId: string,
  status: ScanJobStatus,
  errorMessage?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const completed = status === "completed" || status === "failed" ? now : null;
  await db
    .prepare(
      `UPDATE scan_jobs SET
        status = ?, updated_at = ?, completed_at = COALESCE(?, completed_at),
        error_message = COALESCE(?, error_message)
      WHERE job_id = ?`,
    )
    .bind(status, now, completed, errorMessage ?? null, jobId)
    .run();
}

export async function d1GetScanJob(db: D1Database, jobId: string): Promise<D1ScanJob | null> {
  const row = await db
    .prepare("SELECT * FROM scan_jobs WHERE job_id = ? LIMIT 1")
    .bind(jobId)
    .first<D1ScanJobRow>();
  return row ? rowToScanJob(row) : null;
}
