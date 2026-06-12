import { requestDb } from "../http";
import { getD1Database, resolveStorageBackend } from "../storage/backend";
import { D1LeadsRepository } from "./d1-leads-repository";
import { PostgresLeadsRepository } from "./postgres-leads-repository";
import type { LeadsRepository } from "./repository";

export function getLeadsRepository(): LeadsRepository {
  if (resolveStorageBackend() === "d1") {
    return new D1LeadsRepository(getD1Database());
  }
  return new PostgresLeadsRepository(requestDb());
}
