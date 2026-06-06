import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  leadId: text("lead_id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  auditId: text("audit_id"),
  company: text("company"),
  service: text("service"),
  message: text("message"),
  websiteUrl: text("website_url"),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const insertLeadSchema = createInsertSchema(leadsTable);
export const selectLeadSchema = createSelectSchema(leadsTable);
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
