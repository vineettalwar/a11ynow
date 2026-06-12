import type {
  Audit,
  AuditViolationStored,
  StoredScanMetadata,
} from "@workspace/db";

type D1AuditRow = {
  audit_id: string;
  url: string;
  scanned_at: string;
  score: number;
  level: string;
  total_violations: number;
  critical_violations: number;
  serious_violations: number;
  violations: string;
  violations_ref: string | null;
  passed_checks: number;
  total_checks: number;
  scan_engine: string;
  page_screenshot: string | null;
  scan_metadata: string | null;
};

function rowToAudit(row: D1AuditRow): Audit {
  return {
    auditId: row.audit_id,
    url: row.url,
    scannedAt: new Date(row.scanned_at),
    score: row.score,
    level: row.level,
    totalViolations: row.total_violations,
    criticalViolations: row.critical_violations,
    seriousViolations: row.serious_violations,
    violations: JSON.parse(row.violations) as AuditViolationStored[],
    violationsRef: row.violations_ref,
    passedChecks: row.passed_checks,
    totalChecks: row.total_checks,
    scanEngine: row.scan_engine,
    pageScreenshot: row.page_screenshot,
    scanMetadata: row.scan_metadata
      ? (JSON.parse(row.scan_metadata) as StoredScanMetadata)
      : null,
  };
}

export async function d1FindAuditById(db: D1Database, auditId: string): Promise<Audit | null> {
  const row = await db
    .prepare("SELECT * FROM audits WHERE audit_id = ? LIMIT 1")
    .bind(auditId)
    .first<D1AuditRow>();
  return row ? rowToAudit(row) : null;
}

export async function d1FindAuditsByIds(db: D1Database, auditIds: string[]): Promise<Audit[]> {
  if (auditIds.length === 0) return [];
  const placeholders = auditIds.map(() => "?").join(", ");
  const result = await db
    .prepare(`SELECT * FROM audits WHERE audit_id IN (${placeholders})`)
    .bind(...auditIds)
    .all<D1AuditRow>();
  return (result.results ?? []).map(rowToAudit);
}

export async function d1InsertPendingAudit(
  db: D1Database,
  input: {
    auditId: string;
    url: string;
    scannedAt: Date;
    scanMetadata: StoredScanMetadata;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audits (
        audit_id, url, scanned_at, score, level,
        total_violations, critical_violations, serious_violations,
        violations, passed_checks, total_checks, scan_engine,
        page_screenshot, scan_metadata
      ) VALUES (?, ?, ?, 0, 'moderate', 0, 0, 0, '[]', 0, 0, 'unknown', NULL, ?)`,
    )
    .bind(
      input.auditId,
      input.url,
      input.scannedAt.toISOString(),
      JSON.stringify(input.scanMetadata),
    )
    .run();
}

export async function d1UpdateAuditAfterScan(
  db: D1Database,
  auditId: string,
  update: {
    url: string;
    score: number;
    level: string;
    totalViolations: number;
    criticalViolations: number;
    seriousViolations: number;
    violations: AuditViolationStored[];
    violationsRef: string | null;
    passedChecks: number;
    totalChecks: number;
    scanEngine: string;
    pageScreenshot: string | null;
    scanMetadata: StoredScanMetadata | null;
  },
): Promise<void> {
  await db
    .prepare(
      `UPDATE audits SET
        url = ?, score = ?, level = ?,
        total_violations = ?, critical_violations = ?, serious_violations = ?,
        violations = ?, violations_ref = ?,
        passed_checks = ?, total_checks = ?,
        scan_engine = ?, page_screenshot = ?, scan_metadata = ?
      WHERE audit_id = ?`,
    )
    .bind(
      update.url,
      update.score,
      update.level,
      update.totalViolations,
      update.criticalViolations,
      update.seriousViolations,
      JSON.stringify(update.violations),
      update.violationsRef,
      update.passedChecks,
      update.totalChecks,
      update.scanEngine,
      update.pageScreenshot,
      update.scanMetadata ? JSON.stringify(update.scanMetadata) : null,
      auditId,
    )
    .run();
}

export async function d1MarkAuditFailed(
  db: D1Database,
  auditId: string,
  scanMetadata: StoredScanMetadata,
): Promise<void> {
  await db
    .prepare("UPDATE audits SET scan_metadata = ? WHERE audit_id = ?")
    .bind(JSON.stringify(scanMetadata), auditId)
    .run();
}
