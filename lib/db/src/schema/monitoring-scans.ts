import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { monitoredUrlsTable } from "./monitored-urls";

export const monitoringScansTable = pgTable("monitoring_scans", {
  id: text("id").primaryKey(),
  monitoredUrlId: text("monitored_url_id")
    .notNull()
    .references(() => monitoredUrlsTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  level: text("level").notNull(),
  totalViolations: integer("total_violations").notNull(),
  criticalViolations: integer("critical_violations").notNull(),
  seriousViolations: integer("serious_violations").notNull(),
  violations: jsonb("violations").notNull(),
  passedChecks: integer("passed_checks").notNull(),
  totalChecks: integer("total_checks").notNull(),
  scannedAt: timestamp("scanned_at", { withTimezone: true }).notNull(),
});

export const insertMonitoringScanSchema = createInsertSchema(monitoringScansTable);
export const selectMonitoringScanSchema = createSelectSchema(monitoringScansTable);
export type InsertMonitoringScan = z.infer<typeof insertMonitoringScanSchema>;
export type MonitoringScan = typeof monitoringScansTable.$inferSelect;
