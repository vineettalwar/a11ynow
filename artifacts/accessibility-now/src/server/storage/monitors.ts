import { and, asc, desc, eq, lte } from "drizzle-orm";
import {
  monitoredUrlsTable,
  monitoringScansTable,
  type MonitoredUrl,
  type MonitoringScan,
} from "@workspace/db";
import { getD1Database, getPostgresDb, resolveStorageBackend } from "./backend";
import {
  d1FindDueMonitors,
  d1FindMonitorById,
  d1FindMonitorByToken,
  d1InsertMonitor,
  d1UpdateMonitorNextScan,
  d1UpdateMonitorActive,
} from "./d1/monitors";
import {
  d1FindLatestMonitoringScan,
  d1InsertMonitoringScan,
  d1ListMonitoringScans,
} from "./d1/monitoring-scans";

export async function findDueMonitors(now = new Date()): Promise<MonitoredUrl[]> {
  if (resolveStorageBackend() === "d1") {
    return d1FindDueMonitors(getD1Database(), now);
  }
  const db = getPostgresDb();
  return db
    .select()
    .from(monitoredUrlsTable)
    .where(and(eq(monitoredUrlsTable.isActive, true), lte(monitoredUrlsTable.nextScanAt, now)));
}

export async function insertMonitor(
  input: Omit<MonitoredUrl, "isActive"> & { isActive?: boolean },
): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1InsertMonitor(getD1Database(), input);
    return;
  }
  const db = getPostgresDb();
  await db.insert(monitoredUrlsTable).values({
    id: input.id,
    url: input.url,
    email: input.email,
    frequency: input.frequency,
    token: input.token,
    isActive: input.isActive !== false,
    createdAt: input.createdAt,
    nextScanAt: input.nextScanAt,
  });
}

export async function findMonitorByToken(token: string): Promise<MonitoredUrl | null> {
  if (resolveStorageBackend() === "d1") {
    return d1FindMonitorByToken(getD1Database(), token);
  }
  const db = getPostgresDb();
  const rows = await db
    .select()
    .from(monitoredUrlsTable)
    .where(eq(monitoredUrlsTable.token, token))
    .limit(1);
  return rows[0] ?? null;
}

export async function findMonitorById(id: string): Promise<MonitoredUrl | null> {
  if (resolveStorageBackend() === "d1") {
    return d1FindMonitorById(getD1Database(), id);
  }
  const db = getPostgresDb();
  const rows = await db
    .select()
    .from(monitoredUrlsTable)
    .where(eq(monitoredUrlsTable.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function findActiveMonitorById(id: string): Promise<MonitoredUrl | null> {
  const monitor = await findMonitorById(id);
  if (!monitor || !monitor.isActive) return null;
  return monitor;
}

export async function updateMonitorNextScan(id: string, nextScanAt: Date): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1UpdateMonitorNextScan(getD1Database(), id, nextScanAt);
    return;
  }
  const db = getPostgresDb();
  await db
    .update(monitoredUrlsTable)
    .set({ nextScanAt })
    .where(eq(monitoredUrlsTable.id, id));
}

export async function setMonitorActive(id: string, isActive: boolean): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1UpdateMonitorActive(getD1Database(), id, isActive);
    return;
  }
  const db = getPostgresDb();
  await db
    .update(monitoredUrlsTable)
    .set({ isActive })
    .where(eq(monitoredUrlsTable.id, id));
}

export async function insertMonitoringScan(
  input: Omit<MonitoringScan, "monitoredUrlId"> & { monitoredUrlId: string },
): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1InsertMonitoringScan(getD1Database(), input);
    return;
  }
  const db = getPostgresDb();
  await db.insert(monitoringScansTable).values(input);
}

export async function listMonitoringScans(monitoredUrlId: string): Promise<MonitoringScan[]> {
  if (resolveStorageBackend() === "d1") {
    return d1ListMonitoringScans(getD1Database(), monitoredUrlId);
  }
  const db = getPostgresDb();
  return db
    .select()
    .from(monitoringScansTable)
    .where(eq(monitoringScansTable.monitoredUrlId, monitoredUrlId))
    .orderBy(asc(monitoringScansTable.scannedAt));
}

export async function findLatestMonitoringScan(
  monitoredUrlId: string,
): Promise<MonitoringScan | null> {
  if (resolveStorageBackend() === "d1") {
    return d1FindLatestMonitoringScan(getD1Database(), monitoredUrlId);
  }
  const db = getPostgresDb();
  const rows = await db
    .select()
    .from(monitoringScansTable)
    .where(eq(monitoringScansTable.monitoredUrlId, monitoredUrlId))
    .orderBy(desc(monitoringScansTable.scannedAt))
    .limit(1);
  return rows[0] ?? null;
}
