import { eq } from "drizzle-orm";
import {
  batchJobsTable,
  type BatchJobStatus,
  type BatchJobUrlState,
  type BatchJobResultStored,
} from "@workspace/db";
import type { BatchJobProgress } from "./types";
import { getD1Database, getPostgresDb, resolveStorageBackend } from "../storage/backend";
import {
  d1CompleteBatchJob,
  d1CreateBatchJob,
  d1GetBatchJob,
  d1UpdateBatchJobDiscovery,
  d1UpdateBatchJobProgress,
  d1UpdateBatchJobStatus,
  type D1BatchJob,
} from "../storage/d1/batch-jobs";

export type BatchJobRecord = {
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

export interface CreateBatchJobInput {
  batchJobId: string;
  urls: string[];
  scanProfile: "default" | "strict";
  multiViewport: boolean;
  discoverySource?: "sitemap" | "links" | "single";
}

function mapD1BatchJob(job: D1BatchJob): BatchJobRecord {
  return {
    batchJobId: job.batchJobId,
    status: job.status,
    discoverySource: job.discoverySource,
    scanProfile: job.scanProfile,
    multiViewport: job.multiViewport,
    urlsJson: job.urlsJson,
    progressJson: job.progressJson,
    resultJson: job.resultJson,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
  };
}

export async function createBatchJob(input: CreateBatchJobInput): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1CreateBatchJob(getD1Database(), input);
    return;
  }
  const now = new Date();
  const urlStates: BatchJobUrlState[] = input.urls.map((url) => ({ url, status: "queued" }));
  const db = getPostgresDb();
  await db.insert(batchJobsTable).values({
    batchJobId: input.batchJobId,
    status: "pending",
    discoverySource: input.discoverySource ?? null,
    scanProfile: input.scanProfile,
    multiViewport: input.multiViewport,
    urlsJson: input.urls,
    progressJson: urlStates,
    resultJson: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateBatchJobStatus(
  batchJobId: string,
  status: BatchJobStatus,
  errorMessage?: string,
): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1UpdateBatchJobStatus(getD1Database(), batchJobId, status, errorMessage);
    return;
  }
  const now = new Date();
  const db = getPostgresDb();
  await db
    .update(batchJobsTable)
    .set({
      status,
      updatedAt: now,
      ...(status === "completed" || status === "failed" ? { completedAt: now } : {}),
      ...(errorMessage !== undefined ? { errorMessage } : {}),
    })
    .where(eq(batchJobsTable.batchJobId, batchJobId));
}

export async function updateBatchJobProgress(
  batchJobId: string,
  progress: BatchJobUrlState[],
): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1UpdateBatchJobProgress(getD1Database(), batchJobId, progress);
    return;
  }
  const db = getPostgresDb();
  await db
    .update(batchJobsTable)
    .set({ progressJson: progress, updatedAt: new Date() })
    .where(eq(batchJobsTable.batchJobId, batchJobId));
}

export async function updateBatchJobDiscovery(
  batchJobId: string,
  input: {
    urls: string[];
    discoverySource: "sitemap" | "links" | "single";
    progress: BatchJobUrlState[];
  },
): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1UpdateBatchJobDiscovery(getD1Database(), batchJobId, input);
    return;
  }
  const db = getPostgresDb();
  await db
    .update(batchJobsTable)
    .set({
      urlsJson: input.urls,
      discoverySource: input.discoverySource,
      progressJson: input.progress,
      updatedAt: new Date(),
    })
    .where(eq(batchJobsTable.batchJobId, batchJobId));
}

export async function completeBatchJob(
  batchJobId: string,
  result: BatchJobResultStored,
): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1CompleteBatchJob(getD1Database(), batchJobId, result);
    return;
  }
  const now = new Date();
  const db = getPostgresDb();
  await db
    .update(batchJobsTable)
    .set({
      status: "completed",
      resultJson: result,
      updatedAt: now,
      completedAt: now,
    })
    .where(eq(batchJobsTable.batchJobId, batchJobId));
}

export async function getBatchJob(batchJobId: string): Promise<BatchJobRecord | null> {
  if (resolveStorageBackend() === "d1") {
    const job = await d1GetBatchJob(getD1Database(), batchJobId);
    return job ? mapD1BatchJob(job) : null;
  }
  const db = getPostgresDb();
  const rows = await db
    .select()
    .from(batchJobsTable)
    .where(eq(batchJobsTable.batchJobId, batchJobId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    batchJobId: row.batchJobId,
    status: row.status,
    discoverySource: row.discoverySource,
    scanProfile: row.scanProfile as "default" | "strict",
    multiViewport: row.multiViewport,
    urlsJson: row.urlsJson,
    progressJson: row.progressJson,
    resultJson: row.resultJson,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  };
}

export function batchJobToProgress(row: BatchJobRecord): BatchJobProgress {
  const pendingDiscovery =
    !row.discoverySource &&
    row.progressJson.length <= 1 &&
    (row.status === "pending" || row.status === "running");
  return {
    discoverySource: (row.discoverySource as BatchJobProgress["discoverySource"]) ?? undefined,
    discovering: pendingDiscovery,
    urlStates: row.progressJson,
  };
}
