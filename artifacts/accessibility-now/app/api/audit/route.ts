import { randomUUID } from "crypto";
import { CreateAuditBody } from "@workspace/api-zod";
import { auditsTable } from "@workspace/db";
import { logger } from "@/server/logger";
import {
  runAccessibilityScan,
  validateScanUrl,
  ScanGateShutdownError,
  type ScanMetadata,
} from "@/server/scan";
import { jsonErr, jsonOk, prepareRequestDb, readJson, requestDb } from "@/server/http";

interface AuditViolationInstanceData {
  selector: string;
  htmlSnippet: string;
  failureSummary?: string;
  elementScreenshot?: string;
  checkDetails?: string[];
}

interface AuditViolationData {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
  topSelectors: string[];
  help?: string;
  helpUrl?: string;
  instanceDetails?: AuditViolationInstanceData[];
  detectedInViewports?: string[];
}

interface AuditResultData {
  auditId: string;
  url: string;
  scannedAt: string;
  score: number;
  level: "critical" | "poor" | "moderate" | "good" | "excellent";
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  violations: AuditViolationData[];
  passedChecks: number;
  totalChecks: number;
  scanEngine: "playwright" | "static_fallback" | "unknown";
  pageScreenshot?: string | null;
  scanMetadata?: ScanMetadata | null;
}

export async function POST(req: Request) {
  prepareRequestDb();
  const db = requestDb();

  const body = await readJson(req);
  const parsed = CreateAuditBody.safeParse(body);
  if (!parsed.success) {
    return jsonErr(400, "validation_error", parsed.error.message);
  }

  let raw = parsed.data.url;
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  const validation = await validateScanUrl(raw);
  if (!validation.ok) {
    return jsonErr(400, "invalid_url", validation.error);
  }

  const { url } = validation;
  logger.info({ url }, "Running accessibility audit");

  try {
    const result = await runAccessibilityScan(url, {
      profile: parsed.data.profile === "strict" ? "strict" : "default",
      multiViewport: parsed.data.multiViewport === true,
    });
    const auditId = randomUUID();
    const scannedAt = new Date();

    await db.insert(auditsTable).values({
      auditId,
      url,
      scannedAt,
      score: result.score,
      level: result.level,
      totalViolations: result.totalViolations,
      criticalViolations: result.criticalViolations,
      seriousViolations: result.seriousViolations,
      violations: result.violations,
      passedChecks: result.passedChecks,
      totalChecks: result.totalChecks,
      scanEngine: result.scanEngine,
      pageScreenshot: result.pageScreenshot ?? null,
      scanMetadata: result.scanMetadata ?? null,
    });

    return jsonOk({
      auditId,
      url,
      scannedAt: scannedAt.toISOString(),
      score: result.score,
      level: result.level,
      totalViolations: result.totalViolations,
      criticalViolations: result.criticalViolations,
      seriousViolations: result.seriousViolations,
      violations: result.violations,
      passedChecks: result.passedChecks,
      totalChecks: result.totalChecks,
      scanEngine: result.scanEngine,
      ...(result.pageScreenshot ? { pageScreenshot: result.pageScreenshot } : {}),
      ...(result.scanMetadata ? { scanMetadata: result.scanMetadata } : {}),
    } satisfies AuditResultData);
  } catch (err) {
    if (err instanceof ScanGateShutdownError) {
      logger.warn({ url }, "Audit rejected: scan engine shutting down");
      return jsonErr(
        503,
        "scan_unavailable",
        "The scan engine is restarting. Please try again in a moment.",
      );
    }
    logger.error({ err, url }, "Audit failed");
    return jsonErr(
      500,
      "audit_failed",
      "The accessibility audit could not be completed. Please try again.",
    );
  }
}
