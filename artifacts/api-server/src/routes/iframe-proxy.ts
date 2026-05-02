import { Router, type IRouter, type Request, type Response } from "express";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const dnsLookupAsync = promisify(dnsLookup);
const PRIVATE_IP_RE = /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

async function validateUrl(raw: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try { parsed = new URL(raw); } catch { return { ok: false, error: "Invalid URL." }; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (PRIVATE_IP_RE.test(hostname)) return { ok: false, error: "Internal addresses not allowed." };
  try {
    const { address } = await dnsLookupAsync(hostname);
    if (PRIVATE_IP_RE.test(address)) return { ok: false, error: "Internal addresses not allowed." };
  } catch { return { ok: false, error: "Could not resolve hostname." }; }
  return { ok: true, url: parsed.href };
}

async function fetchWithRedirects(startUrl: string): Promise<{ finalUrl: string; html: string }> {
  let currentUrl = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let fetched: Awaited<ReturnType<typeof fetch>>;
    try {
      fetched = await fetch(currentUrl, {
        redirect: "manual",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; accessibility.now/1.0; +https://accessibility.now)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (fetched.status >= 300 && fetched.status < 400) {
      const location = fetched.headers.get("location");
      if (!location) throw new Error("Redirect with no Location header.");
      const nextUrl = new URL(location, currentUrl).href;
      const validation = await validateUrl(nextUrl);
      if (!validation.ok) throw new Error(`Redirect to disallowed address: ${validation.error}`);
      currentUrl = validation.url;
      continue;
    }

    if (!fetched.ok) throw new Error(`HTTP ${fetched.status}`);

    const ct = fetched.headers.get("content-type") ?? "text/html";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      throw new Error("Remote resource is not HTML.");
    }

    const buf = await fetched.arrayBuffer();
    if (buf.byteLength > MAX_BODY_BYTES) throw new Error("Page too large.");
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    return { finalUrl: currentUrl, html };
  }
  throw new Error("Too many redirects.");
}

function rewriteHtml(html: string, baseUrl: string): string {
  const safeBase = baseUrl.replace(/"/g, "&quot;");
  const baseTag = `<base href="${safeBase}">`;

  return (
    html
      // 1. Strip all existing <base> tags first
      .replace(/<base\s[^>]*>/gi, "")
      // 2. Inject our single <base> immediately after <head>
      .replace(/<head(\s[^>]*)?>/i, (m) => `${m}\n${baseTag}`)
      // 3. Neutralise inline scripts to prevent XSS (inline event handlers
      //    are left in place; the sandbox removes same-origin privilege)
      .replace(/<script(\s[^>]*)?\s*>/gi, "<noscript data-blocked$1>")
      .replace(/<\/script>/gi, "</noscript>")
  );
}

const ERROR_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Load failed</title></head>
<body>
<script>
try { parent.postMessage({ type: '__a11y_proxy_error' }, '*'); } catch (_) {}
</script>
</body>
</html>`;

router.get("/iframe-proxy", async (req: Request, res: Response): Promise<void> => {
  const rawUrl = req.query["url"];
  if (typeof rawUrl !== "string" || !rawUrl) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(400).send(ERROR_HTML);
    return;
  }

  const validation = await validateUrl(rawUrl);
  if (!validation.ok) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(400).send(ERROR_HTML);
    return;
  }

  try {
    const { finalUrl, html } = await fetchWithRedirects(validation.url);
    const rewritten = rewriteHtml(html, finalUrl);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(rewritten);
  } catch (err) {
    logger.warn({ err, url: rawUrl }, "iframe-proxy fetch failed");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(502).send(ERROR_HTML);
  }
});

export default router;
