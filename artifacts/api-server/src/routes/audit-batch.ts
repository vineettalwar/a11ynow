import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { db, auditsTable } from "@workspace/db";
import { launchChromiumForAudit, runAccessibilityScan, validateScanUrl, scoreToLevel } from "../lib/scan";
import type { AuditViolation, ScanEngine } from "../lib/scan";
import { aggregateCrossPageViolations, computeWeightedSiteScore } from "../lib/batch-report";

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
  scanEngine?: ScanEngine | null;
  /** Viewport JPEG data URL (Playwright); omitted on failure or static fallback. */
  pageScreenshot?: string;
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

  let clientGone = false;
  req.once("close", () => {
    clientGone = true;
  });

  const sendEvent = (data: unknown): boolean => {
    if (res.writableEnded || clientGone) return false;
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch (err) {
      clientGone = true;
      req.log.warn({ err }, "Batch SSE write failed; stopping stream updates");
      return false;
    }
  };

  try {
    const scannedAt = new Date();
    const pages: BatchPageResult[] = new Array(cleanUrls.length);
    let idx = 0;

    const disconnectedPage = (u: string): BatchPageResult => ({
      auditId: "",
      url: u,
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
      error: "Scan skipped because the client disconnected.",
      scanEngine: null,
    });

    const emitPageEvent = (index: number) => {
      const p = pages[index];
      sendEvent({
        type: "page",
        index,
        url: p.url,
        status: p.status,
        score: p.score,
        level: p.level,
        auditId: p.auditId,
        error: p.error,
      });
    };

    async function worker() {
      const browser = await launchChromiumForAudit();
      try {
        while (idx < cleanUrls.length) {
          const i = idx++;
          const url = cleanUrls[i];

          if (clientGone || res.writableEnded) {
            pages[i] = disconnectedPage(url);
            emitPageEvent(i);
            continue;
          }

          if (!sendEvent({ type: "scanning", url, index: i })) {
            pages[i] = disconnectedPage(url);
            emitPageEvent(i);
            continue;
          }

          if (clientGone || res.writableEnded) {
            pages[i] = disconnectedPage(url);
            emitPageEvent(i);
            continue;
          }

          try {
            const result = await runAccessibilityScan(url, {
              browser,
              collectRuntimeDiagnostics: false,
            });
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
              scanEngine: result.scanEngine,
              pageScreenshot: result.pageScreenshot ?? null,
              scanMetadata: result.scanMetadata ?? null,
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
              scanEngine: result.scanEngine,
              ...(result.pageScreenshot ? { pageScreenshot: result.pageScreenshot } : {}),
            };
          } catch (err) {
            req.log.warn({ err, url }, "Batch scan failed for URL; not persisting failure");
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
              scanEngine: null,
            };
          }

          emitPageEvent(i);
        }
      } finally {
        await browser.close().catch(() => {});
      }
    }

    const workers = Array.from({ length: Math.min(3, cleanUrls.length) }, () => worker());
    await Promise.all(workers);

    const successPages = pages.filter((p) => p.status === "success");
    const siteScore = computeWeightedSiteScore(
      successPages.map((p) => ({ score: p.score, totalChecks: p.totalChecks })),
    );
    const siteLevel = scoreToLevel(siteScore);

    const crossPageViolations = aggregateCrossPageViolations(
      pages.map((p) => ({ url: p.url, status: p.status, violations: p.violations })),
    );

    req.log.info(
      {
        siteScore,
        siteLevel,
        urls: cleanUrls.length,
        successCount: successPages.length,
        crossPageViolationCount: crossPageViolations.length,
      },
      "Batch audit aggregation complete",
    );

    let completeDelivered = false;
    if (!clientGone && !res.writableEnded) {
      completeDelivered = sendEvent({
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
          scanEngine: p.scanEngine ?? null,
          ...(p.pageScreenshot ? { pageScreenshot: p.pageScreenshot } : {}),
        })),
        crossPageViolations,
        scannedAt: scannedAt.toISOString(),
      });
    }
    if (!completeDelivered) {
      req.log.info(
        { siteScore, urlCount: cleanUrls.length, clientGone, writableEnded: res.writableEnded },
        "Batch audit finished without delivering final SSE payload (client disconnected, stream ended, or write error)",
      );
    }
  } catch (err) {
    req.log.error({ err }, "Batch SSE stream failed");
    sendEvent({ type: "error", message: "Batch scan failed. Please try again." });
  }

  res.end();
});

export default router;
