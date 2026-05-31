import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auditsTable = pgTable("audits", {
  auditId: text("audit_id").primaryKey(),
  url: text("url").notNull(),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull(),
  score: integer("score").notNull(),
  level: text("level").notNull(),
  totalViolations: integer("total_violations").notNull(),
  criticalViolations: integer("critical_violations").notNull(),
  seriousViolations: integer("serious_violations").notNull(),
  violations: jsonb("violations").notNull().$type<AuditViolationStored[]>(),
  passedChecks: integer("passed_checks").notNull(),
  totalChecks: integer("total_checks").notNull(),
  /** playwright | static_fallback | unknown (legacy rows) */
  scanEngine: text("scan_engine").notNull().default("unknown"),
  /** Viewport JPEG as `data:image/jpeg;base64,...` when the Playwright engine captured it. */
  pageScreenshot: text("page_screenshot"),
  /** Engine options, runtime diagnostics, viewport list (Playwright); null for legacy rows. */
  scanMetadata: jsonb("scan_metadata").$type<StoredScanMetadata | null>(),
});

export interface AuditViolationInstanceStored {
  selector: string;
  htmlSnippet: string;
  failureSummary?: string;
  elementScreenshot?: string;
  checkDetails?: string[];
}

export interface AuditViolationStored {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
  topSelectors: string[];
  help?: string;
  helpUrl?: string;
  instanceDetails?: AuditViolationInstanceStored[];
  /** Labels when the same rule was merged across viewport runs. */
  detectedInViewports?: string[];
}

export interface StoredRuntimeDiagnostics {
  consoleErrors: Array<{ type: string; text: string }>;
  failedRequests?: Array<{ url: string; errorText?: string }>;
}

export interface StoredScanMetadata {
  profile: "default" | "strict";
  multiViewport: boolean;
  viewportsUsed: Array<{ width: number; height: number; label: string }>;
  runtimeDiagnostics?: StoredRuntimeDiagnostics;
  elementScreenshotsSkipped?: boolean;
  viewportsSkipped?: boolean;
}

export const insertAuditSchema = createInsertSchema(auditsTable);
export const selectAuditSchema = createSelectSchema(auditsTable);
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof auditsTable.$inferSelect;
