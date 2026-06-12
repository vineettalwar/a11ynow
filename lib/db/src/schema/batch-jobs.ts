import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export type BatchJobStatus = "pending" | "running" | "completed" | "failed";

export interface BatchJobUrlState {
  url: string;
  status: "queued" | "scanning" | "done" | "error";
  score?: number;
  level?: string;
  auditId?: string;
  error?: string;
  pageScreenshot?: string;
}

export interface BatchJobResultStored {
  siteScore: number;
  siteLevel: string;
  scannedAt: string;
  pages: Array<Record<string, unknown>>;
  crossPageViolations: Array<Record<string, unknown>>;
}

export const batchJobsTable = pgTable("batch_jobs", {
  batchJobId: text("batch_job_id").primaryKey(),
  status: text("status").notNull().$type<BatchJobStatus>(),
  discoverySource: text("discovery_source"),
  scanProfile: text("scan_profile").notNull().default("default"),
  multiViewport: boolean("multi_viewport").notNull().default(false),
  urlsJson: jsonb("urls_json").notNull().$type<string[]>(),
  progressJson: jsonb("progress_json").notNull().$type<BatchJobUrlState[]>(),
  resultJson: jsonb("result_json").$type<BatchJobResultStored | null>(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
