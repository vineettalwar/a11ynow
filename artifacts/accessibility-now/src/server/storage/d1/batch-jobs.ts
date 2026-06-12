import type {
  BatchJobResultStored,
  BatchJobStatus,
  BatchJobUrlState,
} from "@workspace/db";

type D1BatchJobRow = {
  batch_job_id: string;
  status: BatchJobStatus;
  discovery_source: string | null;
  scan_profile: "default" | "strict";
  multi_viewport: number;
  urls_json: string;
  progress_json: string;
  result_json: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type D1BatchJob = {
  batchJobId: string;
  status: BatchJobStatus;
  discoverySource: string | null;
  scanProfile: "default" | "strict";
  multiViewport: boolean;
  urlsJson: string[];
  progressJson: BatchJobUrlState[];
  resultJson: BatchJobResultStored | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
};

function rowToBatchJob(row: D1BatchJobRow): D1BatchJob {
  return {
    batchJobId: row.batch_job_id,
    status: row.status,
    discoverySource: row.discovery_source,
    scanProfile: row.scan_profile,
    multiViewport: row.multi_viewport === 1,
    urlsJson: JSON.parse(row.urls_json) as string[],
    progressJson: JSON.parse(row.progress_json) as BatchJobUrlState[],
    resultJson: row.result_json
      ? (JSON.parse(row.result_json) as BatchJobResultStored)
      : null,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  };
}

export async function d1CreateBatchJob(
  db: D1Database,
  input: {
    batchJobId: string;
    urls: string[];
    scanProfile: "default" | "strict";
    multiViewport: boolean;
    discoverySource?: "sitemap" | "links" | "single";
  },
): Promise<void> {
  const now = new Date().toISOString();
  const urlStates: BatchJobUrlState[] = input.urls.map((url) => ({ url, status: "queued" }));
  await db
    .prepare(
      `INSERT INTO batch_jobs (
        batch_job_id, status, discovery_source, scan_profile, multi_viewport,
        urls_json, progress_json, created_at, updated_at
      ) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.batchJobId,
      input.discoverySource ?? null,
      input.scanProfile,
      input.multiViewport ? 1 : 0,
      JSON.stringify(input.urls),
      JSON.stringify(urlStates),
      now,
      now,
    )
    .run();
}

export async function d1UpdateBatchJobStatus(
  db: D1Database,
  batchJobId: string,
  status: BatchJobStatus,
  errorMessage?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const completed = status === "completed" || status === "failed" ? now : null;
  await db
    .prepare(
      `UPDATE batch_jobs SET
        status = ?, updated_at = ?, completed_at = COALESCE(?, completed_at),
        error_message = COALESCE(?, error_message)
      WHERE batch_job_id = ?`,
    )
    .bind(status, now, completed, errorMessage ?? null, batchJobId)
    .run();
}

export async function d1UpdateBatchJobProgress(
  db: D1Database,
  batchJobId: string,
  progress: BatchJobUrlState[],
): Promise<void> {
  await db
    .prepare("UPDATE batch_jobs SET progress_json = ?, updated_at = ? WHERE batch_job_id = ?")
    .bind(JSON.stringify(progress), new Date().toISOString(), batchJobId)
    .run();
}

export async function d1UpdateBatchJobDiscovery(
  db: D1Database,
  batchJobId: string,
  input: {
    urls: string[];
    discoverySource: "sitemap" | "links" | "single";
    progress: BatchJobUrlState[];
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE batch_jobs SET
        urls_json = ?, discovery_source = ?, progress_json = ?, updated_at = ?
      WHERE batch_job_id = ?`,
    )
    .bind(
      JSON.stringify(input.urls),
      input.discoverySource,
      JSON.stringify(input.progress),
      new Date().toISOString(),
      batchJobId,
    )
    .run();
}

export async function d1CompleteBatchJob(
  db: D1Database,
  batchJobId: string,
  result: BatchJobResultStored,
): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE batch_jobs SET
        status = 'completed', result_json = ?, updated_at = ?, completed_at = ?
      WHERE batch_job_id = ?`,
    )
    .bind(JSON.stringify(result), now, now, batchJobId)
    .run();
}

export async function d1GetBatchJob(db: D1Database, batchJobId: string): Promise<D1BatchJob | null> {
  const row = await db
    .prepare("SELECT * FROM batch_jobs WHERE batch_job_id = ? LIMIT 1")
    .bind(batchJobId)
    .first<D1BatchJobRow>();
  return row ? rowToBatchJob(row) : null;
}
