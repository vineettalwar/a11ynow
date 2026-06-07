import { eq } from "drizzle-orm";
import { GetAuditParams } from "@workspace/api-zod";
import { auditsTable } from "@workspace/db";
import { logger } from "@/server/logger";
import type { ScanMetadata } from "@/server/scan";
import { jsonErr, jsonOk, prepareRequestDb, requestDb } from "@/server/http";

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

function dbRowToResult(row: typeof auditsTable.$inferSelect): AuditResultData {
  const pageScreenshot =
    typeof row.pageScreenshot === "string" && row.pageScreenshot.length > 0
      ? row.pageScreenshot
      : undefined;
  return {
    auditId: row.auditId,
    url: row.url,
    scannedAt: row.scannedAt.toISOString(),
    score: row.score,
    level: row.level as AuditResultData["level"],
    totalViolations: row.totalViolations,
    criticalViolations: row.criticalViolations,
    seriousViolations: row.seriousViolations,
    violations: row.violations as AuditViolationData[],
    passedChecks: row.passedChecks,
    totalChecks: row.totalChecks,
    scanEngine: row.scanEngine as AuditResultData["scanEngine"],
    ...(pageScreenshot ? { pageScreenshot } : {}),
    ...(row.scanMetadata ? { scanMetadata: row.scanMetadata as ScanMetadata } : {}),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  prepareRequestDb();
  const db = requestDb();

  const { auditId } = await params;
  const parsed = GetAuditParams.safeParse({ auditId });

  if (!parsed.success) {
    return jsonErr(400, "validation_error", parsed.error.message);
  }

  try {
    const rows = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.auditId, parsed.data.auditId))
      .limit(1);

    if (rows.length === 0) {
      return jsonErr(404, "not_found", "Audit result not found.");
    }

    return jsonOk(dbRowToResult(rows[0]));
  } catch (err) {
    logger.error({ err }, "Failed to retrieve audit from database");
    return jsonErr(500, "db_error", "Could not retrieve the audit result.");
  }
}
