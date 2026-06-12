import { enqueueJob } from "./artifacts/storage";
import { logger } from "./logger";
import { runMonitorJob } from "./jobs/run-monitor-job";
import { findDueMonitors } from "./storage/monitors";

/** Find due monitors and enqueue scan work (Cloudflare Queue or local background). */
export async function runDueScans() {
  const now = new Date();
  logger.info({ now }, "[scheduler] checking for due monitoring scans");

  let dueRows;
  try {
    dueRows = await findDueMonitors(now);
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
  const dueRows = await findDueMonitors();

  for (const row of dueRows) {
    await runMonitorJob(row.id);
  }
}
