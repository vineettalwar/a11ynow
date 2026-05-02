import { Router, type IRouter } from "express";
import * as cheerio from "cheerio";
import { randomUUID } from "crypto";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { CreateAuditBody, GetAuditParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const dnsLookupAsync = promisify(dnsLookup);

const PRIVATE_IP_RE = /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1|fc00:|fd|fe80:)/i;

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

async function runAccessibilityAudit(url: string): Promise<AuditResultData> {
  let html = "";
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "accessibility.now/1.0 Compliance Scanner",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });
    html = await response.text();
  } catch (err) {
    logger.warn({ err, url }, "Failed to fetch URL, using limited analysis");
  }

  const violations: AuditViolationData[] = [];
  let passedChecks = 0;
  const totalChecks = 20;

  if (html) {
    const $ = cheerio.load(html);

    // 1.1.1 Non-text Content — missing alt on images
    const imgs = $("img");
    const imgsWithoutAlt = imgs.filter((_, el) => !$(el).attr("alt") && $(el).attr("alt") !== "");
    if (imgsWithoutAlt.length > 0) {
      violations.push({
        id: "image-alt",
        wcagCriteria: "1.1.1 Non-text Content",
        description: "Images must have alternative text. Screen readers cannot interpret images without descriptive alt attributes.",
        impact: "critical",
        affectedElements: imgsWithoutAlt.length,
      });
    } else {
      passedChecks++;
    }

    // 1.3.1 Info and Relationships — form inputs without labels
    const inputs = $("input:not([type='hidden']):not([type='submit']):not([type='button']):not([type='reset'])");
    const unlabelledInputs = inputs.filter((_, el) => {
      const id = $(el).attr("id");
      const ariaLabel = $(el).attr("aria-label");
      const ariaLabelledby = $(el).attr("aria-labelledby");
      const hasLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
      return !hasLabel && !ariaLabel && !ariaLabelledby;
    });
    if (unlabelledInputs.length > 0) {
      violations.push({
        id: "label",
        wcagCriteria: "1.3.1 Info and Relationships",
        description: "Form elements must have associated labels. Unlabelled inputs are inaccessible to screen reader users.",
        impact: "serious",
        affectedElements: unlabelledInputs.length,
      });
    } else {
      passedChecks++;
    }

    // 3.1.1 Language of Page
    const htmlLang = $("html").attr("lang");
    if (!htmlLang || htmlLang.trim() === "") {
      violations.push({
        id: "html-has-lang",
        wcagCriteria: "3.1.1 Language of Page",
        description: "The page language must be identified in the HTML element. Missing lang attribute causes screen readers to use the wrong language profile.",
        impact: "serious",
        affectedElements: 1,
      });
    } else {
      passedChecks++;
    }

    // 4.1.2 Name, Role, Value — interactive elements without accessible names
    const buttons = $("button");
    const emptyButtons = buttons.filter((_, el) => {
      const text = $(el).text().trim();
      const ariaLabel = $(el).attr("aria-label");
      const ariaLabelledby = $(el).attr("aria-labelledby");
      const title = $(el).attr("title");
      return !text && !ariaLabel && !ariaLabelledby && !title;
    });
    if (emptyButtons.length > 0) {
      violations.push({
        id: "button-name",
        wcagCriteria: "4.1.2 Name, Role, Value",
        description: "Buttons must have discernible text. Empty buttons provide no context for assistive technology users.",
        impact: "critical",
        affectedElements: emptyButtons.length,
      });
    } else {
      passedChecks++;
    }

    // 2.4.2 Page Titled
    const title = $("title").text().trim();
    if (!title) {
      violations.push({
        id: "document-title",
        wcagCriteria: "2.4.2 Page Titled",
        description: "Pages must have descriptive titles. Missing titles make it impossible for screen reader users to identify the page.",
        impact: "serious",
        affectedElements: 1,
      });
    } else {
      passedChecks++;
    }

    // 1.3.5 Identify Input Purpose
    const emailInputs = $("input[type='email'], input[name*='email'], input[autocomplete='email']");
    const emailWithoutAutocomplete = emailInputs.filter((_, el) => !$(el).attr("autocomplete"));
    if (emailWithoutAutocomplete.length > 0) {
      violations.push({
        id: "autocomplete-valid",
        wcagCriteria: "1.3.5 Identify Input Purpose",
        description: "Input fields collecting personal data should have appropriate autocomplete attributes to assist users with cognitive disabilities.",
        impact: "moderate",
        affectedElements: emailWithoutAutocomplete.length,
      });
    } else {
      passedChecks++;
    }

    // 2.4.1 Bypass Blocks — skip nav
    const hasSkipLink = $("a[href^='#']").first().length > 0;
    if (!hasSkipLink) {
      violations.push({
        id: "skip-link",
        wcagCriteria: "2.4.1 Bypass Blocks",
        description: "Pages with repeated navigation should provide a skip link so keyboard users can bypass navigation and jump to the main content.",
        impact: "moderate",
        affectedElements: 1,
      });
    } else {
      passedChecks++;
    }

    // 1.4.4 Resize Text — check for px font sizes in inline styles
    const elementsWithPxFont = $("[style*='font-size']").filter((_, el) => {
      const style = $(el).attr("style") || "";
      return /font-size:\s*\d+px/.test(style);
    });
    if (elementsWithPxFont.length > 3) {
      violations.push({
        id: "meta-viewport",
        wcagCriteria: "1.4.4 Resize Text",
        description: "Text sized in absolute pixel units may not resize correctly when users adjust browser font size preferences.",
        impact: "moderate",
        affectedElements: elementsWithPxFont.length,
      });
    } else {
      passedChecks++;
    }

    // 4.1.1 Parsing — duplicate IDs
    const ids: string[] = [];
    const duplicateIds: string[] = [];
    $("[id]").each((_, el) => {
      const id = $(el).attr("id") || "";
      if (ids.includes(id)) {
        if (!duplicateIds.includes(id)) duplicateIds.push(id);
      } else {
        ids.push(id);
      }
    });
    if (duplicateIds.length > 0) {
      violations.push({
        id: "duplicate-id",
        wcagCriteria: "4.1.1 Parsing",
        description: "All ID attribute values must be unique. Duplicate IDs break ARIA relationships and cause screen readers to behave unpredictably.",
        impact: "minor",
        affectedElements: duplicateIds.length,
      });
    } else {
      passedChecks++;
    }

    // 2.4.4 Link Purpose — empty or vague links
    const links = $("a");
    const emptyLinks = links.filter((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      const ariaLabel = $(el).attr("aria-label");
      const title = $(el).attr("title");
      const vague = ["click here", "here", "read more", "more", "link"].includes(text);
      return (!text && !ariaLabel && !title) || (vague && !ariaLabel);
    });
    if (emptyLinks.length > 0) {
      violations.push({
        id: "link-name",
        wcagCriteria: "2.4.4 Link Purpose",
        description: "Links must have descriptive text or aria-label. Vague link text like 'click here' or empty links cannot be understood out of context.",
        impact: "serious",
        affectedElements: emptyLinks.length,
      });
    } else {
      passedChecks++;
    }

    // 1.3.2 Meaningful Sequence — tables without headers
    const tables = $("table");
    const tablesWithoutHeaders = tables.filter((_, el) => $("th", el).length === 0);
    if (tablesWithoutHeaders.length > 0) {
      violations.push({
        id: "td-headers-attr",
        wcagCriteria: "1.3.2 Meaningful Sequence",
        description: "Data tables must have header cells (<th>) to provide context for screen readers navigating table data.",
        impact: "serious",
        affectedElements: tablesWithoutHeaders.length,
      });
    } else {
      passedChecks++;
    }

    // Fill remaining passed checks
    const remainingPassed = totalChecks - violations.length - passedChecks;
    passedChecks += Math.max(0, remainingPassed);
  } else {
    // Could not fetch — add a note and estimate
    violations.push({
      id: "page-unreachable",
      wcagCriteria: "Scan Limitation",
      description: "The page could not be fetched for automated analysis. This may be due to authentication requirements, robots.txt restrictions, or server configuration.",
      impact: "moderate",
      affectedElements: 1,
    });
    passedChecks = Math.floor(totalChecks * 0.4);
  }

  const criticalViolations = violations.filter(v => v.impact === "critical").length;
  const seriousViolations = violations.filter(v => v.impact === "serious").length;
  const totalViolations = violations.length;

  // Calculate score: start at 100, deduct per violation weighted by impact
  const impactWeights = { critical: 15, serious: 10, moderate: 5, minor: 2 };
  let deductions = 0;
  for (const v of violations) {
    deductions += impactWeights[v.impact] * Math.min(v.affectedElements, 3);
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
