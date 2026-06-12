import type { AuditViolationStored, MonitoringScan } from "@workspace/db";

type D1MonitoringScanRow = {
  id: string;
  monitored_url_id: string;
  score: number;
  level: string;
  total_violations: number;
  critical_violations: number;
  serious_violations: number;
  violations: string;
  violations_ref: string | null;
  passed_checks: number;
  total_checks: number;
  scanned_at: string;
};

function rowToMonitoringScan(row: D1MonitoringScanRow): MonitoringScan {
  return {
    id: row.id,
    monitoredUrlId: row.monitored_url_id,
    score: row.score,
    level: row.level,
    totalViolations: row.total_violations,
    criticalViolations: row.critical_violations,
    seriousViolations: row.serious_violations,
    violations: JSON.parse(row.violations) as AuditViolationStored[],
    violationsRef: row.violations_ref,
    passedChecks: row.passed_checks,
    totalChecks: row.total_checks,
    scannedAt: new Date(row.scanned_at),
  };
}

export async function d1InsertMonitoringScan(
  db: D1Database,
  input: Omit<MonitoringScan, "monitoredUrlId"> & { monitoredUrlId: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO monitoring_scans (
        id, monitored_url_id, score, level,
        total_violations, critical_violations, serious_violations,
        violations, violations_ref, passed_checks, total_checks, scanned_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.monitoredUrlId,
      input.score,
      input.level,
      input.totalViolations,
      input.criticalViolations,
      input.seriousViolations,
      JSON.stringify(input.violations),
      input.violationsRef,
      input.passedChecks,
      input.totalChecks,
      input.scannedAt.toISOString(),
    )
    .run();
}

export async function d1ListMonitoringScans(
  db: D1Database,
  monitoredUrlId: string,
): Promise<MonitoringScan[]> {
  const result = await db
    .prepare(
      "SELECT * FROM monitoring_scans WHERE monitored_url_id = ? ORDER BY scanned_at ASC",
    )
    .bind(monitoredUrlId)
    .all<D1MonitoringScanRow>();
  return (result.results ?? []).map(rowToMonitoringScan);
}

export async function d1FindLatestMonitoringScan(
  db: D1Database,
  monitoredUrlId: string,
): Promise<MonitoringScan | null> {
  const row = await db
    .prepare(
      "SELECT * FROM monitoring_scans WHERE monitored_url_id = ? ORDER BY scanned_at DESC LIMIT 1",
    )
    .bind(monitoredUrlId)
    .first<D1MonitoringScanRow>();
  return row ? rowToMonitoringScan(row) : null;
}
