import { randomUUID } from "crypto";
import { eq, desc, and } from "drizzle-orm";
import {
  monitoredUrlsTable,
  monitoringScansTable,
  createDb,
  type AuditViolationStored,
} from "@workspace/db";
import { getDatabaseUrl } from "../cloudflare";
import { persistViolationsArtifact, resolveStoredViolations } from "../artifacts/storage";
import { sendMonitoringSummary } from "../email";
import { logger } from "../logger";
import { runAccessibilityScan } from "../scan";

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

function jobDb() {
  const url = getDatabaseUrl() ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return createDb(url);
}

export async function runMonitorJob(monitoredUrlId: string): Promise<void> {
  const db = jobDb();
  const rows = await db
    .select()
    .from(monitoredUrlsTable)
    .where(and(eq(monitoredUrlsTable.id, monitoredUrlId), eq(monitoredUrlsTable.isActive, true)))
    .limit(1);

  const row = rows[0];
  if (!row) {
    logger.warn({ monitoredUrlId }, "Monitor job skipped: registration not found or inactive");
    return;
  }

  logger.info({ url: row.url, id: row.id }, "[monitor-job] scanning");

  try {
    const result = await runAccessibilityScan(row.url, { collectRuntimeDiagnostics: false });

    const previousScans = await db
      .select()
      .from(monitoringScansTable)
      .where(eq(monitoringScansTable.monitoredUrlId, row.id))
      .orderBy(desc(monitoringScansTable.scannedAt))
      .limit(1);

    const previousScan = previousScans[0] ?? null;
    const previousScore = previousScan ? previousScan.score : null;
    const previousViolations = previousScan
      ? await resolveStoredViolations(
          previousScan.violations as AuditViolationStored[],
          previousScan.violationsRef,
        )
      : [];
    const previousViolationIds = new Set(previousViolations.map((v) => v.id));
    const newViolations = result.violations.filter((v) => !previousViolationIds.has(v.id));
    const topIssues = (newViolations.length > 0 ? newViolations : result.violations)
      .slice(0, 5)
      .map((v) => ({ description: v.description, impact: v.impact }));

    const scanId = randomUUID();
    const persistedViolations = await persistViolationsArtifact(
      { kind: "monitor", id: scanId },
      result.violations as AuditViolationStored[],
    );

    await db.insert(monitoringScansTable).values({
      id: scanId,
      monitoredUrlId: row.id,
      score: result.score,
      level: result.level,
      totalViolations: result.totalViolations,
      criticalViolations: result.criticalViolations,
      seriousViolations: result.seriousViolations,
      violations: persistedViolations.violations,
      violationsRef: persistedViolations.violationsRef,
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

    logger.info({ url: row.url, score: result.score }, "[monitor-job] scan saved and email sent");
  } catch (err) {
    logger.error({ err, url: row.url }, "[monitor-job] scan failed");
  }
}
