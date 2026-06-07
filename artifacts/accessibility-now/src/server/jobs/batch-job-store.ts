import { eq } from "drizzle-orm";
import {
  batchJobsTable,
  type BatchJobStatus,
  type BatchJobUrlState,
  type BatchJobResultStored,
  createDb,
} from "@workspace/db";
import type { BatchJobProgress } from "./types";
import { getDatabaseUrl } from "../cloudflare";

function jobDb() {
  const url = getDatabaseUrl() ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return createDb(url);
}

export interface CreateBatchJobInput {
  batchJobId: string;
  urls: string[];
  scanProfile: "default" | "strict";
  multiViewport: boolean;
  discoverySource?: "sitemap" | "links" | "single";
}

export async function createBatchJob(input: CreateBatchJobInput): Promise<void> {
  const now = new Date();
  const urlStates: BatchJobUrlState[] = input.urls.map((url) => ({ url, status: "queued" }));
  const db = jobDb();
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
  const now = new Date();
  const db = jobDb();
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
  const db = jobDb();
  await db
    .update(batchJobsTable)
    .set({ progressJson: progress, updatedAt: new Date() })
    .where(eq(batchJobsTable.batchJobId, batchJobId));
}

export async function completeBatchJob(
  batchJobId: string,
  result: BatchJobResultStored,
): Promise<void> {
  const now = new Date();
  const db = jobDb();
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

export async function getBatchJob(batchJobId: string) {
  const db = jobDb();
  const rows = await db
    .select()
    .from(batchJobsTable)
    .where(eq(batchJobsTable.batchJobId, batchJobId))
    .limit(1);
  return rows[0] ?? null;
}

export function batchJobToProgress(row: typeof batchJobsTable.$inferSelect): BatchJobProgress {
  return {
    discoverySource: (row.discoverySource as BatchJobProgress["discoverySource"]) ?? undefined,
    discovering: row.status === "pending" && row.progressJson.length === 0,
    urlStates: row.progressJson as BatchJobUrlState[],
  };
}
