import { getBindings } from "./cloudflare";

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 20;

type Bucket = { count: number; resetAt: number };
const localBuckets = new Map<string, Bucket>();

function clientKey(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function checkKvLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / WINDOW_MS)}`;
  const current = Number((await kv.get(windowKey)) ?? "0");
  if (current >= limit) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now % WINDOW_MS)) / 1000);
    return { allowed: false, retryAfterSec };
  }
  await kv.put(windowKey, String(current + 1), { expirationTtl: 120 });
  return { allowed: true, retryAfterSec: 0 };
}

function checkLocalLimit(key: string, limit: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = localBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    localBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export async function enforceRateLimit(
  req: Request,
  options?: { limit?: number; namespace?: string },
): Promise<Response | null> {
  const limit = options?.limit ?? DEFAULT_LIMIT;
  const key = `${options?.namespace ?? "default"}:${clientKey(req)}`;
  const bindings = getBindings();

  const result = bindings.JOB_CACHE
    ? await checkKvLimit(bindings.JOB_CACHE, key, limit)
    : checkLocalLimit(key, limit);

  if (result.allowed) {
    return null;
  }

  return new Response(
    JSON.stringify({
      error: "rate_limited",
      message: "Too many requests. Please wait and try again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec),
      },
    },
  );
}
