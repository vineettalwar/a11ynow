import { Router, type IRouter } from "express";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { launchChromiumHeadless } from "../lib/playwright-chromium";
import { logger } from "../lib/logger";
import { captureFullPagePng, screenshotFriendlyContextOptions } from "../lib/playwright-screenshot";
import { gotoPageForCapture } from "../lib/playwright-nav";
import { normalizeHttpUrl, validatePublicUrl, PRIVATE_IP_RE } from "../lib/public-url";

const router: IRouter = Router();
const dnsLookupAsync = promisify(dnsLookup);
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

router.get("/page-screenshot", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (typeof raw !== "string" || !raw) {
    res.status(400).json({ error: "missing_url", message: "A url query parameter is required." });
    return;
  }

  const validation = await validatePublicUrl(normalizeHttpUrl(raw));
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
    browser = await launchChromiumHeadless();

    const context = await browser.newContext({
      ...screenshotFriendlyContextOptions({ width: 1280, height: 900 }),
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

    await gotoPageForCapture(page, url, SCREENSHOT_TIMEOUT_MS);

    const png = await captureFullPagePng(page, {
      screenshotTimeoutMs: SCREENSHOT_TIMEOUT_MS,
      logLabel: "page-screenshot",
    });
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
