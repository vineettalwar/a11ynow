import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { CreateAuditBody, GetAuditParams } from "@workspace/api-zod";
import { db, auditsTable } from "@workspace/db";
import { runAccessibilityScan, validateScanUrl } from "../lib/scan";

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

  const validation = await validateScanUrl(raw);
  if (!validation.ok) {
    res.status(400).json({ error: "invalid_url", message: validation.error });
    return;
  }

  const { url } = validation;
  req.log.info({ url }, "Running accessibility audit");

  try {
    const result = await runAccessibilityScan(url);
    const auditId = randomUUID();
    const scannedAt = new Date();

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

    res.json({
      auditId,
      url,
      scannedAt: scannedAt.toISOString(),
      score: result.score,
      level: result.level,
      totalViolations: result.totalViolations,
      criticalViolations: result.criticalViolations,
      seriousViolations: result.seriousViolations,
      violations: result.violations,
      passedChecks: result.passedChecks,
      totalChecks: result.totalChecks,
    } satisfies AuditResultData);
  } catch (err) {
    req.log.error({ err, url }, "Audit failed");
    res.status(500).json({
      error: "audit_failed",
      message: "The accessibility audit could not be completed. Please try again.",
    });
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
