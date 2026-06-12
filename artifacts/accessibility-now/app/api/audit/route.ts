import { randomUUID } from "crypto";
import { CreateAuditBody } from "@workspace/api-zod";
import { enqueueJob } from "@/server/artifacts/storage";
import { jsonErr, jsonOk, readJson } from "@/server/http";
import { insertPendingAudit } from "@/server/storage/audits";
import { logger } from "@/server/logger";
import { createScanJob } from "@/server/jobs/scan-job-store";
import { enforceRateLimit } from "@/server/rate-limit";
import { validateScanUrl, type ScanMetadata } from "@/server/scan";

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, { namespace: "audit", limit: 10 });
  if (limited) return limited;

  const body = await readJson(req);
  const parsed = CreateAuditBody.safeParse(body);
  if (!parsed.success) {
    return jsonErr(400, "validation_error", parsed.error.message);
  }

  let raw = parsed.data.url;
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  const validation = await validateScanUrl(raw);
  if (!validation.ok) {
    return jsonErr(400, "invalid_url", validation.error);
  }

  const { url } = validation;
  const profile = parsed.data.profile === "strict" ? "strict" : "default";
  const multiViewport = parsed.data.multiViewport === true;
  const auditId = randomUUID();
  const jobId = auditId;
  const scannedAt = new Date();

  const pendingMetadata: ScanMetadata = {
    profile,
    multiViewport,
    viewportsUsed: [],
    pending: true,
  };

  logger.info({ url, auditId, jobId }, "Queueing accessibility audit job");

  try {
    await insertPendingAudit({
      auditId,
      url,
      scannedAt,
      scanMetadata: pendingMetadata,
    });

    await createScanJob({ jobId, auditId, url, profile, multiViewport });
  } catch (err) {
    logger.error({ err, url, auditId }, "Failed to create pending audit row");
    return jsonErr(
      500,
      "audit_failed",
      "The accessibility audit could not be started. Please try again.",
    );
  }

  await enqueueJob({
    type: "audit",
    jobId,
    auditId,
    url,
    profile,
    multiViewport,
  });

  return jsonOk(
    {
      jobId,
      auditId,
      status: "pending",
      url,
      scannedAt: scannedAt.toISOString(),
      score: 0,
      level: "moderate",
      totalViolations: 0,
      criticalViolations: 0,
      seriousViolations: 0,
      violations: [],
      passedChecks: 0,
      totalChecks: 0,
      scanEngine: "unknown",
      scanMetadata: pendingMetadata,
    },
    202,
  );
}
