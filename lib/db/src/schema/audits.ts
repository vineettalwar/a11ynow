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
  violations: jsonb("violations").notNull().$type<AuditViolation[]>(),
  passedChecks: integer("passed_checks").notNull(),
  totalChecks: integer("total_checks").notNull(),
});

export interface AuditViolation {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
}

export const insertAuditSchema = createInsertSchema(auditsTable);
export const selectAuditSchema = createSelectSchema(auditsTable);
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof auditsTable.$inferSelect;
