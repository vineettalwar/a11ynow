import { getAppBasePath } from "@/lib/api-base";

export type ReportKind = "audit" | "a11y-fix" | "batch";

export function reportPrintPath(kind: ReportKind, auditId?: string): string {
  const base = getAppBasePath();
  switch (kind) {
    case "audit":
      return `${base}/reports/audit/${encodeURIComponent(auditId ?? "")}`;
    case "a11y-fix":
      return `${base}/reports/a11y-fix/${encodeURIComponent(auditId ?? "")}`;
    case "batch":
      return `${base}/reports/batch`;
  }
}

/** Open a print-optimised report; user saves via the browser print dialog (PDF). */
export function openPrintReport(kind: ReportKind, auditId?: string, options?: { autoPrint?: boolean }): void {
  const url = new URL(reportPrintPath(kind, auditId), window.location.origin);
  if (options?.autoPrint !== false) {
    url.searchParams.set("print", "1");
  }
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

/** @deprecated Server PDF — use openPrintReport for Cloudflare-safe exports. */
export function legacyAuditPdfUrl(auditId: string): string {
  return `${getAppBasePath()}/api/audit/${encodeURIComponent(auditId)}/pdf`;
}

export function auditReportPrintUrl(auditId: string): string {
  return reportPrintPath("audit", auditId);
}

export function a11yFixReportPrintUrl(auditId: string): string {
  return reportPrintPath("a11y-fix", auditId);
}

export function batchReportPrintUrl(): string {
  return reportPrintPath("batch");
}
