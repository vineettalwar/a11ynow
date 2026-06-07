import type { LeadRecord } from "./types";

export interface LeadsRepository {
  create(record: LeadRecord): Promise<LeadRecord>;
}
