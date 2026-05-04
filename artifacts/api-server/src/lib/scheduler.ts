import cron from "node-cron";
import { randomUUID } from "crypto";
import { lte, eq, and, desc } from "drizzle-orm";
import { db, monitoredUrlsTable, monitoringScansTable } from "@workspace/db";
import { runAccessibilityScan } from "./scan";
import { sendMonitoringSummary } from "./email";
import { logger } from "./logger";

const APP_BASE_URL = process.env["APP_BASE_URL"] ?? "https://accessibility.now";

function nextScanDate(frequency: string): Date {
  const d = new Date();
  if (frequency === "weekly") {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

async function runDueScans() {
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
    logger.info({ url: row.url, id: row.id }, "[scheduler] scanning");
    try {
      const result = await runAccessibilityScan(row.url, { collectRuntimeDiagnostics: false });

      const previousScans = await db
        .select()
        .from(monitoringScansTable)
        .where(eq(monitoringScansTable.monitoredUrlId, row.id))
        .orderBy(desc(monitoringScansTable.scannedAt))
        .limit(1);

      const previousScan = previousScans.length > 0 ? previousScans[0] : null;
      const previousScore = previousScan ? previousScan.score : null;

      const previousViolationIds = new Set(
        (previousScan?.violations as Array<{ id: string }> ?? []).map((v) => v.id),
      );

      const newViolations = result.violations.filter((v) => !previousViolationIds.has(v.id));
      const topIssues = (newViolations.length > 0 ? newViolations : result.violations)
        .slice(0, 5)
        .map((v) => ({ description: v.description, impact: v.impact }));

      await db.insert(monitoringScansTable).values({
        id: randomUUID(),
        monitoredUrlId: row.id,
        score: result.score,
        level: result.level,
        totalViolations: result.totalViolations,
        criticalViolations: result.criticalViolations,
        seriousViolations: result.seriousViolations,
        violations: result.violations,
        passedChecks: result.passedChecks,
        totalChecks: result.totalChecks,
        scannedAt: new Date(),
      });

      await db
        .update(monitoredUrlsTable)
        .set({ nextScanAt: nextScanDate(row.frequency) })
        .where(eq(monitoredUrlsTable.id, row.id));

      await sendMonitoringSummary({
        to: row.email,
        url: row.url,
        token: row.token,
        appBaseUrl: APP_BASE_URL,
        score: result.score,
        previousScore,
        criticalViolations: result.criticalViolations,
        seriousViolations: result.seriousViolations,
        totalViolations: result.totalViolations,
        topIssues,
        hasNewIssues: newViolations.length > 0,
      });

      logger.info({ url: row.url, score: result.score }, "[scheduler] scan saved and email sent");
    } catch (err) {
      logger.error({ err, url: row.url }, "[scheduler] scan failed for monitored URL");
    }
  }
}

export function startScheduler() {
  cron.schedule("0 * * * *", () => {
    runDueScans().catch((err) => logger.error({ err }, "[scheduler] unhandled error"));
  });
  logger.info("[scheduler] started — runs every hour");
}
