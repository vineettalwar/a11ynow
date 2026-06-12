import { eq } from "drizzle-orm";
import { scanJobsTable, type ScanJobStatus, createDb } from "@workspace/db";
import { getDatabaseUrl } from "../cloudflare";
import { getD1Database, getPostgresDb, resolveStorageBackend } from "../storage/backend";
import {
  d1CreateScanJob,
  d1GetScanJob,
  d1UpdateScanJobStatus,
  type D1ScanJob,
} from "../storage/d1/scan-jobs";

export type ScanJobRecord = {
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

function postgresJobDb() {
  const url = getDatabaseUrl() ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return createDb(url);
}

export interface CreateScanJobInput {
  jobId: string;
  auditId: string;
  url: string;
  profile: "default" | "strict";
  multiViewport: boolean;
}

export async function createScanJob(input: CreateScanJobInput): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1CreateScanJob(getD1Database(), input);
    return;
  }
  const now = new Date();
  const db = getPostgresDb();
  await db.insert(scanJobsTable).values({
    jobId: input.jobId,
    auditId: input.auditId,
    url: input.url,
    status: "pending",
    profile: input.profile,
    multiViewport: input.multiViewport,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateScanJobStatus(
  jobId: string,
  status: ScanJobStatus,
  errorMessage?: string,
): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1UpdateScanJobStatus(getD1Database(), jobId, status, errorMessage);
    return;
  }
  const now = new Date();
  const db = getPostgresDb();
  await db
    .update(scanJobsTable)
    .set({
      status,
      updatedAt: now,
      ...(status === "completed" || status === "failed" ? { completedAt: now } : {}),
      ...(errorMessage !== undefined ? { errorMessage } : {}),
    })
    .where(eq(scanJobsTable.jobId, jobId));
}

function mapD1ScanJob(job: D1ScanJob): ScanJobRecord {
  return {
    jobId: job.jobId,
    auditId: job.auditId,
    url: job.url,
    status: job.status,
    profile: job.profile,
    multiViewport: job.multiViewport,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt,
  };
}

export async function getScanJob(jobId: string): Promise<ScanJobRecord | null> {
  if (resolveStorageBackend() === "d1") {
    const job = await d1GetScanJob(getD1Database(), jobId);
    return job ? mapD1ScanJob(job) : null;
  }
  const db = postgresJobDb();
  const rows = await db.select().from(scanJobsTable).where(eq(scanJobsTable.jobId, jobId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    jobId: row.jobId,
    auditId: row.auditId,
    url: row.url,
    status: row.status,
    profile: row.profile as "default" | "strict",
    multiViewport: row.multiViewport,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  };
}
