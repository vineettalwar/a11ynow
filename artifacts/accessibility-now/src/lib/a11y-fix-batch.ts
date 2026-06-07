import { getAppBasePath } from "@/lib/api-base";
import { openPrintReport } from "@/lib/print-report";
import { runBatchScan, type BatchScanProgress } from "@/lib/batch-scan-sse";

const API_BASE = getAppBasePath();

export const A11Y_FIX_BATCH_STORAGE_KEY = "a11y_fix_batch_result";

export interface A11yFixBatchPage {
  auditId: string;
  url: string;
  score: number;
  level: string;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  passedChecks: number;
  totalChecks: number;
  scannedAt: string;
  status: "success" | "error";
  error?: string;
  pageScreenshot?: string;
}

export interface A11yFixCrossPageViolation {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  pageCount: number;
  totalAffectedElements: number;
  affectedUrls: string[];
}

export interface A11yFixBatchResult {
  siteScore: number;
  siteLevel: string;
  scannedAt: string;
  intent: string;
  pages: A11yFixBatchPage[];
  crossPageViolations: A11yFixCrossPageViolation[];
}

export async function runA11yFixBatchScan(
  url: string,
  intent: string,
  onProgress?: (progress: BatchScanProgress) => void,
): Promise<A11yFixBatchResult> {
  const batchResult = await runBatchScan(
    {
      url,
      wholeSite: true,
      profile: "strict",
      multiViewport: true,
    },
    onProgress,
  );

  return {
    siteScore: batchResult.siteScore,
    siteLevel: batchResult.siteLevel,
    scannedAt: batchResult.scannedAt,
    pages: batchResult.pages,
    crossPageViolations: batchResult.crossPageViolations as A11yFixCrossPageViolation[],
    intent,
  };
}

export function saveA11yFixBatchResult(result: A11yFixBatchResult): void {
  const payload = JSON.stringify(result);
  try {
    sessionStorage.setItem(A11Y_FIX_BATCH_STORAGE_KEY, payload);
  } catch {
    const slim = {
      ...result,
      pages: result.pages.map((p) => {
        const copy = { ...p };
        delete copy.pageScreenshot;
        return copy;
      }),
    };
    sessionStorage.setItem(A11Y_FIX_BATCH_STORAGE_KEY, JSON.stringify(slim));
  }
}

export function loadA11yFixBatchResult(): A11yFixBatchResult | null {
  try {
    const raw = sessionStorage.getItem(A11Y_FIX_BATCH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as A11yFixBatchResult;
  } catch {
    return null;
  }
}

export function a11yFixPdfUrl(auditId: string): string {
  return `${API_BASE}/reports/a11y-fix/${encodeURIComponent(auditId)}?print=1`;
}

export function openA11yFixPrintReport(auditId: string): void {
  openPrintReport("a11y-fix", auditId);
}
