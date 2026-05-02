import { Router, type IRouter } from "express";
import { randomUUID, randomBytes } from "crypto";
import { eq, asc } from "drizzle-orm";
import { db, auditsTable, monitoredUrlsTable, monitoringScansTable } from "@workspace/db";
import { validateScanUrl } from "../lib/scan";
import { sendMonitoringConfirmation } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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

router.post("/monitor", async (req, res): Promise<void> => {
  const { url: rawUrl, email, frequency, auditId } = req.body as Record<string, unknown>;

  if (typeof email !== "string" || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "validation_error", message: "A valid email address is required." });
    return;
  }

  if (!VALID_FREQUENCIES.includes(frequency as Frequency)) {
    res.status(400).json({
      error: "validation_error",
      message: "Frequency must be 'weekly' or 'monthly'.",
    });
    return;
  }

  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    res.status(400).json({ error: "validation_error", message: "A URL is required." });
    return;
  }

  let normalised = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalised)) {
    normalised = `https://${normalised}`;
  }

  const validation = await validateScanUrl(normalised);
  if (!validation.ok) {
    res.status(400).json({ error: "invalid_url", message: validation.error });
    return;
  }

  const { url } = validation;
  const token = randomBytes(24).toString("hex");
  const id = randomUUID();
  const now = new Date();

  try {
    await db.insert(monitoredUrlsTable).values({
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
    res.status(500).json({ error: "db_error", message: "Could not register URL for monitoring." });
    return;
  }

  if (typeof auditId === "string" && auditId.trim()) {
    try {
      const auditRows = await db
        .select()
        .from(auditsTable)
        .where(eq(auditsTable.auditId, auditId.trim()))
        .limit(1);

      if (auditRows.length > 0) {
        const audit = auditRows[0];
        await db.insert(monitoringScansTable).values({
          id: randomUUID(),
          monitoredUrlId: id,
          score: audit.score,
          level: audit.level,
          totalViolations: audit.totalViolations,
          criticalViolations: audit.criticalViolations,
          seriousViolations: audit.seriousViolations,
          violations: audit.violations,
          passedChecks: audit.passedChecks,
          totalChecks: audit.totalChecks,
          scannedAt: audit.scannedAt,
        });
        logger.info({ auditId, monitoredUrlId: id }, "Seeded first monitoring scan from audit");
      }
    } catch (err) {
      logger.warn({ err, auditId }, "Failed to seed monitoring scan from audit — continuing");
    }
  }

  await sendMonitoringConfirmation({
    to: email.trim().toLowerCase(),
    url,
    frequency: frequency as string,
    token,
    appBaseUrl: APP_BASE_URL,
  });

  req.log.info({ url, email, frequency, seeded: !!auditId }, "Monitoring registered");
  res.status(201).json({ token, url, frequency, email: email.trim().toLowerCase() });
});

router.get("/monitor/:token", async (req, res): Promise<void> => {
  const { token } = req.params;

  if (!token || !/^[0-9a-f]{48}$/i.test(token)) {
    res.status(400).json({ error: "invalid_token", message: "Invalid monitoring token." });
    return;
  }

  try {
    const registrations = await db
      .select()
      .from(monitoredUrlsTable)
      .where(eq(monitoredUrlsTable.token, token))
      .limit(1);

    if (registrations.length === 0) {
      res.status(404).json({ error: "not_found", message: "Monitoring registration not found." });
      return;
    }

    const registration = registrations[0];

    const scans = await db
      .select()
      .from(monitoringScansTable)
      .where(eq(monitoringScansTable.monitoredUrlId, registration.id))
      .orderBy(asc(monitoringScansTable.scannedAt));

    const latest = scans.length > 0 ? scans[scans.length - 1] : null;

    res.json({
      url: registration.url,
      frequency: registration.frequency,
      createdAt: registration.createdAt.toISOString(),
      nextScanAt: registration.nextScanAt.toISOString(),
      scans: scans.map((s) => ({
        id: s.id,
        score: s.score,
        level: s.level,
        totalViolations: s.totalViolations,
        criticalViolations: s.criticalViolations,
        seriousViolations: s.seriousViolations,
        passedChecks: s.passedChecks,
        totalChecks: s.totalChecks,
        scannedAt: s.scannedAt.toISOString(),
      })),
      latest: latest
        ? {
            score: latest.score,
            level: latest.level,
            totalViolations: latest.totalViolations,
            criticalViolations: latest.criticalViolations,
            seriousViolations: latest.seriousViolations,
            violations: latest.violations,
            passedChecks: latest.passedChecks,
            totalChecks: latest.totalChecks,
            scannedAt: latest.scannedAt.toISOString(),
          }
        : null,
    });
  } catch (err) {
    req.log.error({ err, token }, "Failed to fetch monitoring data");
    res.status(500).json({ error: "db_error", message: "Could not retrieve monitoring data." });
  }
});

export default router;
