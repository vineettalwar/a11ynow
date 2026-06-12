import { leadsTable, type AppDb } from "@workspace/db";
import type { LeadsRepository } from "./repository";
import type { LeadRecord } from "./types";

export class PostgresLeadsRepository implements LeadsRepository {
  constructor(private readonly db: AppDb) {}

  async create(record: LeadRecord): Promise<LeadRecord> {
    await this.db.insert(leadsTable).values({
      leadId: record.leadId,
      name: record.name,
      email: record.email,
      auditId: record.auditId,
      company: record.company,
      service: record.service,
      message: record.message,
      websiteUrl: record.websiteUrl,
      source: record.source,
      createdAt: new Date(record.createdAt),
    });

    return record;
  }
}
