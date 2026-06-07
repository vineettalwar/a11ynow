/**
 * Discover same-origin URLs for whole-site scanning.
 * Tries sitemap.xml first, then homepage link extraction.
 */

import { validateScanUrl } from "./scan";

const DEFAULT_MAX_PAGES = 10;
const SITEMAP_FETCH_TIMEOUT_MS = 15_000;
const HOMEPAGE_FETCH_TIMEOUT_MS = 20_000;

const SCAN_FETCH_USER_AGENT =
  "accessibility.now/1.0 Site Discovery (+https://accessibility.now)" as const;

export interface DiscoverSiteUrlsOptions {
  maxPages?: number;
  allowPrivateTargets?: boolean;
}

export async function discoverSiteUrls(
  startUrl: string,
  options?: DiscoverSiteUrlsOptions,
): Promise<{ urls: string[]; source: "sitemap" | "links" | "single" }> {
  const maxPages = Math.min(Math.max(1, options?.maxPages ?? DEFAULT_MAX_PAGES), 10);
  const allowPrivate = options?.allowPrivateTargets ?? false;

  const validation = await validateScanUrl(startUrl, allowPrivate);
  if (!validation.ok) {
    return { urls: [startUrl], source: "single" };
  }

  const origin = new URL(validation.url).origin;
  const seen = new Set<string>();
  const result: string[] = [];

  const addUrl = (raw: string) => {
    if (result.length >= maxPages) return;
    try {
      const u = new URL(raw, origin);
      if (u.origin !== origin) return;
      u.hash = "";
      const href = u.href;
      if (seen.has(href)) return;
      seen.add(href);
      result.push(href);
    } catch {
      /* skip invalid */
    }
  };

  addUrl(validation.url);

  const sitemapUrls = await trySitemap(origin, validation.url, maxPages);
  if (sitemapUrls.length > 0) {
    for (const u of sitemapUrls) {
      addUrl(u);
      if (result.length >= maxPages) break;
    }
    if (result.length > 0) {
      return { urls: result.slice(0, maxPages), source: "sitemap" };
    }
  }

  const linkUrls = await tryHomepageLinks(validation.url, maxPages);
  for (const u of linkUrls) {
    addUrl(u);
    if (result.length >= maxPages) break;
  }

  return {
    urls: result.length > 0 ? result.slice(0, maxPages) : [validation.url],
    source: result.length > 1 ? "links" : "single",
  };
}

async function trySitemap(origin: string, startUrl: string, maxPages: number): Promise<string[]> {
  const candidates = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
    `${origin}/wp-sitemap.xml`,
  ];

  for (const sitemapUrl of candidates) {
    try {
      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": SCAN_FETCH_USER_AGENT, Accept: "application/xml,text/xml,*/*" },
        signal: AbortSignal.timeout(SITEMAP_FETCH_TIMEOUT_MS),
        redirect: "follow",
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]!.trim());
      if (locs.length === 0) continue;

      const startOrigin = new URL(startUrl).origin;
      const filtered = locs.filter((u) => {
        try {
          return new URL(u).origin === startOrigin;
        } catch {
          return false;
        }
      });

      const prioritized = [
        startUrl,
        ...filtered.filter((u) => u !== startUrl && /\/$/.test(new URL(u).pathname)),
        ...filtered.filter((u) => u !== startUrl && !/\/$/.test(new URL(u).pathname)),
      ];

      return [...new Set(prioritized)].slice(0, maxPages);
    } catch {
      continue;
    }
  }
  return [];
}

async function tryHomepageLinks(pageUrl: string, maxPages: number): Promise<string[]> {
  try {
    const res = await fetch(pageUrl, {
      headers: { "User-Agent": SCAN_FETCH_USER_AGENT, Accept: "text/html" },
      signal: AbortSignal.timeout(HOMEPAGE_FETCH_TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return [];
    const html = await res.text();
    const origin = new URL(pageUrl).origin;
    const hrefs = [...html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)].map((m) => m[1]!.trim());

    const scored: Array<{ url: string; score: number }> = [];
    for (const href of hrefs) {
      try {
        const u = new URL(href, pageUrl);
        if (u.origin !== origin) continue;
        if (/\.(pdf|zip|jpg|jpeg|png|gif|svg|webp|mp4|mp3|doc|docx|xls|xlsx)(\?|$)/i.test(u.pathname)) {
          continue;
        }
        u.hash = "";
        const path = u.pathname.toLowerCase();
        let score = 0;
        if (path === "/" || path === "") score += 10;
        if (/\/(about|contact|kontakt|impressum|datenschutz|privacy|accessibility|barrierefreiheit|services|leistungen|products|shop)/i.test(path)) {
          score += 5;
        }
        if (path.split("/").filter(Boolean).length <= 2) score += 2;
        scored.push({ url: u.href, score });
      } catch {
        continue;
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const { url } of scored) {
      if (seen.has(url)) continue;
      seen.add(url);
      unique.push(url);
      if (unique.length >= maxPages - 1) break;
    }
    return unique;
  } catch {
    return [];
  }
}
