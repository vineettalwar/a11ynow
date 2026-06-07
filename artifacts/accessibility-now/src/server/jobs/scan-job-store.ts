import { eq } from "drizzle-orm";
import { scanJobsTable, type ScanJobStatus, createDb } from "@workspace/db";
import { getDatabaseUrl } from "../cloudflare";

function jobDb() {
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
  const now = new Date();
  const db = jobDb();
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
  const now = new Date();
  const db = jobDb();
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

export async function getScanJob(jobId: string) {
  const db = jobDb();
  const rows = await db.select().from(scanJobsTable).where(eq(scanJobsTable.jobId, jobId)).limit(1);
  return rows[0] ?? null;
}
