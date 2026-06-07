import type { LeadRecord } from "./types";
import type { LeadsRepository } from "./repository";

export class D1LeadsRepository implements LeadsRepository {
  constructor(private readonly db: D1Database) {}

  async create(record: LeadRecord): Promise<LeadRecord> {
    await this.db
      .prepare(
        `INSERT INTO leads (
          lead_id,
          name,
          email,
          audit_id,
          company,
          service,
          message,
          website_url,
          source,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        record.leadId,
        record.name,
        record.email,
        record.auditId,
        record.company,
        record.service,
        record.message,
        record.websiteUrl,
        record.source,
        record.createdAt,
      )
      .run();

    return record;
  }
}
