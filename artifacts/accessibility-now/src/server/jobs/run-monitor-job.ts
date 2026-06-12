import { randomUUID } from "crypto";
import type { AuditViolationStored } from "@workspace/db";
import { persistViolationsArtifact, resolveStoredViolations } from "../artifacts/storage";
import { sendMonitoringSummary } from "../email";
import { logger } from "../logger";
import { runAccessibilityScan } from "../scan";
import {
  findActiveMonitorById,
  findLatestMonitoringScan,
  insertMonitoringScan,
  updateMonitorNextScan,
} from "../storage/monitors";

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

export async function runMonitorJob(monitoredUrlId: string): Promise<void> {
  const row = await findActiveMonitorById(monitoredUrlId);
  if (!row) {
    logger.warn({ monitoredUrlId }, "Monitor job skipped: registration not found or inactive");
    return;
  }

  logger.info({ url: row.url, id: row.id }, "[monitor-job] scanning");

  try {
    const result = await runAccessibilityScan(row.url, { collectRuntimeDiagnostics: false });

    const previousScan = await findLatestMonitoringScan(row.id);
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

    await insertMonitoringScan({
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

    await updateMonitorNextScan(row.id, nextScanDate(row.frequency));

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
