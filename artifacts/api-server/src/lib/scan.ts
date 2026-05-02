import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { logger } from "./logger";

const dnsLookupAsync = promisify(dnsLookup);

export const PRIVATE_IP_RE =
  /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;

const AUDIT_TIMEOUT_MS = 30000;

export interface AuditViolation {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
  topSelectors: string[];
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

async function runPlaywrightScan(
  url: string,
  browser: import("playwright").Browser,
): Promise<{ violations: AuditViolation[]; passedChecks: number; totalChecks: number }> {
  const context = await browser.newContext({
    userAgent: "accessibility.now/1.0 Compliance Scanner (+https://accessibility.now)",
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
  await page.goto(url, { waitUntil: "networkidle", timeout: AUDIT_TIMEOUT_MS });

  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
    .analyze();

  const violations: AuditViolation[] = axeResults.violations.map((v) => ({
    id: v.id,
    wcagCriteria: tagToWcagCriteria(v.tags),
    description: v.description,
    impact: (v.impact as AuditViolation["impact"]) ?? "minor",
    affectedElements: v.nodes.length,
    topSelectors: v.nodes
      .slice(0, 3)
      .map((n) => (Array.isArray(n.target) ? n.target.join(" > ") : String(n.target))),
  }));

  const passedChecks = axeResults.passes.length;
  const totalChecks = axeResults.violations.length + axeResults.passes.length;

  await context.close();
  return { violations, passedChecks, totalChecks };
}

export async function runAccessibilityScan(url: string): Promise<ScanResult> {
  let violations: AuditViolation[] = [];
  let passedChecks = 0;
  let totalChecks = 20;
  let playwrightSucceeded = false;

  let browser: import("playwright").Browser | undefined;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () => reject(new Error("Audit timed out after 30s")),
        AUDIT_TIMEOUT_MS + 5000,
      );
    });

    const result = await Promise.race([runPlaywrightScan(url, browser), timeoutPromise]);
    violations = result.violations;
    passedChecks = result.passedChecks;
    totalChecks = result.totalChecks;
    playwrightSucceeded = true;
  } catch (err) {
    logger.warn({ err, url }, "Playwright audit failed, falling back to fetch-based scan");
  } finally {
    clearTimeout(timeoutHandle);
    await browser?.close().catch(() => {});
  }

  if (!playwrightSucceeded) {
    try {
      const response = await fetch(url, {
        redirect: "error",
        headers: {
          "User-Agent": "accessibility.now/1.0 Compliance Scanner (+https://accessibility.now)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(12000),
      });

      if (response.ok) {
        const { JSDOM } = await import("jsdom");
        const axe = (await import("axe-core")).default;
        const html = await response.text();
        const dom = new JSDOM(html, {
          url,
          runScripts: "outside-only",
          pretendToBeVisual: false,
        });
        const doc = dom.window.document as unknown as Document;
        axe.setup(doc);
        const axeResults = await axe.run(doc, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
          },
          resultTypes: ["violations", "passes"],
        });
        axe.teardown();

        totalChecks = axeResults.violations.length + axeResults.passes.length;
        passedChecks = axeResults.passes.length;
        violations = axeResults.violations.map((v) => ({
          id: v.id,
          wcagCriteria: tagToWcagCriteria(v.tags),
          description: v.description,
          impact: (v.impact as AuditViolation["impact"]) ?? "minor",
          affectedElements: v.nodes.length,
          topSelectors: v.nodes
            .slice(0, 3)
            .map((n) => (Array.isArray(n.target) ? n.target.join(" > ") : String(n.target))),
        }));
      } else {
        violations.push({
          id: "page-unreachable",
          wcagCriteria: "Scan Limitation",
          description:
            "The page could not be fetched for automated analysis. It may require authentication or block automated scanners.",
          impact: "moderate",
          affectedElements: 1,
          topSelectors: [],
        });
        passedChecks = Math.floor(totalChecks * 0.4);
      }
    } catch (fetchErr) {
      logger.warn({ fetchErr, url }, "Fallback fetch-based scan also failed");
      violations.push({
        id: "page-unreachable",
        wcagCriteria: "Scan Limitation",
        description:
          "The page could not be analyzed. It may be unreachable, require authentication, or block automated scanners.",
        impact: "moderate",
        affectedElements: 1,
        topSelectors: [],
      });
      passedChecks = Math.floor(totalChecks * 0.4);
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
  };
}

export async function validateScanUrl(
  raw: string,
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
  if (PRIVATE_IP_RE.test(hostname)) {
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
  return { ok: true, url: parsed.href };
}
