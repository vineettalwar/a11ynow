import { Router, type IRouter } from "express";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "crypto";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { eq } from "drizzle-orm";
import { CreateAuditBody, GetAuditParams } from "@workspace/api-zod";
import { db, auditsTable } from "@workspace/db";
import { logger } from "../lib/logger";

const dnsLookupAsync = promisify(dnsLookup);

const PRIVATE_IP_RE = /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;

const AUDIT_TIMEOUT_MS = 30000;

async function validateAuditUrl(raw: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
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

const router: IRouter = Router();

interface AuditViolationData {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
  topSelectors: string[];
}

interface AuditResultData {
  auditId: string;
  url: string;
  scannedAt: string;
  score: number;
  level: "critical" | "poor" | "moderate" | "good" | "excellent";
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  violations: AuditViolationData[];
  passedChecks: number;
  totalChecks: number;
}

function scoreToLevel(score: number): "critical" | "poor" | "moderate" | "good" | "excellent" {
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
  const bestPractice = tags.includes("best-practice");
  if (bestPractice) return "Best Practice";
  return "WCAG 2.1";
}

async function runPlaywrightAudit(
  url: string,
  browser: import("playwright").Browser,
): Promise<{ violations: AuditViolationData[]; passedChecks: number; totalChecks: number }> {
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

  const violations: AuditViolationData[] = axeResults.violations.map((v) => ({
    id: v.id,
    wcagCriteria: tagToWcagCriteria(v.tags),
    description: v.description,
    impact: (v.impact as AuditViolationData["impact"]) ?? "minor",
    affectedElements: v.nodes.length,
    topSelectors: v.nodes.slice(0, 3).map((n) =>
      Array.isArray(n.target) ? n.target.join(" > ") : String(n.target)
    ),
  }));

  const passedChecks = axeResults.passes.length;
  const totalChecks = axeResults.violations.length + axeResults.passes.length;

  await context.close();

  return { violations, passedChecks, totalChecks };
}

async function runAccessibilityAudit(url: string): Promise<AuditResultData> {
  let violations: AuditViolationData[] = [];
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
      timeoutHandle = setTimeout(() => {
        reject(new Error("Audit timed out after 30s"));
      }, AUDIT_TIMEOUT_MS + 5000);
    });

    const result = await Promise.race([
      runPlaywrightAudit(url, browser),
      timeoutPromise,
    ]);
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
          "Accept": "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(12000),
      });

      if (response.ok) {
        const { JSDOM } = await import("jsdom");
        const axe = (await import("axe-core")).default;
        const html = await response.text();
        const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: false });
        const doc = dom.window.document as unknown as Document;
        axe.setup(doc);
        const axeResults = await axe.run(doc, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
          resultTypes: ["violations", "passes"],
        });
        axe.teardown();

        totalChecks = axeResults.violations.length + axeResults.passes.length;
        passedChecks = axeResults.passes.length;

        violations = axeResults.violations.map((v) => ({
          id: v.id,
          wcagCriteria: tagToWcagCriteria(v.tags),
          description: v.description,
          impact: (v.impact as AuditViolationData["impact"]) ?? "minor",
          affectedElements: v.nodes.length,
          topSelectors: v.nodes.slice(0, 3).map((n) =>
            Array.isArray(n.target) ? n.target.join(" > ") : String(n.target)
          ),
        }));
      } else {
        violations.push({
          id: "page-unreachable",
          wcagCriteria: "Scan Limitation",
          description: "The page could not be fetched for automated analysis. It may require authentication or block automated scanners.",
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
        description: "The page could not be analyzed. It may be unreachable, require authentication, or block automated scanners.",
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
    auditId: randomUUID(),
    url,
    scannedAt: new Date().toISOString(),
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

function dbRowToResult(row: typeof auditsTable.$inferSelect): AuditResultData {
  return {
    auditId: row.auditId,
    url: row.url,
    scannedAt: row.scannedAt.toISOString(),
    score: row.score,
    level: row.level as AuditResultData["level"],
    totalViolations: row.totalViolations,
    criticalViolations: row.criticalViolations,
    seriousViolations: row.seriousViolations,
    violations: row.violations as AuditViolationData[],
    passedChecks: row.passedChecks,
    totalChecks: row.totalChecks,
  };
}

router.post("/audit", async (req, res): Promise<void> => {
  const parsed = CreateAuditBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  let raw = parsed.data.url;
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  const validation = await validateAuditUrl(raw);
  if (!validation.ok) {
    res.status(400).json({ error: "invalid_url", message: validation.error });
    return;
  }

  const { url } = validation;
  req.log.info({ url }, "Running accessibility audit");

  try {
    const result = await runAccessibilityAudit(url);

    await db.insert(auditsTable).values({
      auditId: result.auditId,
      url: result.url,
      scannedAt: new Date(result.scannedAt),
      score: result.score,
      level: result.level,
      totalViolations: result.totalViolations,
      criticalViolations: result.criticalViolations,
      seriousViolations: result.seriousViolations,
      violations: result.violations,
      passedChecks: result.passedChecks,
      totalChecks: result.totalChecks,
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err, url }, "Audit failed");
    res.status(500).json({ error: "audit_failed", message: "The accessibility audit could not be completed. Please try again." });
  }
});

router.get("/audit/:auditId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.auditId) ? req.params.auditId[0] : req.params.auditId;
  const params = GetAuditParams.safeParse({ auditId: raw });

  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.auditId, params.data.auditId))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "not_found", message: "Audit result not found." });
      return;
    }

    res.json(dbRowToResult(rows[0]));
  } catch (err) {
    req.log.error({ err }, "Failed to retrieve audit from database");
    res.status(500).json({ error: "db_error", message: "Could not retrieve the audit result." });
  }
});

export default router;
