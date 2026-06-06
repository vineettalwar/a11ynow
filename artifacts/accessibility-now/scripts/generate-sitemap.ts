#!/usr/bin/env tsx
/** Regenerate public/sitemap.xml from src/lib/seo-config.ts */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Dynamic import after path setup
const { SITE, sitemapPaths } = await import("../src/lib/seo-config.ts");

const paths = sitemapPaths();
const today = new Date().toISOString().slice(0, 10);

const priority = (path: string): string => {
  if (path === "/") return "1.0";
  if (path.startsWith("/tools") || path.startsWith("/services") || path === "/eaa") return "0.8";
  if (path.startsWith("/resources")) return "0.6";
  return "0.5";
};

const changefreq = (path: string): string => {
  if (path === "/" || path.startsWith("/tools") || path === "/resources/blog") return "weekly";
  if (path.startsWith("/legal")) return "yearly";
  return "monthly";
};

const body = paths
  .map(
    (p) =>
      `  <url><loc>${SITE.url}${p === "/" ? "/" : p}</loc><lastmod>${today}</lastmod><changefreq>${changefreq(p)}</changefreq><priority>${priority(p)}</priority></url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

writeFileSync(resolve(root, "public/sitemap.xml"), xml, "utf8");
console.log(`Wrote ${paths.length} URLs to public/sitemap.xml`);
