import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export type ScanJobStatus = "pending" | "running" | "completed" | "failed";

export const scanJobsTable = pgTable("scan_jobs", {
  jobId: text("job_id").primaryKey(),
  auditId: text("audit_id").notNull(),
  url: text("url").notNull(),
  status: text("status").notNull().$type<ScanJobStatus>(),
  profile: text("profile").notNull().default("default"),
  multiViewport: boolean("multi_viewport").notNull().default(false),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
