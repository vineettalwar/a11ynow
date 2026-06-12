import { createDb, type AppDb } from "@workspace/db";
import { getBindings, getDatabaseUrl } from "../cloudflare";

export type StorageBackend = "d1" | "postgres";

export function resolveStorageBackend(): StorageBackend {
  const bindings = getBindings();
  // Local `pnpm dev` sets DATABASE_URL and migrates Postgres; OpenNext still exposes a
  // local D1 binding — prefer Postgres when a connection URL is configured.
  if (getDatabaseUrl()) {
    return "postgres";
  }
  return bindings.DB ? "d1" : "postgres";
}

export function getD1Database(): D1Database {
  const db = getBindings().DB;
  if (!db) {
    throw new Error("D1 is not configured for the current runtime.");
  }
  return db;
}

let cachedPostgres: AppDb | undefined;
let cachedPostgresUrl: string | undefined;

export function getPostgresDb(): AppDb {
  const url = getDatabaseUrl() ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL or Hyperdrive binding must be configured.");
  }
  if (!cachedPostgres || cachedPostgresUrl !== url) {
    cachedPostgresUrl = url;
    cachedPostgres = createDb(url);
  }
  return cachedPostgres;
}

export function getJobDb(): AppDb | D1Database {
  return resolveStorageBackend() === "d1" ? getD1Database() : getPostgresDb();
}
