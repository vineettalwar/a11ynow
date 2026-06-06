const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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
  onProgress?: (pages: Array<{ url: string; status: string; score?: number }>) => void,
): Promise<A11yFixBatchResult> {
  const res = await fetch(`${API_BASE}/api/audit/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      wholeSite: true,
      profile: "strict",
      multiViewport: true,
    }),
  });

  if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let batchResult: Omit<A11yFixBatchResult, "intent"> | null = null;
  const progress: Array<{ url: string; status: string; score?: number }> = [];

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = JSON.parse(line.slice(6)) as {
          type: string;
          url?: string;
          index?: number;
          status?: "success" | "error";
          score?: number;
          message?: string;
          siteScore?: number;
          siteLevel?: string;
          pages?: A11yFixBatchPage[];
          crossPageViolations?: A11yFixCrossPageViolation[];
          scannedAt?: string;
        };

        if (data.type === "scanning" && data.url) {
          const existing = progress.find((p) => p.url === data.url);
          if (existing) existing.status = "scanning";
          else progress.push({ url: data.url, status: "scanning" });
          onProgress?.([...progress]);
        } else if (data.type === "page" && data.url) {
          const entry = progress.find((p) => p.url === data.url) ?? { url: data.url, status: "queued" };
          entry.status = data.status === "success" ? "done" : "error";
          entry.score = data.score;
          if (!progress.find((p) => p.url === data.url)) progress.push(entry);
          onProgress?.([...progress]);
        } else if (data.type === "complete") {
          batchResult = {
            siteScore: data.siteScore ?? 0,
            siteLevel: data.siteLevel ?? "moderate",
            scannedAt: data.scannedAt ?? new Date().toISOString(),
            pages: data.pages ?? [],
            crossPageViolations: data.crossPageViolations ?? [],
          };
          break outer;
        } else if (data.type === "error") {
          throw new Error(data.message ?? "Batch scan failed.");
        }
      }
    }
  }

  if (!batchResult) throw new Error("Batch scan did not return a result.");

  return { ...batchResult, intent };
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
  return `${API_BASE}/api/audit/${auditId}/a11y-fix-pdf`;
}
