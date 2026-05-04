import AxeBuilder from "@axe-core/playwright";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { logger } from "./logger";
import { launchChromiumHeadless } from "./playwright-chromium";
import { screenshotFriendlyContextOptions, stablePlaywrightScreenshotProps } from "./playwright-screenshot";

const dnsLookupAsync = promisify(dnsLookup);

/** Follow HTTP redirects with per-hop SSRF checks before Playwright / fetch scan (apex → www, trailing paths, etc.). */
const MAX_SCAN_REDIRECT_HOPS = 15;
const REDIRECT_RESOLVE_FETCH_TIMEOUT_MS = 20000;

const SCAN_FETCH_USER_AGENT =
  "accessibility.now/1.0 Compliance Scanner (+https://accessibility.now)" as const;

async function cancelFetchBody(res: Response): Promise<void> {
  try {
    await res.body?.cancel();
  } catch {
    /* ignore */
  }
}

/**
 * Resolves the URL Playwright should open: follows 3xx Location chain in-process so each hop
 * passes {@link validateScanUrl}. Falls back to `startUrl` if resolution fails (HEAD blocked, etc.).
 */
async function resolveScanNavigationUrl(
  startUrl: string,
  allowPrivateTargets: boolean,
): Promise<string> {
  let current = startUrl;

  for (let hop = 0; hop <= MAX_SCAN_REDIRECT_HOPS; hop++) {
    const validated = await validateScanUrl(current, allowPrivateTargets);
    if (!validated.ok) {
      logger.warn(
        { url: current, reason: validated.error, startUrl },
        "Scan redirect resolution stopped: URL failed validation",
      );
      return startUrl;
    }
    current = validated.url;

    const runFetch = async (method: "HEAD" | "GET"): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REDIRECT_RESOLVE_FETCH_TIMEOUT_MS);
      try {
        return await fetch(current, {
          method,
          redirect: "manual",
          headers: {
            "User-Agent": SCAN_FETCH_USER_AGENT,
            Accept: "text/html,application/xhtml+xml,application/json;q=0.1",
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    };

    let resp: Response;
    try {
      resp = await runFetch("HEAD");
    } catch (err) {
      logger.warn({ err, current, startUrl }, "Scan redirect resolution: HEAD failed, using start URL");
      return startUrl;
    }

    if (resp.status === 403 || resp.status === 405 || resp.status === 501) {
      await cancelFetchBody(resp);
      try {
        resp = await runFetch("GET");
      } catch (err) {
        logger.warn({ err, current, startUrl }, "Scan redirect resolution: GET failed, using start URL");
        return startUrl;
      }
    }

    if (resp.status >= 300 && resp.status < 400) {
      await cancelFetchBody(resp);
      const location = resp.headers.get("location");
      if (!location) {
        logger.warn({ current, status: resp.status }, "Scan redirect resolution: missing Location header");
        return startUrl;
      }
      const nextRaw = new URL(location, current).href;
      const nextVal = await validateScanUrl(nextRaw, allowPrivateTargets);
      if (!nextVal.ok) {
        logger.warn(
          { nextUrl: nextRaw, reason: nextVal.error, startUrl },
          "Scan redirect resolution: redirect target failed validation",
        );
        return startUrl;
      }
      current = nextVal.url;
      continue;
    }

    await cancelFetchBody(resp);
    return current;
  }

  logger.warn({ startUrl }, "Scan redirect resolution: too many redirects");
  return startUrl;
}

export const PRIVATE_IP_RE =
  /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;

/** Hostnames that always resolve to loopback / local-only: block unless private scans are allowed. */
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
  /** When merged across viewport runs, which breakpoints reported this rule. */
  detectedInViewports?: string[];
}

export type ScanProfile = "default" | "strict";

export interface ScanViewport {
  width: number;
  height: number;
  label: string;
}

export interface RuntimeDiagnostics {
  consoleErrors: Array<{ type: string; text: string }>;
  failedRequests?: Array<{ url: string; errorText?: string }>;
}

export interface ScanMetadata {
  profile: ScanProfile;
  multiViewport: boolean;
  viewportsUsed: ScanViewport[];
  runtimeDiagnostics?: RuntimeDiagnostics;
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
  /** Present for Playwright scans when diagnostics or multi-viewport ran. */
  scanMetadata?: ScanMetadata;
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
const AXE_WCAG_TAGS_DEFAULT = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
] as const;

/** Stricter automated pass (AAA-oriented tags where axe supports them). */
const AXE_WCAG_TAGS_STRICT = [...AXE_WCAG_TAGS_DEFAULT, "wcag2aaa", "wcag21aaa"] as const;

const DEFAULT_VIEWPORT_DESKTOP: ScanViewport = { width: 1280, height: 720, label: "Desktop" };
const MULTI_VIEWPORTS: readonly ScanViewport[] = [
  { width: 390, height: 844, label: "Mobile" },
  DEFAULT_VIEWPORT_DESKTOP,
];

const MAX_CONSOLE_ERRORS = 28;
const MAX_CONSOLE_TEXT_LEN = 420;
const MAX_FAILED_REQUESTS = 16;
const MAX_FAILED_URL_LEN = 280;

function axeTagsForProfile(profile: ScanProfile): readonly string[] {
  return profile === "strict" ? AXE_WCAG_TAGS_STRICT : AXE_WCAG_TAGS_DEFAULT;
}

function violationMergeKey(v: Pick<AuditViolation, "id" | "topSelectors">): string {
  const sel = (v.topSelectors[0] ?? "").trim();
  return `${v.id}::${sel}`;
}

function mergeViolationsAcrossViewports(
  runs: Array<{ label: string; violations: AuditViolation[] }>,
): AuditViolation[] {
  const map = new Map<string, AuditViolation>();
  const impactRank: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

  for (const { label, violations } of runs) {
    for (const v of violations) {
      const k = violationMergeKey(v);
      const existing = map.get(k);
      if (!existing) {
        map.set(k, { ...v, detectedInViewports: [label] });
        continue;
      }
      const vp = new Set([...(existing.detectedInViewports ?? []), label]);
      existing.detectedInViewports = [...vp];
      existing.affectedElements = Math.max(existing.affectedElements, v.affectedElements);
      if ((impactRank[v.impact] ?? 9) < (impactRank[existing.impact] ?? 9)) {
        existing.impact = v.impact;
      }
      if ((v.instanceDetails?.length ?? 0) > (existing.instanceDetails?.length ?? 0)) {
        existing.instanceDetails = v.instanceDetails;
        existing.topSelectors = v.topSelectors;
      }
      if (!existing.help && v.help) existing.help = v.help;
      if (!existing.helpUrl && v.helpUrl) existing.helpUrl = v.helpUrl;
      if (existing.description.length < v.description.length) existing.description = v.description;
    }
  }
  return [...map.values()];
}

async function attachElementScreenshotsMerged(
  page: import("playwright").Page,
  merged: AuditViolation[],
  lastAxeViolations: Array<{ id?: string; nodes?: AxeNodeLike[] }>,
): Promise<void> {
  const byRuleId = new Map<string, AxeNodeLike[]>();
  for (const av of lastAxeViolations) {
    const id = typeof av.id === "string" ? av.id : "";
    if (!id) continue;
    const nodes = av.nodes as AxeNodeLike[] | undefined;
    if (!nodes?.length) continue;
    if (!byRuleId.has(id)) byRuleId.set(id, nodes);
  }

  const impactRank: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const sorted = [...merged].sort((a, b) => {
    const ra = impactRank[a.impact] ?? 9;
    const rb = impactRank[b.impact] ?? 9;
    return ra - rb;
  });

  let budget = MAX_ELEMENT_SCREENSHOTS;
  for (const mv of sorted) {
    if (budget <= 0) break;
    const nodes = byRuleId.get(mv.id);
    if (!nodes?.length || !mv.instanceDetails?.length) continue;
    for (let j = 0; j < mv.instanceDetails.length && budget > 0; j++) {
      const target = nodes[j]?.target ?? nodes[0]?.target;
      const shot = await tryElementScreenshot(page, target);
      if (shot) {
        mv.instanceDetails[j] = { ...mv.instanceDetails[j]!, elementScreenshot: shot };
        budget--;
      }
    }
  }
}

function capDiagText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

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
      ...stablePlaywrightScreenshotProps,
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

interface PlaywrightScanEngineOpts {
  profile: ScanProfile;
  viewports: ScanViewport[];
  collectRuntimeDiagnostics: boolean;
}

function mapAxeToViolations(
  axeViolations: Array<{
    id: string;
    tags: string[];
    description: string;
    impact?: string | null;
    nodes: AxeNodeLike[];
    help?: string;
    helpUrl?: string;
  }>,
): AuditViolation[] {
  return axeViolations.map((v) => {
    const nodes = (v.nodes ?? []) as AxeNodeLike[];
    const instanceDetails = nodes.length > 0 ? mapInstanceDetails(nodes) : undefined;
    const help = typeof v.help === "string" ? v.help.trim() : "";
    const helpUrl = typeof v.helpUrl === "string" ? v.helpUrl.trim() : "";
    const tags = Array.isArray(v.tags) ? v.tags : [];
    return {
      id: v.id,
      wcagCriteria: tagToWcagCriteria(tags),
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
}

async function runPlaywrightScan(
  url: string,
  browser: import("playwright").Browser,
  allowPrivateTargets: boolean,
  engineOpts: PlaywrightScanEngineOpts,
): Promise<{
  violations: AuditViolation[];
  passedChecks: number;
  totalChecks: number;
  pageScreenshot?: string;
  runtimeDiagnostics?: RuntimeDiagnostics;
}> {
  const tags = [...axeTagsForProfile(engineOpts.profile)];
  const multiVp = engineOpts.viewports.length > 1;
  const firstVp = engineOpts.viewports[0]!;

  const context = await browser.newContext({
    ...screenshotFriendlyContextOptions({ width: firstVp.width, height: firstVp.height }),
    userAgent: "accessibility.now/1.0 Compliance Scanner (+https://accessibility.now)",
  });

  const consoleErrors: Array<{ type: string; text: string }> = [];
  const failedRequests: Array<{ url: string; errorText?: string }> = [];

  try {
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

    if (engineOpts.collectRuntimeDiagnostics) {
      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        if (consoleErrors.length >= MAX_CONSOLE_ERRORS) return;
        consoleErrors.push({ type: "error", text: capDiagText(msg.text() || "(no message)", MAX_CONSOLE_TEXT_LEN) });
      });
      page.on("requestfailed", (req) => {
        if (failedRequests.length >= MAX_FAILED_REQUESTS) return;
        const u = capDiagText(req.url(), MAX_FAILED_URL_LEN);
        const f = req.failure();
        const errText = f?.errorText ? capDiagText(f.errorText, 120) : undefined;
        failedRequests.push({ url: u, ...(errText ? { errorText: errText } : {}) });
      });
    }

    const perRunResults: Array<{
      label: string;
      violations: AuditViolation[];
      axeViolationsRaw: Array<{ id?: string; nodes?: AxeNodeLike[] }>;
      passes: number;
      violationsCount: number;
    }> = [];

    for (let vi = 0; vi < engineOpts.viewports.length; vi++) {
      const vp = engineOpts.viewports[vi]!;
      await page.setViewportSize({ width: vp.width, height: vp.height });
      if (vi === 0) {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: AUDIT_TIMEOUT_MS });
      } else {
        await page.reload({ waitUntil: "domcontentloaded", timeout: AUDIT_TIMEOUT_MS });
      }
      await page.waitForLoadState("networkidle", { timeout: NETWORK_IDLE_AFTER_LOAD_MS }).catch(() => undefined);
      await new Promise<void>((r) => setTimeout(r, HYDRATION_SETTLE_MS));
      await scrollDocumentForLazyContent(page);
      await new Promise<void>((r) => setTimeout(r, POST_SCROLL_SETTLE_MS));

      const axeResults = await new AxeBuilder({ page })
        .withTags(tags)
        .options({
          iframes: true,
          resultTypes: ["violations", "passes"],
        })
        .analyze();

      const violations = mapAxeToViolations(axeResults.violations);
      perRunResults.push({
        label: vp.label,
        violations,
        axeViolationsRaw: axeResults.violations,
        passes: axeResults.passes.length,
        violationsCount: axeResults.violations.length,
      });
    }

    const last = perRunResults[perRunResults.length - 1]!;
    let violations: AuditViolation[];
    if (multiVp) {
      violations = mergeViolationsAcrossViewports(
        perRunResults.map((r) => ({ label: r.label, violations: r.violations })),
      );
      await attachElementScreenshotsMerged(page, violations, last.axeViolationsRaw);
    } else {
      violations = last.violations;
      await attachElementScreenshots(page, violations, last.axeViolationsRaw as Array<{ nodes?: AxeNodeLike[] }>);
    }

    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => undefined);
    await new Promise<void>((r) => setTimeout(r, 200));

    let pageScreenshot: string | undefined;
    try {
      const buf = await page.screenshot({
        type: "jpeg",
        quality: PAGE_SCREENSHOT_JPEG_QUALITY,
        fullPage: false,
        ...stablePlaywrightScreenshotProps,
      });
      pageScreenshot = `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      pageScreenshot = undefined;
    }

    const passedChecks = last.passes;
    const totalChecks = last.violationsCount + last.passes;

    const hasDiag =
      engineOpts.collectRuntimeDiagnostics &&
      (consoleErrors.length > 0 || failedRequests.length > 0);
    const runtimeDiagnostics: RuntimeDiagnostics | undefined = hasDiag
      ? {
          consoleErrors,
          ...(failedRequests.length > 0 ? { failedRequests } : {}),
        }
      : undefined;

    return {
      violations,
      passedChecks,
      totalChecks,
      pageScreenshot,
      ...(runtimeDiagnostics ? { runtimeDiagnostics } : {}),
    };
  } finally {
    await context.close().catch(() => {});
  }
}

/** Shared Chromium launch for audits (single scans and batch workers). */
export async function launchChromiumForAudit(): Promise<import("playwright").Browser> {
  return launchChromiumHeadless();
}

export interface RunAccessibilityScanOptions {
  /**
   * Reuse an existing browser (one Playwright scan at a time per instance).
   * Caller must `close()` the browser when finished. Used by batch routes to avoid cold-starts per URL.
   */
  browser?: import("playwright").Browser;
  /** Axe tag set: `strict` adds AAA-oriented rules where supported. Default: `default`. */
  profile?: ScanProfile;
  /** When true, runs mobile + desktop axe passes and merges violations (slower). Default: false. */
  multiViewport?: boolean;
  /** Collect console errors and failed requests during Playwright navigation. Default: true for single scans; batch may set false. */
  collectRuntimeDiagnostics?: boolean;
}

export async function runAccessibilityScan(
  url: string,
  options?: RunAccessibilityScanOptions,
): Promise<ScanResult> {
  const allowPrivateTargets = scanAllowsPrivateTargets();
  const scanProfile: ScanProfile = options?.profile === "strict" ? "strict" : "default";
  const multiViewport = Boolean(options?.multiViewport);
  const collectRuntimeDiagnostics = options?.collectRuntimeDiagnostics !== false;
  const viewports: ScanViewport[] = multiViewport ? [...MULTI_VIEWPORTS] : [DEFAULT_VIEWPORT_DESKTOP];

  const navigationUrl = await resolveScanNavigationUrl(url, allowPrivateTargets);
  if (navigationUrl !== url) {
    logger.info({ url, navigationUrl }, "Scan target resolved after HTTP redirects");
  }

  let violations: AuditViolation[] = [];
  let passedChecks = 0;
  let totalChecks = 0;
  let playwrightSucceeded = false;
  let pageScreenshot: string | undefined;
  let playwrightRuntimeDiagnostics: RuntimeDiagnostics | undefined;

  const reuseBrowser = options?.browser;
  let browser: import("playwright").Browser | undefined = reuseBrowser;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const extraTimeoutMs =
    (multiViewport ? 38_000 : 0) + (scanProfile === "strict" ? 6_000 : 0) + (collectRuntimeDiagnostics ? 0 : 0);

  try {
    if (!browser) {
      browser = await launchChromiumForAudit();
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error(`Audit timed out after ${AUDIT_TIMEOUT_MS / 1000}s`)),
        AUDIT_TIMEOUT_MS + 8000 + extraTimeoutMs,
      );
    });

    const result = await Promise.race([
      runPlaywrightScan(navigationUrl, browser, allowPrivateTargets, {
        profile: scanProfile,
        viewports,
        collectRuntimeDiagnostics,
      }),
      timeoutPromise,
    ]);
    violations = result.violations;
    passedChecks = result.passedChecks;
    totalChecks = result.totalChecks;
    playwrightSucceeded = true;
    pageScreenshot = result.pageScreenshot;
    playwrightRuntimeDiagnostics = result.runtimeDiagnostics;
  } catch (err) {
    logger.warn({ err, url }, "Playwright audit failed, falling back to fetch-based scan");
    if (reuseBrowser && browser) {
      await Promise.all(browser.contexts().map((c) => c.close().catch(() => {})));
    }
  } finally {
    clearTimeout(timeoutHandle);
    if (!reuseBrowser) {
      await browser?.close().catch(() => {});
    }
  }

  const scanEngine: ScanEngine = playwrightSucceeded ? "playwright" : "static_fallback";

  if (!playwrightSucceeded) {
    const revalidation = await validateScanUrl(navigationUrl, allowPrivateTargets);
    if (!revalidation.ok) {
      logger.warn(
        { url: navigationUrl, reason: revalidation.error },
        "SSRF re-validation failed in fallback scan path",
      );
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
        const response = await fetch(navigationUrl, {
          redirect: "follow",
          headers: {
            "User-Agent": SCAN_FETCH_USER_AGENT,
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
            url: navigationUrl,
            runScripts: "outside-only",
            pretendToBeVisual: true,
          });
          const doc = dom.window.document as unknown as Document;
          axe.setup(doc);
          const axeResults = await axe.run(doc, {
            runOnly: {
              type: "tag",
              values: [...axeTagsForProfile(scanProfile)],
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
        logger.warn({ fetchErr, url: navigationUrl }, "Fallback fetch-based scan also failed");
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

  const scanMetadata: ScanMetadata | undefined = playwrightSucceeded
    ? {
        profile: scanProfile,
        multiViewport,
        viewportsUsed: viewports.map((v) => ({ ...v })),
        ...(playwrightRuntimeDiagnostics ? { runtimeDiagnostics: playwrightRuntimeDiagnostics } : {}),
      }
    : scanEngine === "static_fallback"
      ? {
          profile: scanProfile,
          multiViewport: false,
          viewportsUsed: [],
        }
      : undefined;

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
    ...(scanMetadata ? { scanMetadata } : {}),
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
