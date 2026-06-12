import { getAppBasePath } from "@/lib/api-base";

export type DiscoverySource = "sitemap" | "links" | "single";
export type UrlScanStatus = "queued" | "scanning" | "done" | "error";

export interface UrlScanState {
  url: string;
  status: UrlScanStatus;
  score?: number;
  level?: string;
  auditId?: string;
  error?: string;
  pageScreenshot?: string;
}

export interface BatchAuditPage {
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

export interface BatchAuditResult {
  siteScore: number;
  siteLevel: string;
  scannedAt: string;
  pages: BatchAuditPage[];
  crossPageViolations: Array<{
    id: string;
    wcagCriteria: string;
    description: string;
    impact: string;
    pageCount: number;
    totalAffectedElements: number;
    affectedUrls: string[];
  }>;
}

export interface BatchScanProgress {
  discoverySource?: DiscoverySource;
  discovering: boolean;
  urlStates: UrlScanState[];
}

export interface BatchScanRequest {
  url: string;
  wholeSite?: boolean;
  urls?: string[];
  profile?: "default" | "strict";
  multiViewport?: boolean;
}

interface BatchJobAccepted {
  batchJobId: string;
  status: string;
  discoverySource?: DiscoverySource;
  urlCount: number;
  urls?: string[];
}

interface BatchJobStatusResponse {
  batchJobId: string;
  status: "pending" | "running" | "completed" | "failed";
  error?: string;
  progress: BatchScanProgress;
  result?: BatchAuditResult;
}

export function discoveryHeading(source: DiscoverySource | undefined, count: number): string {
  if (source === "sitemap") {
    return count === 1 ? "Found 1 URL from sitemap" : `Found ${count} URLs from sitemap`;
  }
  if (source === "links") {
    return count === 1 ? "Found 1 URL from homepage links" : `Found ${count} URLs from homepage links`;
  }
  if (count === 1) return "Scanning 1 page";
  return `Scanning ${count} pages`;
}

export const urlScanStatusLabel: Record<UrlScanStatus, string> = {
  queued: "Up next",
  scanning: "Scanning now…",
  done: "Scanned",
  error: "Failed",
};

export const urlScanStatusDotClass: Record<UrlScanStatus, string> = {
  queued: "bg-muted-foreground/40",
  scanning: "bg-primary animate-pulse",
  done: "bg-emerald-500",
  error: "bg-destructive",
};

const POLL_MS = 1000;

export function progressFromAccepted(body: BatchJobAccepted): BatchScanProgress | null {
  if (!Array.isArray(body.urls) || body.urls.length === 0) return null;
  return {
    discoverySource: body.discoverySource,
    discovering: !body.discoverySource && body.urls.length <= 1,
    urlStates: body.urls.map((url) => ({ url, status: "queued" as const })),
  };
}

export async function startBatchScan(
  request: BatchScanRequest,
  onProgress?: (progress: BatchScanProgress) => void,
): Promise<{ batchJobId: string }> {
  const res = await fetch(`${getAppBasePath()}/api/audit/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  const body = (await res.json().catch(() => ({}))) as BatchJobAccepted & { message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  const initial = progressFromAccepted(body);
  if (initial) onProgress?.(initial);

  return { batchJobId: body.batchJobId };
}

async function fetchBatchJobStatus(batchJobId: string): Promise<BatchJobStatusResponse> {
  const res = await fetch(`${getAppBasePath()}/api/audit/batch/jobs/${encodeURIComponent(batchJobId)}`);
  const body = (await res.json().catch(() => ({}))) as BatchJobStatusResponse & { message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return body;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Poll batch job status until complete. Replaces the legacy SSE consumer. */
export async function pollBatchScan(
  batchJobId: string,
  onProgress?: (progress: BatchScanProgress) => void,
): Promise<BatchAuditResult> {
  while (true) {
    const status = await fetchBatchJobStatus(batchJobId);
    onProgress?.(status.progress);

    if (status.status === "failed") {
      throw new Error(status.error ?? "Batch scan failed.");
    }

    if (status.status === "completed" && status.result) {
      return status.result;
    }

    await sleep(POLL_MS);
  }
}

/** Start a batch scan and poll until the aggregated result is ready. */
export async function runBatchScan(
  request: BatchScanRequest,
  onProgress?: (progress: BatchScanProgress) => void,
): Promise<BatchAuditResult> {
  const { batchJobId } = await startBatchScan(request, onProgress);
  return pollBatchScan(batchJobId, onProgress);
}

export { runBatchScan as consumeBatchScanFromJob };
