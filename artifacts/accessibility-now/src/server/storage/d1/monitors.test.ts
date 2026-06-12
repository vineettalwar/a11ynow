import assert from "node:assert/strict";
import test from "node:test";
import {
  d1FindMonitorByToken,
  d1InsertMonitor,
  d1UpdateMonitorActive,
} from "./d1/monitors";
import { d1InsertMonitoringScan, d1ListMonitoringScans } from "./d1/monitoring-scans";

type Row = Record<string, unknown>;

function createMockD1(): D1Database {
  const tables = new Map<string, Map<string, Row>>();

  function table(name: string): Map<string, Row> {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name)!;
  }

  return {
    prepare(sql: string) {
      const binds: unknown[] = [];
      return {
        bind(...values: unknown[]) {
          binds.push(...values);
          return this;
        },
        async first<T>() {
          if (sql.includes("FROM monitored_urls WHERE token = ?")) {
            const token = binds[0] as string;
            for (const row of table("monitored_urls").values()) {
              if (row.token === token) return row as T;
            }
            return null;
          }
          return null;
        },
        async all<T>() {
          if (sql.includes("FROM monitoring_scans WHERE monitored_url_id = ?")) {
            const monitoredUrlId = binds[0] as string;
            const rows = [...table("monitoring_scans").values()].filter(
              (r) => r.monitored_url_id === monitoredUrlId,
            );
            return { results: rows as T[] };
          }
          return { results: [] as T[] };
        },
        async run() {
          if (sql.startsWith("INSERT INTO monitored_urls")) {
            const [
              id,
              url,
              email,
              frequency,
              token,
              isActive,
              createdAt,
              nextScanAt,
            ] = binds;
            table("monitored_urls").set(id as string, {
              id,
              url,
              email,
              frequency,
              token,
              is_active: isActive,
              created_at: createdAt,
              next_scan_at: nextScanAt,
            });
          } else if (sql.startsWith("INSERT INTO monitoring_scans")) {
            const [id, monitoredUrlId] = binds;
            table("monitoring_scans").set(id as string, {
              id,
              monitored_url_id: monitoredUrlId,
              score: binds[2],
              level: binds[3],
              total_violations: binds[4],
              critical_violations: binds[5],
              serious_violations: binds[6],
              violations: binds[7],
              violations_ref: binds[8],
              passed_checks: binds[9],
              total_checks: binds[10],
              scanned_at: binds[11],
            });
          } else if (sql.includes("UPDATE monitored_urls SET is_active")) {
            const [isActive, id] = binds;
            const row = table("monitored_urls").get(id as string);
            if (row) row.is_active = isActive;
          }
          return { success: true };
        },
      };
    },
    batch() {
      throw new Error("not implemented");
    },
    exec() {
      throw new Error("not implemented");
    },
    dump() {
      throw new Error("not implemented");
    },
  } as D1Database;
}

test("D1 monitor helpers insert and find by token", async () => {
  const db = createMockD1();
  const now = new Date("2026-06-01T00:00:00.000Z");
  const token = "b".repeat(48);

  await d1InsertMonitor(db, {
    id: "mon-1",
    url: "https://example.com",
    email: "test@example.com",
    frequency: "weekly",
    token,
    createdAt: now,
    nextScanAt: now,
  });

  const found = await d1FindMonitorByToken(db, token);
  assert.ok(found);
  assert.equal(found.url, "https://example.com");
  assert.equal(found.isActive, true);
});

test("D1 monitoring scan helpers insert and list", async () => {
  const db = createMockD1();
  const scannedAt = new Date("2026-06-01T12:00:00.000Z");

  await d1InsertMonitoringScan(db, {
    id: "scan-1",
    monitoredUrlId: "mon-1",
    score: 85,
    level: "good",
    totalViolations: 2,
    criticalViolations: 0,
    seriousViolations: 1,
    violations: [],
    violationsRef: null,
    passedChecks: 40,
    totalChecks: 42,
    scannedAt,
  });

  const scans = await d1ListMonitoringScans(db, "mon-1");
  assert.equal(scans.length, 1);
  assert.equal(scans[0]?.score, 85);
});

test("D1 updateMonitorActive deactivates monitor", async () => {
  const db = createMockD1();
  const now = new Date();

  await d1InsertMonitor(db, {
    id: "mon-2",
    url: "https://example.org",
    email: "a@example.org",
    frequency: "monthly",
    token: "c".repeat(48),
    createdAt: now,
    nextScanAt: now,
  });

  await d1UpdateMonitorActive(db, "mon-2", false);
  const found = await d1FindMonitorByToken(db, "c".repeat(48));
  assert.equal(found?.isActive, false);
});
