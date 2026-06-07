import type { AuditResult } from "@workspace/api-client-react";

function auditScanMeta(row: AuditResult | null | undefined): { pending?: boolean; failed?: boolean } | undefined {
  return row?.scanMetadata as { pending?: boolean; failed?: boolean } | undefined;
}

export function auditRowIsFailed(row: AuditResult | null | undefined): boolean {
  return auditScanMeta(row)?.failed === true;
}

export function auditRowIsPending(row: AuditResult | null | undefined): boolean {
  if (!row?.auditId || auditRowIsFailed(row)) return false;
  return auditScanMeta(row)?.pending === true;
}

/**
 * True when the API row looks like a completed scan (not pending, failed, or an empty shell).
 */
export function auditRowLooksUsable(row: AuditResult | null | undefined): boolean {
  if (!row || typeof row.auditId !== "string" || !row.auditId) return false;
  if (auditRowIsFailed(row) || auditRowIsPending(row)) return false;
  if (typeof row.url !== "string" || !row.url.trim()) return false;
  if (typeof row.scannedAt !== "string") return false;
  const scannedMs = Date.parse(row.scannedAt);
  if (Number.isNaN(scannedMs) || scannedMs <= 0) return false;

  const totalChecks = typeof row.totalChecks === "number" ? row.totalChecks : 0;
  const passed = typeof row.passedChecks === "number" ? row.passedChecks : 0;
  const violationCount = Array.isArray(row.violations) ? row.violations.length : 0;
  const totalV = typeof row.totalViolations === "number" ? row.totalViolations : 0;

  return totalChecks > 0 || passed > 0 || violationCount > 0 || totalV > 0;
}

export function mergeAuditRow(
  auditId: string,
  fromGet: AuditResult | undefined,
  fromPost: AuditResult | undefined,
): AuditResult | undefined {
  if (!auditId) return fromPost;

  const getIdMatch = fromGet?.auditId === auditId;
  const postIdMatch = fromPost?.auditId === auditId;

  const getUsable = Boolean(getIdMatch && auditRowLooksUsable(fromGet));
  const postUsable = Boolean(postIdMatch && auditRowLooksUsable(fromPost));

  if (getUsable) return fromGet;
  if (postUsable) return fromPost;
  if (postIdMatch) return fromPost;
  if (getIdMatch) return fromGet;
  return undefined;
}

/** Poll every 1s while an audit row is still pending in the background. */
export function auditRefetchIntervalMs(data: AuditResult | undefined): number | false {
  if (!data) return 1000;
  if (auditRowIsFailed(data) || auditRowLooksUsable(data)) return false;
  return auditRowIsPending(data) ? 1000 : false;
}
