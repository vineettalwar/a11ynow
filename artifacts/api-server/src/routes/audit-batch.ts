import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { db, auditsTable } from "@workspace/db";
import { runAccessibilityScan, validateScanUrl, scoreToLevel } from "../lib/scan";
import type { AuditViolation } from "../lib/scan";

const router: IRouter = Router();

function parseBatchBody(body: unknown): { ok: true; urls: string[] } | { ok: false; message: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }
  const { urls } = body as Record<string, unknown>;
  if (!Array.isArray(urls)) return { ok: false, message: "'urls' must be an array of strings." };
  if (urls.length < 1) return { ok: false, message: "'urls' must contain at least 1 URL." };
  if (urls.length > 10) return { ok: false, message: "'urls' must contain at most 10 URLs." };
  for (let i = 0; i < urls.length; i++) {
    if (typeof urls[i] !== "string" || !urls[i].trim()) {
      return { ok: false, message: `URL at index ${i} must be a non-empty string.` };
    }
  }
  return { ok: true, urls: urls as string[] };
}

interface BatchPageResult {
  auditId: string;
  url: string;
  score: number;
  level: "critical" | "poor" | "moderate" | "good" | "excellent";
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  passedChecks: number;
  totalChecks: number;
  violations: AuditViolation[];
  scannedAt: string;
  status: "success" | "error";
  error?: string;
}

interface CrossPageViolation {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  pageCount: number;
  totalAffectedElements: number;
  affectedUrls: string[];
}

router.post("/audit/batch", async (req, res): Promise<void> => {
  const parsed = parseBatchBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: "validation_error", message: parsed.message });
    return;
  }

  const rawUrls = parsed.urls;

  const normalised: string[] = [];
  for (const raw of rawUrls) {
    let u = raw.trim();
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    normalised.push(u);
  }

  const validations = await Promise.all(normalised.map((u) => validateScanUrl(u)));
  const invalidIdx = validations.findIndex((v) => !v.ok);
  if (invalidIdx !== -1) {
    const invalid = validations[invalidIdx];
    res.status(400).json({
      error: "invalid_url",
      message: `URL #${invalidIdx + 1}: ${(invalid as { ok: false; error: string }).error}`,
    });
    return;
  }

  const cleanUrls = (validations as { ok: true; url: string }[]).map((v) => v.url);

  req.log.info({ count: cleanUrls.length }, "Running batch accessibility audit (SSE)");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data: unknown) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const scannedAt = new Date();
    const pages: BatchPageResult[] = new Array(cleanUrls.length);
    let idx = 0;

    async function worker() {
      while (idx < cleanUrls.length) {
        const i = idx++;
        const url = cleanUrls[i];

        sendEvent({ type: "scanning", url, index: i });

        try {
          const result = await runAccessibilityScan(url);
          const auditId = randomUUID();

          await db.insert(auditsTable).values({
            auditId,
            url,
            scannedAt,
            score: result.score,
            level: result.level,
            totalViolations: result.totalViolations,
            criticalViolations: result.criticalViolations,
            seriousViolations: result.seriousViolations,
            violations: result.violations,
            passedChecks: result.passedChecks,
            totalChecks: result.totalChecks,
          });

          pages[i] = {
            auditId,
            url,
            score: result.score,
            level: result.level,
            totalViolations: result.totalViolations,
            criticalViolations: result.criticalViolations,
            seriousViolations: result.seriousViolations,
            violations: result.violations,
            passedChecks: result.passedChecks,
            totalChecks: result.totalChecks,
            scannedAt: scannedAt.toISOString(),
            status: "success",
          };
        } catch (err) {
          req.log.warn({ err, url }, "Batch scan failed for URL — not persisting failure");
          pages[i] = {
            auditId: "",
            url,
            score: 0,
            level: scoreToLevel(0),
            totalViolations: 0,
            criticalViolations: 0,
            seriousViolations: 0,
            violations: [],
            passedChecks: 0,
            totalChecks: 0,
            scannedAt: scannedAt.toISOString(),
            status: "error",
            error: "Scan failed. The site may be unreachable or blocking automated scanners.",
          };
        }

        sendEvent({
          type: "page",
          index: i,
          url: pages[i].url,
          status: pages[i].status,
          score: pages[i].score,
          level: pages[i].level,
          auditId: pages[i].auditId,
          error: pages[i].error,
        });
      }
    }

    const workers = Array.from({ length: Math.min(3, cleanUrls.length) }, () => worker());
    await Promise.all(workers);

    const successPages = pages.filter((p) => p.status === "success");
    // Weighted average: weight each page's score by its totalChecks so pages
    // with more auditable elements contribute proportionally to the site score.
    const totalWeight = successPages.reduce((sum, p) => sum + (p.totalChecks || 1), 0);
    const siteScore =
      successPages.length > 0
        ? Math.round(
            successPages.reduce((sum, p) => sum + p.score * (p.totalChecks || 1), 0) / totalWeight,
          )
        : 0;
    const siteLevel = scoreToLevel(siteScore);

    const violationMap = new Map<
      string,
      { violation: AuditViolation; pageUrls: string[]; totalElements: number }
    >();

    for (const page of pages) {
      for (const v of page.violations) {
        const existing = violationMap.get(v.id);
        if (existing) {
          if (!existing.pageUrls.includes(page.url)) existing.pageUrls.push(page.url);
          existing.totalElements += v.affectedElements;
        } else {
          violationMap.set(v.id, {
            violation: v,
            pageUrls: [page.url],
            totalElements: v.affectedElements,
          });
        }
      }
    }

    const crossPageViolations: CrossPageViolation[] = Array.from(violationMap.values())
      .map(({ violation, pageUrls, totalElements }) => ({
        id: violation.id,
        wcagCriteria: violation.wcagCriteria,
        description: violation.description,
        impact: violation.impact,
        pageCount: pageUrls.length,
        totalAffectedElements: totalElements,
        affectedUrls: pageUrls,
      }))
      .sort((a, b) => b.pageCount - a.pageCount || b.totalAffectedElements - a.totalAffectedElements);

    sendEvent({
      type: "complete",
      siteScore,
      siteLevel,
      pages: pages.map((p) => ({
        auditId: p.auditId,
        url: p.url,
        score: p.score,
        level: p.level,
        totalViolations: p.totalViolations,
        criticalViolations: p.criticalViolations,
        seriousViolations: p.seriousViolations,
        passedChecks: p.passedChecks,
        totalChecks: p.totalChecks,
        scannedAt: p.scannedAt,
        status: p.status,
        error: p.error,
      })),
      crossPageViolations,
      scannedAt: scannedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Batch SSE stream failed");
    sendEvent({ type: "error", message: "Batch scan failed. Please try again." });
  }

  res.end();
});

export default router;
