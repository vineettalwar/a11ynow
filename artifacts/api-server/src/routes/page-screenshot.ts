import { Router, type IRouter } from "express";
import { chromium } from "playwright";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const dnsLookupAsync = promisify(dnsLookup);
const PRIVATE_IP_RE =
  /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;
const SCREENSHOT_TIMEOUT_MS = 20000;

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

router.get("/page-screenshot", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (typeof raw !== "string" || !raw) {
    res.status(400).json({ error: "missing_url", message: "A url query parameter is required." });
    return;
  }

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const validation = await validateUrl(normalized);
  if (!validation.ok) {
    res.status(400).json({ error: "invalid_url", message: validation.error });
    return;
  }

  const { url } = validation;

  const cached = cacheGet(url);
  if (cached) {
    req.log.info({ url }, "Serving cached page screenshot");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Screenshot-Cache", "hit");
    res.send(cached);
    return;
  }

  req.log.info({ url }, "Taking page screenshot");

  let browser: import("playwright").Browser | undefined;
  try {
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: "accessibility.now/1.0 Screenshot (+https://accessibility.now)",
    });

    await context.route("**", async (route) => {
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
      waitUntil: "networkidle",
      timeout: SCREENSHOT_TIMEOUT_MS,
    });

    const png = await page.screenshot({ type: "png", fullPage: true });
    await context.close();

    cacheSet(url, png);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Screenshot-Cache", "miss");
    res.send(png);
  } catch (err) {
    logger.warn({ err, url }, "Page screenshot failed");
    res.status(502).json({
      error: "screenshot_failed",
      message: "The page could not be captured. It may be unreachable, require authentication, or block automated browsers.",
    });
  } finally {
    await browser?.close().catch(() => {});
  }
});

export default router;
