export interface CloudflareBindings {
  BROWSER?: Fetcher;
  HYPERDRIVE?: { connectionString: string };
  SCAN_GATE?: DurableObjectNamespace;
  SCAN_MAX_CONCURRENT?: string;
  DB?: D1Database;
  ARTIFACTS?: R2Bucket;
  SCAN_QUEUE?: Queue<import("./jobs/types").QueueMessage>;
  JOB_CACHE?: KVNamespace;
}

export function getBindings(): CloudflareBindings {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as typeof import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return env as CloudflareBindings;
  } catch {
    return {};
  }
}

export function getDatabaseUrl(): string | undefined {
  const bindings = getBindings();
  if (bindings.HYPERDRIVE?.connectionString) {
    return bindings.HYPERDRIVE.connectionString;
  }
  return process.env.DATABASE_URL;
}
