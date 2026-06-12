import type { StoredScanMetadata } from "@workspace/db";
import { storePageScreenshot, persistViolationsArtifact } from "./artifacts/storage";
import { logger } from "./logger";
import { runAccessibilityScan, ScanGateShutdownError } from "./scan";
import { updateScanJobStatus } from "./jobs/scan-job-store";
import { updateAuditAfterScan } from "./storage/audits";

export interface RunAuditJobOptions {
  profile: "default" | "strict";
  multiViewport: boolean;
  jobId?: string;
}

export async function runAuditJob(
  auditId: string,
  url: string,
  options: RunAuditJobOptions,
): Promise<void> {
  const jobId = options.jobId ?? auditId;

  try {
    await updateScanJobStatus(jobId, "running");

    const result = await runAccessibilityScan(url, {
      profile: options.profile,
      multiViewport: options.multiViewport,
    });

    let pageScreenshot: string | null = null;
    if (result.pageScreenshot) {
      pageScreenshot = await storePageScreenshot(auditId, result.pageScreenshot);
    }

    const persistedViolations = await persistViolationsArtifact(
      { kind: "audit", id: auditId },
      result.violations,
    );

    await updateAuditAfterScan(auditId, {
      url,
      score: result.score,
      level: result.level,
      totalViolations: result.totalViolations,
      criticalViolations: result.criticalViolations,
      seriousViolations: result.seriousViolations,
      violations: persistedViolations.violations,
      violationsRef: persistedViolations.violationsRef,
      passedChecks: result.passedChecks,
      totalChecks: result.totalChecks,
      scanEngine: result.scanEngine,
      pageScreenshot,
      scanMetadata: result.scanMetadata
        ? ({ ...result.scanMetadata, pending: false } as StoredScanMetadata)
        : null,
    });

    await updateScanJobStatus(jobId, "completed");
    logger.info({ auditId, url, scanEngine: result.scanEngine }, "Background audit completed");
  } catch (err) {
    const message =
      err instanceof ScanGateShutdownError
        ? "Scan engine shutting down"
        : err instanceof Error
          ? err.message
          : "Scan failed";

    if (err instanceof ScanGateShutdownError) {
      logger.warn({ auditId, url }, "Background audit rejected: scan engine shutting down");
    } else {
      logger.error({ err, auditId, url }, "Background audit failed");
    }

    const failedMeta: StoredScanMetadata = {
      profile: options.profile,
      multiViewport: options.multiViewport,
      viewportsUsed: [],
      pending: false,
      failed: true,
    };

    await updateAuditAfterScan(auditId, {
      url,
      score: 0,
      level: "moderate",
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0,
      violations: [],
      violationsRef: null,
      passedChecks: 0,
      totalChecks: 0,
      scanEngine: "static_fallback",
      pageScreenshot: null,
      scanMetadata: failedMeta,
    });

    await updateScanJobStatus(jobId, "failed", message);
  }
}
