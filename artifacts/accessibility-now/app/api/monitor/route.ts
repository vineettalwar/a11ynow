import { randomBytes, randomUUID } from "crypto";
import { validateScanUrl } from "@/server/scan";
import { sendMonitoringConfirmation } from "@/server/email";
import { logger } from "@/server/logger";
import { jsonErr, jsonOk, readJson } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { findAuditById } from "@/server/storage/audits";
import { insertMonitor, insertMonitoringScan } from "@/server/storage/monitors";

const VALID_FREQUENCIES = ["weekly", "monthly"] as const;
type Frequency = (typeof VALID_FREQUENCIES)[number];

const APP_BASE_URL = process.env["APP_BASE_URL"] ?? "https://accessibility.now";

function nextScanDate(frequency: Frequency): Date {
  const d = new Date();
  if (frequency === "weekly") {
    d.setDate(d.getDate() + 7);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, { namespace: "monitor", limit: 10 });
  if (limited) return limited;

  const body = await readJson<Record<string, unknown>>(req);
  const { url: rawUrl, email, frequency, auditId } = body;

  if (typeof email !== "string" || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonErr(400, "validation_error", "A valid email address is required.");
  }

  if (!VALID_FREQUENCIES.includes(frequency as Frequency)) {
    return jsonErr(400, "validation_error", "Frequency must be 'weekly' or 'monthly'.");
  }

  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return jsonErr(400, "validation_error", "A URL is required.");
  }

  let normalised = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalised)) {
    normalised = `https://${normalised}`;
  }

  const validation = await validateScanUrl(normalised);
  if (!validation.ok) {
    return jsonErr(400, "invalid_url", validation.error);
  }

  const { url } = validation;
  const token = randomBytes(24).toString("hex");
  const id = randomUUID();
  const now = new Date();

  try {
    await insertMonitor({
      id,
      url,
      email: email.trim().toLowerCase(),
      frequency: frequency as Frequency,
      token,
      isActive: true,
      createdAt: now,
      nextScanAt: nextScanDate(frequency as Frequency),
    });
  } catch (err) {
    logger.error({ err, url }, "Failed to register monitored URL");
    return jsonErr(500, "db_error", "Could not register URL for monitoring.");
  }

  if (typeof auditId === "string" && auditId.trim()) {
    try {
      const audit = await findAuditById(auditId.trim());
      if (audit) {
        const auditUrlNorm = audit.url.replace(/\/+$/, "").toLowerCase();
        const monitorUrlNorm = url.replace(/\/+$/, "").toLowerCase();
        if (auditUrlNorm !== monitorUrlNorm) {
          logger.warn(
            { auditId, auditUrl: audit.url, monitorUrl: url },
            "Audit URL does not match monitored URL: skipping seed",
          );
        } else {
          await insertMonitoringScan({
            id: randomUUID(),
            monitoredUrlId: id,
            score: audit.score,
            level: audit.level,
            totalViolations: audit.totalViolations,
            criticalViolations: audit.criticalViolations,
            seriousViolations: audit.seriousViolations,
            violations: audit.violations,
            violationsRef: audit.violationsRef,
            passedChecks: audit.passedChecks,
            totalChecks: audit.totalChecks,
            scannedAt: audit.scannedAt,
          });
          logger.info({ auditId, monitoredUrlId: id }, "Seeded first monitoring scan from audit");
        }
      }
    } catch (err) {
      logger.warn({ err, auditId }, "Failed to seed monitoring scan from audit: continuing");
    }
  }

  await sendMonitoringConfirmation({
    to: email.trim().toLowerCase(),
    url,
    frequency: frequency as string,
    token,
    appBaseUrl: APP_BASE_URL,
  });

  logger.info({ url, email, frequency, seeded: !!auditId }, "Monitoring registered");
  return jsonOk(
    { token, url, frequency, email: email.trim().toLowerCase() },
    201,
  );
}
