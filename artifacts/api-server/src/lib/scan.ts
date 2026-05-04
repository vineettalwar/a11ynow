import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { logger } from "./logger";

const dnsLookupAsync = promisify(dnsLookup);

export const PRIVATE_IP_RE =
  /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;

/** Hostnames that always resolve to loopback / local-only — block unless private scans are allowed. */
const PRIVATE_HOSTNAME_RE = /^(localhost|127\.0\.0\.1|::1|0\.0\.0\.0)$/i;

const AUDIT_TIMEOUT_MS = 45000;
const NETWORK_IDLE_AFTER_LOAD_MS = 8000;
const HYDRATION_SETTLE_MS = 800;
/** After scrolling the page to wake lazy content, pause before axe runs (bounded; keeps total scan under AUDIT_TIMEOUT_MS). */
const POST_SCROLL_SETTLE_MS = 400;
const SCROLL_STEP_PX = 420;
const SCROLL_STEP_DELAY_MS = 120;

/**
 * When true, localhost and RFC1918 targets can be scanned (Playwright SSRF route is disabled).
 * Default: any run where NODE_ENV is not "production". Override with SCAN_ALLOW_PRIVATE_URLS=0|1|false|true.
 */
export function scanAllowsPrivateTargets(): boolean {
  const v = process.env.SCAN_ALLOW_PRIVATE_URLS;
  if (v === "false" || v === "0") return false;
  if (v === "true" || v === "1") return true;
  return process.env.NODE_ENV !== "production";
}

export type ScanEngine = "playwright" | "static_fallback" | "unknown";

export interface AuditViolationInstance {
  selector: string;
  htmlSnippet: string;
  failureSummary?: string;
  /** JPEG data URL of the failing node's bounding box (Playwright scans only). */
  elementScreenshot?: string;
  /** Per-check messages from axe for this node (`any` / `all` / `none`). */
  checkDetails?: string[];
}

export interface AuditViolation {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
  topSelectors: string[];
  /** Short remediation hint from axe-core. */
  help?: string;
  /** Deque / axe rule documentation URL. */
  helpUrl?: string;
  instanceDetails?: AuditViolationInstance[];
}

export interface ScanResult {
  score: number;
  level: "critical" | "poor" | "moderate" | "good" | "excellent";
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  violations: AuditViolation[];
  passedChecks: number;
  totalChecks: number;
  scanEngine: ScanEngine;
  /** Viewport JPEG data URL taken after the axe run (Playwright only). */
  pageScreenshot?: string;
}

export function scoreToLevel(
  score: number,
): "critical" | "poor" | "moderate" | "good" | "excellent" {
  if (score < 20) return "critical";
  if (score < 40) return "poor";
  if (score < 60) return "moderate";
  if (score < 80) return "good";
  return "excellent";
}

function tagToWcagCriteria(tags: string[]): string {
  const wcagTag = tags.find((t) => /^wcag\d{3,}$/.test(t));
  if (wcagTag) {
    const digits = wcagTag.replace("wcag", "");
    const parts: string[] = [];
    if (digits.length >= 1) parts.push(digits[0]);
    if (digits.length >= 2) parts.push(digits[1]);
    if (digits.length >= 3) parts.push(digits.slice(2));
    return parts.join(".");
  }
  if (tags.includes("best-practice")) return "Best Practice";
  return "WCAG 2.1";
}

/** Same WCAG tag set for Playwright and static fallback so scores are comparable when both paths run. */
const AXE_WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
] as const;

function setSyntheticFailureMetrics(violationCount: number): { passedChecks: number; totalChecks: number } {
  const n = Math.max(1, violationCount);
  return { passedChecks: 0, totalChecks: n };
}

const HTML_SNIPPET_MAX = 520;
/** Bound total element JPEG captures so scans stay within timeout and response size stays reasonable. */
const MAX_ELEMENT_SCREENSHOTS = 18;
const PAGE_SCREENSHOT_JPEG_QUALITY = 68;
const ELEMENT_SCREENSHOT_JPEG_QUALITY = 70;

function flattenHtmlSnippet(html: string): string {
  return html.replace(/[\n\r\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

function truncateHtmlSnippet(html: string, maxLen = HTML_SNIPPET_MAX): string {
  const flat = flattenHtmlSnippet(html);
  if (flat.length <= maxLen) return flat;
  return `${flat.slice(0, maxLen)}…`;
}

function axeTargetToSelector(target: unknown): string {
  if (Array.isArray(target)) return target.join(" > ");
  return String(target ?? "");
}

type AxeNodeLike = {
  target?: unknown;
  html?: string;
  failureSummary?: string;
  any?: Array<{ message?: string }>;
  all?: Array<{ message?: string }>;
  none?: Array<{ message?: string }>;
};

function collectCheckMessages(node: AxeNodeLike): string[] {
  const out: string[] = [];
  for (const group of [node.any, node.all, node.none]) {
    if (!Array.isArray(group)) continue;
    for (const c of group) {
      const m = c && typeof c.message === "string" ? c.message.trim() : "";
      if (m) out.push(m);
    }
  }
  return out;
}

function mapInstanceDetails(nodes: AxeNodeLike[]): AuditViolationInstance[] {
  return nodes.slice(0, 3).map((n) => {
    const fs = typeof n.failureSummary === "string" ? n.failureSummary.trim() : "";
    const checkDetails = collectCheckMessages(n);
    return {
      selector: axeTargetToSelector(n.target),
      htmlSnippet: truncateHtmlSnippet(typeof n.html === "string" ? n.html : ""),
      ...(fs ? { failureSummary: fs } : {}),
      ...(checkDetails.length > 0 ? { checkDetails } : {}),
    };
  });
}

function axeTargetToPlaywrightSelector(target: unknown): string {
  if (Array.isArray(target) && target.length > 0) {
    return target
      .map((t) => String(t).trim())
      .filter(Boolean)
      .join(" >> ");
  }
  return String(target ?? "").trim();
}

async function tryElementScreenshot(
  page: import("playwright").Page,
  target: unknown,
): Promise<string | undefined> {
  const locatorStr = axeTargetToPlaywrightSelector(target);
  if (!locatorStr) return undefined;
  try {
    const loc = page.locator(locatorStr).first();
    await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => undefined);
    await loc.waitFor({ state: "visible", timeout: 1200 }).catch(() => undefined);
    const buf = await loc.screenshot({
      type: "jpeg",
      quality: ELEMENT_SCREENSHOT_JPEG_QUALITY,
    });
    if (!buf || buf.length < 320) return undefined;
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

async function attachElementScreenshots(
  page: import("playwright").Page,
  violations: AuditViolation[],
  axeViolations: Array<{ nodes?: AxeNodeLike[] }>,
): Promise<void> {
  const impactRank: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const order = violations
    .map((_, idx) => idx)
    .sort((a, b) => {
      const ra = impactRank[violations[a]!.impact] ?? 9;
      const rb = impactRank[violations[b]!.impact] ?? 9;
      return ra - rb || a - b;
    });

  let budget = MAX_ELEMENT_SCREENSHOTS;
  for (const idx of order) {
    if (budget <= 0) break;
    const v = violations[idx];
    const inst = v?.instanceDetails;
    const nodes = axeViolations[idx]?.nodes as AxeNodeLike[] | undefined;
    if (!v || !inst || !nodes?.length) continue;

    for (let j = 0; j < inst.length && budget > 0; j++) {
      const shot = await tryElementScreenshot(page, nodes[j]?.target);
      if (shot) {
        inst[j] = { ...inst[j]!, elementScreenshot: shot };
        budget--;
      }
    }
  }
}

/**
 * Scroll through the document so intersection observers and lazy-loaded regions mount
 * before axe analyzes. No-op safe if the page has little height.
 */
async function scrollDocumentForLazyContent(page: import("playwright").Page): Promise<void> {
  await page
    .evaluate(
      async ({ stepPx, stepDelayMs }: { stepPx: number; stepDelayMs: number }) => {
        const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
        const root = document.scrollingElement ?? document.documentElement;
        const maxY = Math.max(0, root.scrollHeight - window.innerHeight);
        for (let y = 0; y <= maxY; y += stepPx) {
          window.scrollTo({ top: y, left: 0, behavior: "instant" });
          await delay(stepDelayMs);
        }
        window.scrollTo({ top: root.scrollHeight, left: 0, behavior: "instant" });
        await delay(stepDelayMs);
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        await delay(stepDelayMs);
      },
      { stepPx: SCROLL_STEP_PX, stepDelayMs: SCROLL_STEP_DELAY_MS },
    )
    .catch(() => undefined);
}

async function runPlaywrightScan(
  url: string,
  browser: import("playwright").Browser,
  allowPrivateTargets: boolean,
): Promise<{
  violations: AuditViolation[];
  passedChecks: number;
  totalChecks: number;
  pageScreenshot?: string;
}> {
  const context = await browser.newContext({
    userAgent: "accessibility.now/1.0 Compliance Scanner (+https://accessibility.now)",
  });

  if (!allowPrivateTargets) {
    const dnsCache = new Map<string, string>();
    await context.route("**", async (route) => {
      const reqUrl = route.request().url();
      let parsedReq: URL;
      try {
        parsedReq = new URL(reqUrl);
      } catch {
        await route.abort("addressunreachable");
        return;
      }

      const scheme = parsedReq.protocol.replace(/:$/, "").toLowerCase();
      if (scheme === "data" || scheme === "blob" || scheme === "about") {
        await route.continue();
        return;
      }

      const hostname = parsedReq.hostname.replace(/^\[|\]$/g, "");
      if (!hostname) {
        await route.continue();
        return;
      }

      if (PRIVATE_IP_RE.test(hostname) || PRIVATE_HOSTNAME_RE.test(hostname)) {
        await route.abort("addressunreachable");
        return;
      }

      const key = hostname.toLowerCase();
      let address: string;
      const cached = dnsCache.get(key);
      if (cached !== undefined) {
        address = cached;
      } else {
        try {
          const { address: resolved } = await dnsLookupAsync(hostname);
          address = resolved;
          dnsCache.set(key, resolved);
        } catch {
          await route.abort("namenotresolved");
          return;
        }
      }

      if (PRIVATE_IP_RE.test(address)) {
        await route.abort("addressunreachable");
        return;
      }

      await route.continue();
    });
  }

  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load", timeout: AUDIT_TIMEOUT_MS });
  await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_AFTER_LOAD_MS }).catch(() => undefined);
  await new Promise<void>((r) => setTimeout(r, HYDRATION_SETTLE_MS));

  await scrollDocumentForLazyContent(page);
  await new Promise<void>((r) => setTimeout(r, POST_SCROLL_SETTLE_MS));

  const axeResults = await new AxeBuilder({ page })
    .withTags([...AXE_WCAG_TAGS])
    .options({
      iframes: true,
      resultTypes: ["violations", "passes"],
    })
    .analyze();

  const violations: AuditViolation[] = axeResults.violations.map((v) => {
    const nodes = v.nodes as AxeNodeLike[];
    const instanceDetails = nodes.length > 0 ? mapInstanceDetails(nodes) : undefined;
    const help = typeof v.help === "string" ? v.help.trim() : "";
    const helpUrl = typeof v.helpUrl === "string" ? v.helpUrl.trim() : "";
    return {
      id: v.id,
      wcagCriteria: tagToWcagCriteria(v.tags),
      description: v.description,
      impact: (v.impact as AuditViolation["impact"]) ?? "minor",
      affectedElements: v.nodes.length,
      topSelectors: nodes
        .slice(0, 3)
        .map((n) => (Array.isArray(n.target) ? n.target.join(" > ") : String(n.target))),
      ...(help ? { help } : {}),
      ...(helpUrl ? { helpUrl } : {}),
      ...(instanceDetails && instanceDetails.length > 0 ? { instanceDetails } : {}),
    };
  });

  await attachElementScreenshots(page, violations, axeResults.violations);

  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => undefined);
  await new Promise<void>((r) => setTimeout(r, 200));

  let pageScreenshot: string | undefined;
  try {
    const buf = await page.screenshot({
      type: "jpeg",
      quality: PAGE_SCREENSHOT_JPEG_QUALITY,
      fullPage: false,
    });
    pageScreenshot = `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    pageScreenshot = undefined;
  }

  const passedChecks = axeResults.passes.length;
  const totalChecks = axeResults.violations.length + axeResults.passes.length;

  await context.close();
  return { violations, passedChecks, totalChecks, pageScreenshot };
}

export async function runAccessibilityScan(url: string): Promise<ScanResult> {
  const allowPrivateTargets = scanAllowsPrivateTargets();
  let violations: AuditViolation[] = [];
  let passedChecks = 0;
  let totalChecks = 0;
  let playwrightSucceeded = false;
  let pageScreenshot: string | undefined;

  let browser: import("playwright").Browser | undefined;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error(`Audit timed out after ${AUDIT_TIMEOUT_MS / 1000}s`)),
        AUDIT_TIMEOUT_MS + 8000,
      );
    });

    const result = await Promise.race([
      runPlaywrightScan(url, browser, allowPrivateTargets),
      timeoutPromise,
    ]);
    violations = result.violations;
    passedChecks = result.passedChecks;
    totalChecks = result.totalChecks;
    playwrightSucceeded = true;
    pageScreenshot = result.pageScreenshot;
  } catch (err) {
    logger.warn({ err, url }, "Playwright audit failed, falling back to fetch-based scan");
  } finally {
    clearTimeout(timeoutHandle);
    await browser?.close().catch(() => {});
  }

  const scanEngine: ScanEngine = playwrightSucceeded ? "playwright" : "static_fallback";

  if (!playwrightSucceeded) {
    const revalidation = await validateScanUrl(url, allowPrivateTargets);
    if (!revalidation.ok) {
      logger.warn({ url, reason: revalidation.error }, "SSRF re-validation failed in fallback scan path");
      violations = [
        {
          id: "page-unreachable",
          wcagCriteria: "Scan Limitation",
          description: "The page could not be analyzed for security reasons.",
          impact: "moderate",
          affectedElements: 1,
          topSelectors: [],
        },
      ];
      const m = setSyntheticFailureMetrics(violations.length);
      passedChecks = m.passedChecks;
      totalChecks = m.totalChecks;
    } else {
      try {
        const response = await fetch(url, {
          redirect: "follow",
          headers: {
            "User-Agent": "accessibility.now/1.0 Compliance Scanner (+https://accessibility.now)",
            Accept: "text/html,application/xhtml+xml",
          },
          signal: AbortSignal.timeout(20000),
        });

        if (response.ok) {
          // Fetch + JSDOM cannot scroll or execute page scripts; lazy or viewport-gated content is not exercised like Playwright.
          const { JSDOM } = await import("jsdom");
          const axe = (await import("axe-core")).default;
          const html = await response.text();
          const dom = new JSDOM(html, {
            url,
            runScripts: "outside-only",
            pretendToBeVisual: true,
          });
          const doc = dom.window.document as unknown as Document;
          axe.setup(doc);
          const axeResults = await axe.run(doc, {
            runOnly: {
              type: "tag",
              values: [...AXE_WCAG_TAGS],
            },
            resultTypes: ["violations", "passes"],
          });
          axe.teardown();

          totalChecks = axeResults.violations.length + axeResults.passes.length;
          passedChecks = axeResults.passes.length;
          violations = axeResults.violations.map((v) => {
            const nodes = v.nodes as AxeNodeLike[];
            const instanceDetails = nodes.length > 0 ? mapInstanceDetails(nodes) : undefined;
            const help = typeof v.help === "string" ? v.help.trim() : "";
            const helpUrl = typeof v.helpUrl === "string" ? v.helpUrl.trim() : "";
            return {
              id: v.id,
              wcagCriteria: tagToWcagCriteria(v.tags),
              description: v.description,
              impact: (v.impact as AuditViolation["impact"]) ?? "minor",
              affectedElements: v.nodes.length,
              topSelectors: nodes
                .slice(0, 3)
                .map((n) => (Array.isArray(n.target) ? n.target.join(" > ") : String(n.target))),
              ...(help ? { help } : {}),
              ...(helpUrl ? { helpUrl } : {}),
              ...(instanceDetails && instanceDetails.length > 0 ? { instanceDetails } : {}),
            };
          });
        } else {
          violations = [
            {
              id: "page-unreachable",
              wcagCriteria: "Scan Limitation",
              description:
                "The page could not be fetched for automated analysis. It may require authentication or block automated scanners.",
              impact: "moderate",
              affectedElements: 1,
              topSelectors: [],
            },
          ];
          const m = setSyntheticFailureMetrics(violations.length);
          passedChecks = m.passedChecks;
          totalChecks = m.totalChecks;
        }
      } catch (fetchErr) {
        logger.warn({ fetchErr, url }, "Fallback fetch-based scan also failed");
        violations = [
          {
            id: "page-unreachable",
            wcagCriteria: "Scan Limitation",
            description:
              "The page could not be analyzed. It may be unreachable, require authentication, or block automated scanners.",
            impact: "moderate",
            affectedElements: 1,
            topSelectors: [],
          },
        ];
        const m = setSyntheticFailureMetrics(violations.length);
        passedChecks = m.passedChecks;
        totalChecks = m.totalChecks;
      }
    }
  }

  const criticalViolations = violations.filter((v) => v.impact === "critical").length;
  const seriousViolations = violations.filter((v) => v.impact === "serious").length;
  const totalViolations = violations.length;

  const impactWeights: Record<string, number> = { critical: 15, serious: 10, moderate: 5, minor: 2 };
  let deductions = 0;
  for (const v of violations) {
    deductions += (impactWeights[v.impact] ?? 2) * Math.min(v.affectedElements, 3);
  }
  const score = Math.max(0, Math.min(100, Math.round(100 - deductions)));

  return {
    score,
    level: scoreToLevel(score),
    totalViolations,
    criticalViolations,
    seriousViolations,
    violations,
    passedChecks,
    totalChecks,
    scanEngine,
    ...(pageScreenshot && pageScreenshot.length > 0 ? { pageScreenshot } : {}),
  };
}

export async function validateScanUrl(
  raw: string,
  allowPrivateTargets: boolean = scanAllowsPrivateTargets(),
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "The provided URL is not valid." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (!allowPrivateTargets) {
    if (PRIVATE_IP_RE.test(hostname) || PRIVATE_HOSTNAME_RE.test(hostname)) {
      return { ok: false, error: "Scanning internal addresses is not allowed." };
    }
    try {
      const { address } = await dnsLookupAsync(hostname);
      if (PRIVATE_IP_RE.test(address)) {
        return { ok: false, error: "Scanning internal addresses is not allowed." };
      }
    } catch {
      return { ok: false, error: "Could not resolve the hostname." };
    }
  }
  return { ok: true, url: parsed.href };
}
