import { randomUUID } from "crypto";
import { auditsTable, createDb } from "@workspace/db";
import { aggregateCrossPageViolations, computeWeightedSiteScore } from "../batch-report";
import { storePageScreenshot, persistViolationsArtifact } from "../artifacts/storage";
import { getDatabaseUrl } from "../cloudflare";
import { logger } from "../logger";
import {
  launchChromiumForAudit,
  runAccessibilityScan,
  scoreToLevel,
  type AuditViolation,
} from "../scan";
import {
  completeBatchJob,
  getBatchJob,
  updateBatchJobProgress,
  updateBatchJobStatus,
} from "./batch-job-store";
import type { BatchJobUrlState } from "./types";

function jobDb() {
  const url = getDatabaseUrl() ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return createDb(url);
}

export async function runBatchJob(batchJobId: string): Promise<void> {
  const row = await getBatchJob(batchJobId);
  if (!row) {
    logger.warn({ batchJobId }, "Batch job not found");
    return;
  }
  if (row.status === "completed" || row.status === "failed") return;

  const urls = row.urlsJson as string[];
  const scanProfile = row.scanProfile === "strict" ? ("strict" as const) : ("default" as const);
  const multiViewport = row.multiViewport;
  let progress = [...(row.progressJson as BatchJobUrlState[])];
  const db = jobDb();

  await updateBatchJobStatus(batchJobId, "running");

  const scannedAt = new Date();
  const pages: Array<{
    auditId: string;
    url: string;
    score: number;
    level: ReturnType<typeof scoreToLevel>;
    totalViolations: number;
    criticalViolations: number;
    seriousViolations: number;
    passedChecks: number;
    totalChecks: number;
    scannedAt: string;
    status: "success" | "error";
    error?: string;
    scanEngine?: string | null;
    pageScreenshot?: string;
    violations: AuditViolation[];
  }> = [];

  const patchProgress = async (index: number, patch: Partial<BatchJobUrlState>) => {
    progress = progress.map((s, i) => (i === index ? { ...s, ...patch } : s));
    await updateBatchJobProgress(batchJobId, progress);
  };

  try {
    const browser = await launchChromiumForAudit();
    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i]!;
        await patchProgress(i, { status: "scanning" });

        try {
          const result = await runAccessibilityScan(url, {
            browser,
            collectRuntimeDiagnostics: false,
            profile: scanProfile,
            multiViewport,
          });
          const auditId = randomUUID();

          let pageScreenshot: string | null = null;
          if (result.pageScreenshot) {
            pageScreenshot = await storePageScreenshot(auditId, result.pageScreenshot);
          }

          const persistedViolations = await persistViolationsArtifact(
            { kind: "audit", id: auditId },
            result.violations,
          );

          await db.insert(auditsTable).values({
            auditId,
            url,
            scannedAt,
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
            scanMetadata: result.scanMetadata ?? null,
          });

          pages.push({
            auditId,
            url,
            score: result.score,
            level: result.level,
            totalViolations: result.totalViolations,
            criticalViolations: result.criticalViolations,
            seriousViolations: result.seriousViolations,
            passedChecks: result.passedChecks,
            totalChecks: result.totalChecks,
            scannedAt: scannedAt.toISOString(),
            status: "success",
            scanEngine: result.scanEngine,
            violations: result.violations,
            ...(pageScreenshot ? { pageScreenshot } : {}),
          });

          await patchProgress(i, {
            status: "done",
            score: result.score,
            level: result.level,
            auditId,
          });
        } catch (err) {
          logger.warn({ err, url, batchJobId }, "Batch scan failed for URL");
          pages.push({
            auditId: "",
            url,
            score: 0,
            level: scoreToLevel(0),
            totalViolations: 0,
            criticalViolations: 0,
            seriousViolations: 0,
            violations: [],
            passedChecks: 0,
            totalChecks: 0,
            scannedAt: scannedAt.toISOString(),
            status: "error",
            error: "Scan failed. The site may be unreachable or blocking automated scanners.",
            scanEngine: null,
          });
          await patchProgress(i, {
            status: "error",
            error: "Scan failed. The site may be unreachable or blocking automated scanners.",
          });
        }
      }
    } finally {
      await browser.close().catch(() => {});
    }

    const successPages = pages.filter((p) => p.status === "success");
    const siteScore = computeWeightedSiteScore(
      successPages.map((p) => ({ score: p.score, totalChecks: p.totalChecks })),
    );
    const siteLevel = scoreToLevel(siteScore);
    const crossPageViolations = aggregateCrossPageViolations(
      pages.map((p) => ({ url: p.url, status: p.status, violations: p.violations })),
    );

    await completeBatchJob(batchJobId, {
      siteScore,
      siteLevel,
      scannedAt: scannedAt.toISOString(),
      pages: pages.map(({ violations: _v, ...rest }) => rest),
      crossPageViolations: crossPageViolations as unknown as Array<Record<string, unknown>>,
    });

    logger.info({ batchJobId, siteScore, urlCount: urls.length }, "Batch job completed");
  } catch (err) {
    logger.error({ err, batchJobId }, "Batch job failed");
    await updateBatchJobStatus(
      batchJobId,
      "failed",
      err instanceof Error ? err.message : "Batch scan failed.",
    );
  }
}
