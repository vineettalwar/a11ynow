import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const monitoredUrlsTable = pgTable("monitored_urls", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  email: text("email").notNull(),
  frequency: text("frequency").notNull(),
  token: text("token").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  nextScanAt: timestamp("next_scan_at", { withTimezone: true }).notNull(),
});

export const insertMonitoredUrlSchema = createInsertSchema(monitoredUrlsTable);
export const selectMonitoredUrlSchema = createSelectSchema(monitoredUrlsTable);
export type InsertMonitoredUrl = z.infer<typeof insertMonitoredUrlSchema>;
export type MonitoredUrl = typeof monitoredUrlsTable.$inferSelect;
