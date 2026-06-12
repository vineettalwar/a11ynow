import type { MonitoredUrl } from "@workspace/db";

type D1MonitoredUrlRow = {
  id: string;
  url: string;
  email: string;
  frequency: string;
  token: string;
  is_active: number;
  created_at: string;
  next_scan_at: string;
};

function rowToMonitoredUrl(row: D1MonitoredUrlRow): MonitoredUrl {
  return {
    id: row.id,
    url: row.url,
    email: row.email,
    frequency: row.frequency,
    token: row.token,
    isActive: row.is_active === 1,
    createdAt: new Date(row.created_at),
    nextScanAt: new Date(row.next_scan_at),
  };
}

export async function d1FindDueMonitors(db: D1Database, now: Date): Promise<MonitoredUrl[]> {
  const result = await db
    .prepare(
      "SELECT * FROM monitored_urls WHERE is_active = 1 AND next_scan_at <= ? ORDER BY next_scan_at ASC",
    )
    .bind(now.toISOString())
    .all<D1MonitoredUrlRow>();
  return (result.results ?? []).map(rowToMonitoredUrl);
}

export async function d1FindMonitorByToken(
  db: D1Database,
  token: string,
): Promise<MonitoredUrl | null> {
  const row = await db
    .prepare("SELECT * FROM monitored_urls WHERE token = ? LIMIT 1")
    .bind(token)
    .first<D1MonitoredUrlRow>();
  return row ? rowToMonitoredUrl(row) : null;
}

export async function d1InsertMonitor(
  db: D1Database,
  input: Omit<MonitoredUrl, "isActive"> & { isActive?: boolean },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO monitored_urls (
        id, url, email, frequency, token, is_active, created_at, next_scan_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.id,
      input.url,
      input.email,
      input.frequency,
      input.token,
      input.isActive === false ? 0 : 1,
      input.createdAt.toISOString(),
      input.nextScanAt.toISOString(),
    )
    .run();
}

export async function d1UpdateMonitorNextScan(
  db: D1Database,
  id: string,
  nextScanAt: Date,
): Promise<void> {
  await db
    .prepare("UPDATE monitored_urls SET next_scan_at = ? WHERE id = ?")
    .bind(nextScanAt.toISOString(), id)
    .run();
}

export async function d1FindMonitorById(
  db: D1Database,
  id: string,
): Promise<MonitoredUrl | null> {
  const row = await db
    .prepare("SELECT * FROM monitored_urls WHERE id = ? LIMIT 1")
    .bind(id)
    .first<D1MonitoredUrlRow>();
  return row ? rowToMonitoredUrl(row) : null;
}

export async function d1UpdateMonitorActive(
  db: D1Database,
  id: string,
  isActive: boolean,
): Promise<void> {
  await db
    .prepare("UPDATE monitored_urls SET is_active = ? WHERE id = ?")
    .bind(isActive ? 1 : 0, id)
    .run();
}
