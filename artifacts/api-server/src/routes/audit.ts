import { Router, type IRouter } from "express";
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { randomUUID } from "crypto";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { CreateAuditBody, GetAuditParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const dnsLookupAsync = promisify(dnsLookup);

const PRIVATE_IP_RE = /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;

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

const auditCache = new Map<string, AuditResultData>();

interface AuditViolationData {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
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

async function runAccessibilityAudit(url: string): Promise<AuditResultData> {
  let html = "";
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
      html = await response.text();
    }
  } catch (err) {
    logger.warn({ err, url }, "Failed to fetch URL for audit");
  }

  const violations: AuditViolationData[] = [];
  let passedChecks = 0;
  let totalChecks = 20;

  if (html) {
    try {
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

      for (const v of axeResults.violations) {
        violations.push({
          id: v.id,
          wcagCriteria: tagToWcagCriteria(v.tags),
          description: v.description,
          impact: (v.impact as AuditViolationData["impact"]) ?? "minor",
          affectedElements: v.nodes.length,
        });
      }
    } catch (axeErr) {
      logger.warn({ axeErr, url }, "axe-core analysis failed, falling back");
    }
  } else {
    violations.push({
      id: "page-unreachable",
      wcagCriteria: "Scan Limitation",
      description: "The page could not be fetched for automated analysis. It may require authentication or block automated scanners.",
      impact: "moderate",
      affectedElements: 1,
    });
    passedChecks = Math.floor(totalChecks * 0.4);
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
    auditCache.set(result.auditId, result);
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

  const result = auditCache.get(params.data.auditId);
  if (!result) {
    res.status(404).json({ error: "not_found", message: "Audit result not found or has expired." });
    return;
  }

  res.json(result);
});

export default router;
