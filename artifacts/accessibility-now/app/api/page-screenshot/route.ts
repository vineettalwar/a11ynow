import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { launchChromiumHeadless } from "@/server/playwright-chromium";
import { logger } from "@/server/logger";
import { captureFullPagePng, screenshotFriendlyContextOptions } from "@/server/playwright-screenshot";
import { jsonErr, prepareRequestDb } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { withScanSlot } from "@/server/scan-gate";

const dnsLookupAsync = promisify(dnsLookup);
const PRIVATE_IP_RE =
  /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;
const SCREENSHOT_TIMEOUT_MS = 12_000;

const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 50;

interface CacheEntry {
  png: Buffer;
  expiresAt: number;
}

const screenshotCache = new Map<string, CacheEntry>();

function cacheGet(url: string): Buffer | null {
  const entry = screenshotCache.get(url);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    screenshotCache.delete(url);
    return null;
  }
  return entry.png;
}

function cacheSet(url: string, png: Buffer): void {
  if (screenshotCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = screenshotCache.keys().next().value;
    if (oldest !== undefined) {
      screenshotCache.delete(oldest);
    }
  }
  screenshotCache.set(url, { png, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function validateUrl(
  raw: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (PRIVATE_IP_RE.test(hostname)) {
    return { ok: false, error: "Internal addresses are not allowed." };
  }
  try {
    const { address } = await dnsLookupAsync(hostname);
    if (PRIVATE_IP_RE.test(address)) {
      return { ok: false, error: "Internal addresses are not allowed." };
    }
  } catch {
    return { ok: false, error: "Could not resolve hostname." };
  }
  return { ok: true, url: parsed.href };
}

export async function GET(req: Request) {
  const limited = await enforceRateLimit(req, { namespace: "page-screenshot", limit: 20 });
  if (limited) return limited;

  prepareRequestDb();

  const raw = new URL(req.url).searchParams.get("url");
  if (typeof raw !== "string" || !raw) {
    return jsonErr(400, "missing_url", "A url query parameter is required.");
  }

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const validation = await validateUrl(normalized);
  if (!validation.ok) {
    return jsonErr(400, "invalid_url", validation.error);
  }

  const { url } = validation;

  const cached = cacheGet(url);
  if (cached) {
    logger.info({ url }, "Serving cached page screenshot");
    return new Response(new Uint8Array(cached), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Screenshot-Cache": "hit",
      },
    });
  }

  logger.info({ url }, "Taking page screenshot");

  try {
    const png = await withScanSlot(async () => {
      let browser: import("playwright").Browser | undefined;
      try {
        browser = await launchChromiumHeadless();

        const context = await browser.newContext({
          ...screenshotFriendlyContextOptions({ width: 1280, height: 900 }),
          userAgent: "accessibility.now/1.0 Screenshot (+https://accessibility.now)",
        });

        await context.route("**", async (route: import("playwright").Route) => {
          const reqUrl = route.request().url();
          let parsedReq: URL;
          try {
            parsedReq = new URL(reqUrl);
          } catch {
            await route.abort("addressunreachable");
            return;
          }
          const hostname = parsedReq.hostname.replace(/^\[|\]$/g, "");
          if (PRIVATE_IP_RE.test(hostname)) {
            await route.abort("addressunreachable");
            return;
          }
          try {
            const { address } = await dnsLookupAsync(hostname);
            if (PRIVATE_IP_RE.test(address)) {
              await route.abort("addressunreachable");
              return;
            }
          } catch {
            await route.abort("namenotresolved");
            return;
          }
          await route.continue();
        });

        const page = await context.newPage();

        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: SCREENSHOT_TIMEOUT_MS,
        });
        await page.waitForLoadState("load", { timeout: 3_000 }).catch(() => undefined);

        const captured = await captureFullPagePng(page, {
          screenshotTimeoutMs: SCREENSHOT_TIMEOUT_MS,
          logLabel: "page-screenshot",
        });
        await context.close();
        return captured;
      } finally {
        await browser?.close().catch(() => {});
      }
    });

    cacheSet(url, png);

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "X-Screenshot-Cache": "miss",
      },
    });
  } catch (err) {
    logger.warn({ err, url }, "Page screenshot failed");
    return jsonErr(
      502,
      "screenshot_failed",
      "The page could not be captured. It may be unreachable, require authentication, or block automated browsers.",
    );
  }
}
