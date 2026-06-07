import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";

export type AppDb = PostgresJsDatabase<typeof schema>;

let cached: AppDb | null = null;

/** Create a Drizzle client. Works with Hyperdrive and local Postgres via postgres.js. */
export function createDb(connectionString?: string): AppDb {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  const client = postgres(url, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(client, { schema });
}

/** Singleton DB for the current process / Worker isolate. */
export function getDb(): AppDb {
  if (!cached) {
    cached = createDb();
  }
  return cached;
}

/** @deprecated Use getDb() — kept for scripts that import `{ db }`. */
export const db = new Proxy({} as AppDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
