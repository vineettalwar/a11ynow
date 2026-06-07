import { lte, eq, and } from "drizzle-orm";
import { monitoredUrlsTable } from "@workspace/db";
import { enqueueJob } from "./artifacts/storage";
import { logger } from "./logger";
import { requestDb } from "./http";
import { runMonitorJob } from "./jobs/run-monitor-job";

/** Find due monitors and enqueue scan work (Cloudflare Queue or local background). */
export async function runDueScans() {
  const db = requestDb();
  const now = new Date();
  logger.info({ now }, "[scheduler] checking for due monitoring scans");

  let dueRows: (typeof monitoredUrlsTable.$inferSelect)[];
  try {
    dueRows = await db
      .select()
      .from(monitoredUrlsTable)
      .where(and(eq(monitoredUrlsTable.isActive, true), lte(monitoredUrlsTable.nextScanAt, now)));
  } catch (err) {
    logger.error({ err }, "[scheduler] failed to query due scans");
    return;
  }

  logger.info({ count: dueRows.length }, "[scheduler] found due registrations");

  for (const row of dueRows) {
    await enqueueJob({ type: "monitor", monitoredUrlId: row.id });
    logger.info({ url: row.url, id: row.id }, "[scheduler] enqueued monitor scan");
  }
}

/** Local dev helper: optional hourly scheduler when ENABLE_LOCAL_SCHEDULER is set. */
export function startLocalScheduler() {
  if (process.env.NODE_ENV === "production") return;
  const intervalMs = 60 * 60 * 1000;
  setInterval(() => {
    runDueScans().catch((err) => logger.error({ err }, "[scheduler] unhandled error"));
  }, intervalMs);
  logger.info("[scheduler] local interval started (hourly)");
}

/** Process monitor jobs inline when no queue binding exists (used by tests). */
export async function runDueScansInline() {
  const db = requestDb();
  const now = new Date();
  const dueRows = await db
    .select()
    .from(monitoredUrlsTable)
    .where(and(eq(monitoredUrlsTable.isActive, true), lte(monitoredUrlsTable.nextScanAt, now)));

  for (const row of dueRows) {
    await runMonitorJob(row.id);
  }
}
