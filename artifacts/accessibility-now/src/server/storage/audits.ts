import { eq, inArray } from "drizzle-orm";
import {
  auditsTable,
  type Audit,
  type AuditViolationStored,
  type StoredScanMetadata,
} from "@workspace/db";
import { getD1Database, getPostgresDb, resolveStorageBackend } from "./backend";
import {
  d1FindAuditById,
  d1FindAuditsByIds,
  d1InsertPendingAudit,
  d1MarkAuditFailed,
  d1UpdateAuditAfterScan,
} from "./d1/audits";

export async function findAuditById(auditId: string): Promise<Audit | null> {
  if (resolveStorageBackend() === "d1") {
    return d1FindAuditById(getD1Database(), auditId);
  }
  const db = getPostgresDb();
  const rows = await db
    .select()
    .from(auditsTable)
    .where(eq(auditsTable.auditId, auditId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findAuditsByIds(auditIds: string[]): Promise<Audit[]> {
  if (auditIds.length === 0) return [];
  if (resolveStorageBackend() === "d1") {
    return d1FindAuditsByIds(getD1Database(), auditIds);
  }
  const db = getPostgresDb();
  return db.select().from(auditsTable).where(inArray(auditsTable.auditId, auditIds));
}

export async function insertPendingAudit(input: {
  auditId: string;
  url: string;
  scannedAt: Date;
  scanMetadata: StoredScanMetadata;
}): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1InsertPendingAudit(getD1Database(), input);
    return;
  }
  const db = getPostgresDb();
  await db.insert(auditsTable).values({
    auditId: input.auditId,
    url: input.url,
    scannedAt: input.scannedAt,
    score: 0,
    level: "moderate",
    totalViolations: 0,
    criticalViolations: 0,
    seriousViolations: 0,
    violations: [],
    passedChecks: 0,
    totalChecks: 0,
    scanEngine: "unknown",
    pageScreenshot: null,
    scanMetadata: input.scanMetadata,
  });
}

export async function updateAuditAfterScan(
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
  if (resolveStorageBackend() === "d1") {
    await d1UpdateAuditAfterScan(getD1Database(), auditId, update);
    return;
  }
  const db = getPostgresDb();
  await db
    .update(auditsTable)
    .set({
      url: update.url,
      score: update.score,
      level: update.level,
      totalViolations: update.totalViolations,
      criticalViolations: update.criticalViolations,
      seriousViolations: update.seriousViolations,
      violations: update.violations,
      violationsRef: update.violationsRef,
      passedChecks: update.passedChecks,
      totalChecks: update.totalChecks,
      scanEngine: update.scanEngine,
      pageScreenshot: update.pageScreenshot,
      scanMetadata: update.scanMetadata,
    })
    .where(eq(auditsTable.auditId, auditId));
}

export async function markAuditFailed(
  auditId: string,
  scanMetadata: StoredScanMetadata,
): Promise<void> {
  if (resolveStorageBackend() === "d1") {
    await d1MarkAuditFailed(getD1Database(), auditId, scanMetadata);
    return;
  }
  const db = getPostgresDb();
  await db
    .update(auditsTable)
    .set({ scanMetadata })
    .where(eq(auditsTable.auditId, auditId));
}
