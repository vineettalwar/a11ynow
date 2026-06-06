import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { launchChromiumHeadless, isChromiumReady } from "../lib/playwright-chromium";
import { gotoPageForCapture } from "../lib/playwright-nav";
import { normalizeHttpUrl, validatePublicUrl, PRIVATE_IP_RE } from "../lib/public-url";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import {
  extractItemsFromDocument,
  itemsLookSparse,
  screenReaderExtractScript,
  type ScreenReaderItem,
} from "../lib/screen-reader-extract";
import { screenshotFriendlyContextOptions } from "../lib/playwright-screenshot";

const router: IRouter = Router();
const dnsLookupAsync = promisify(dnsLookup);
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 15_000;
const PLAYWRIGHT_TIMEOUT_MS = 25_000;

async function fetchWithSsrfSafeRedirects(startUrl: string): Promise<Response> {
  let currentUrl = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let resp: Response;
    try {
      resp = await fetch(currentUrl, {
        redirect: "manual",
        headers: {
          "User-Agent": "accessibility.now/1.0 Screen Reader Preview (+https://accessibility.now)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get("location");
      if (!location) throw new Error("Redirect with no Location header.");
      const nextUrl = new URL(location, currentUrl).href;
      const validation = await validatePublicUrl(nextUrl);
      if (!validation.ok) throw new Error(`Redirect to disallowed address: ${validation.error}`);
      currentUrl = validation.url;
      continue;
    }

    return resp;
  }
  throw new Error("Too many redirects.");
}

async function extractViaPlaywright(url: string): Promise<ScreenReaderItem[] | null> {
  if (!isChromiumReady()) return null;

  let browser: import("playwright").Browser | undefined;
  try {
    browser = await launchChromiumHeadless();
    const context = await browser.newContext({
      ...screenshotFriendlyContextOptions({ width: 1280, height: 900 }),
      userAgent: "accessibility.now/1.0 Screen Reader Preview (+https://accessibility.now)",
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
    await gotoPageForCapture(page, url, PLAYWRIGHT_TIMEOUT_MS);
    const items = await page.evaluate(screenReaderExtractScript);
    await context.close();
    return items;
  } catch (err) {
    logger.warn({ err, url }, "Playwright screen reader preview failed");
    return null;
  } finally {
    await browser?.close().catch(() => {});
  }
}

async function extractViaFetch(url: string): Promise<ScreenReaderItem[]> {
  const response = await fetchWithSsrfSafeRedirects(url);
  if (!response.ok) {
    throw new Error(`The page returned HTTP ${response.status}.`);
  }
  const html = await response.text();
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: false });
  return extractItemsFromDocument(dom.window.document as unknown as Document);
}

router.get("/screen-reader-preview", async (req, res): Promise<void> => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!rawUrl) {
    res.status(400).json({ error: "missing_param", message: "url query parameter is required." });
    return;
  }

  const validation = await validatePublicUrl(normalizeHttpUrl(rawUrl));
  if (!validation.ok) {
    res.status(400).json({ error: "invalid_url", message: validation.error });
    return;
  }

  const { url } = validation;

  try {
    let items: ScreenReaderItem[] | null = null;
    let engine: "playwright" | "static" = "playwright";

    items = await extractViaPlaywright(url);

    if (!items || itemsLookSparse(items)) {
      try {
        const staticItems = await extractViaFetch(url);
        if (!items || staticItems.length > items.length) {
          items = staticItems;
          engine = "static";
        }
      } catch (fetchErr) {
        if (!items) throw fetchErr;
      }
    }

    if (!items) {
      res.status(502).json({
        error: "fetch_failed",
        message: "Could not fetch or render the page for screen reader preview.",
      });
      return;
    }

    logger.info({ url, itemCount: items.length, engine }, "Screen reader preview completed");
    res.json({ url, items, engine });
  } catch (err) {
    logger.error({ err, url }, "Screen reader preview failed");
    const message = err instanceof Error ? err.message : "Could not fetch or parse the page.";
    res.status(502).json({ error: "fetch_failed", message });
  }
});

export default router;
