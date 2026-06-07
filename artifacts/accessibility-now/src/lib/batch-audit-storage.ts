import type { BatchAuditResult } from "@/lib/batch-scan-sse";

export const BATCH_AUDIT_STORAGE_KEY = "batch_audit_result";

export function saveBatchAuditResult(result: BatchAuditResult): void {
  const payload = JSON.stringify(result);
  try {
    sessionStorage.setItem(BATCH_AUDIT_STORAGE_KEY, payload);
  } catch {
    const slim: BatchAuditResult = {
      ...result,
      pages: result.pages.map((p) => {
        const copy = { ...p };
        delete copy.pageScreenshot;
        return copy;
      }),
    };
    sessionStorage.setItem(BATCH_AUDIT_STORAGE_KEY, JSON.stringify(slim));
  }
}
