import { createDb } from "@workspace/db";
import { getDatabaseUrl } from "./cloudflare";

let cachedUrl: string | undefined;
let cachedDb: ReturnType<typeof createDb> | undefined;

export function getRequestDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL or Hyperdrive binding must be configured.");
  }
  if (!cachedDb || cachedUrl !== url) {
    cachedUrl = url;
    cachedDb = createDb(url);
  }
  return cachedDb;
}
