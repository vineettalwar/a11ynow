/**
 * Cloudflare Browser Rendering scan worker.
 * Runs Playwright + axe-core on Cloudflare's edge browser infrastructure.
 *
 * Deploy: pnpm --filter @workspace/scan-worker deploy
 * Set SCAN_WORKER_URL + SCAN_WORKER_TOKEN on the API server to delegate scans.
 */

import { launch, type BrowserWorker } from "@cloudflare/playwright";

export interface Env {
  BROWSER: BrowserWorker;
  SCAN_AUTH_TOKEN?: string;
}

interface ScanRequestBody {
  url: string;
  profile?: "default" | "strict";
  multiViewport?: boolean;
}

const AXE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js";

const AXE_TAGS_DEFAULT = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

const AXE_TAGS_STRICT = [...AXE_TAGS_DEFAULT, "wcag2aaa", "wcag21aaa"];

const VIEWPORTS = [
  { width: 390, height: 844, label: "Mobile" },
  { width: 1280, height: 720, label: "Desktop" },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/healthz") {
      return Response.json({ status: "ok", engine: "cloudflare-browser-rendering" });
    }

    if (request.method !== "POST" || url.pathname !== "/scan") {
      return new Response("Not Found", { status: 404 });
    }

    if (env.SCAN_AUTH_TOKEN) {
      const auth = request.headers.get("authorization");
      if (auth !== `Bearer ${env.SCAN_AUTH_TOKEN}`) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    let body: ScanRequestBody;
    try {
      body = (await request.json()) as ScanRequestBody;
    } catch {
      return Response.json({ error: "invalid_json" }, { status: 400 });
    }

    if (!body.url || typeof body.url !== "string") {
      return Response.json({ error: "url_required" }, { status: 400 });
    }

    const tags = body.profile === "strict" ? AXE_TAGS_STRICT : AXE_TAGS_DEFAULT;
    const viewports = body.multiViewport ? VIEWPORTS : [VIEWPORTS[1]!];

    try {
      const browser = await launch(env.BROWSER);
      const context = await browser.newContext({
        viewport: { width: viewports[0]!.width, height: viewports[0]!.height },
        userAgent: "accessibility.now/1.0 Cloudflare Scanner (+https://accessibility.now)",
      });

      try {
        const page = await context.newPage();
        const allViolations: unknown[] = [];
        let totalPasses = 0;

        for (const vp of viewports) {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          if (viewports.indexOf(vp) === 0) {
            await page.goto(body.url, { waitUntil: "networkidle", timeout: 45_000 });
          } else {
            await page.reload({ waitUntil: "networkidle", timeout: 45_000 });
          }

          await page.addScriptTag({ url: AXE_CDN });
          const axeResult = await page.evaluate(async (axeTags: string[]) => {
            const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<unknown> } }).axe;
            return axe.run(document, {
              runOnly: { type: "tag", values: axeTags },
              resultTypes: ["violations", "passes"],
            });
          }, tags);

          const result = axeResult as { violations: unknown[]; passes: unknown[] };
          allViolations.push(...result.violations);
          totalPasses = result.passes.length;
        }

        let pageScreenshot: string | undefined;
        try {
          const buf = await page.screenshot({ type: "jpeg", quality: 68 });
          pageScreenshot = `data:image/jpeg;base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
        } catch {
          pageScreenshot = undefined;
        }

        return Response.json({
          scanEngine: "cloudflare_playwright",
          violations: allViolations,
          passedChecks: totalPasses,
          totalChecks: allViolations.length + totalPasses,
          pageScreenshot,
          viewportsUsed: viewports,
        });
      } finally {
        await context.close().catch(() => {});
        await browser.close().catch(() => {});
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      return Response.json({ error: "scan_failed", message }, { status: 500 });
    }
  },
};

/** Durable Object placeholder for @cloudflare/playwright-mcp compatibility */
export class PlaywrightMCP {
  constructor(_state: DurableObjectState, _env: Env) {}
}
