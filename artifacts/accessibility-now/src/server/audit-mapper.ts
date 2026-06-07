import type { auditsTable } from "@workspace/db";
import { resolvePageScreenshot, resolveStoredViolations } from "./artifacts/storage";
import type { ScanMetadata } from "./scan";

export interface AuditViolationInstanceData {
  selector: string;
  htmlSnippet: string;
  failureSummary?: string;
  elementScreenshot?: string;
  checkDetails?: string[];
}

export interface AuditViolationData {
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

export interface AuditResultData {
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

export async function dbRowToAuditResult(
  row: typeof auditsTable.$inferSelect,
): Promise<AuditResultData> {
  const resolvedScreenshot = await resolvePageScreenshot(row.pageScreenshot);
  const violations = await resolveStoredViolations(row.violations, row.violationsRef);
  return {
    auditId: row.auditId,
    url: row.url,
    scannedAt: row.scannedAt.toISOString(),
    score: row.score,
    level: row.level as AuditResultData["level"],
    totalViolations: row.totalViolations,
    criticalViolations: row.criticalViolations,
    seriousViolations: row.seriousViolations,
    violations,
    passedChecks: row.passedChecks,
    totalChecks: row.totalChecks,
    scanEngine: row.scanEngine as AuditResultData["scanEngine"],
    ...(resolvedScreenshot ? { pageScreenshot: resolvedScreenshot } : {}),
    ...(row.scanMetadata ? { scanMetadata: row.scanMetadata as ScanMetadata } : {}),
  };
}
