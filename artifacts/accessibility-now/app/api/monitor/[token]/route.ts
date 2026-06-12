import type { AuditViolationStored } from "@workspace/db";
import { resolveStoredViolations } from "@/server/artifacts/storage";
import { logger } from "@/server/logger";
import { jsonErr, jsonOk, readJson } from "@/server/http";
import {
  findMonitorByToken,
  listMonitoringScans,
  setMonitorActive,
} from "@/server/storage/monitors";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || !/^[0-9a-f]{48}$/i.test(token)) {
    return jsonErr(400, "invalid_token", "Invalid monitoring token.");
  }

  try {
    const registration = await findMonitorByToken(token);
    if (!registration) {
      return jsonErr(404, "not_found", "Monitoring registration not found.");
    }

    const scans = await listMonitoringScans(registration.id);
    const latest = scans.length > 0 ? scans[scans.length - 1] : null;
    const latestViolations = latest
      ? await resolveStoredViolations(
          latest.violations as AuditViolationStored[],
          latest.violationsRef,
        )
      : null;

    return jsonOk({
      url: registration.url,
      frequency: registration.frequency,
      isActive: registration.isActive,
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
            violations: latestViolations ?? [],
            passedChecks: latest.passedChecks,
            totalChecks: latest.totalChecks,
            scannedAt: latest.scannedAt.toISOString(),
          }
        : null,
    });
  } catch (err) {
    logger.error({ err, token }, "Failed to fetch monitoring data");
    return jsonErr(500, "db_error", "Could not retrieve monitoring data.");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || !/^[0-9a-f]{48}$/i.test(token)) {
    return jsonErr(400, "invalid_token", "Invalid monitoring token.");
  }

  const body = await readJson<{ action?: string }>(req);
  if (body.action !== "pause" && body.action !== "resume") {
    return jsonErr(400, "validation_error", "action must be 'pause' or 'resume'.");
  }

  try {
    const registration = await findMonitorByToken(token);
    if (!registration) {
      return jsonErr(404, "not_found", "Monitoring registration not found.");
    }

    const isActive = body.action === "resume";
    await setMonitorActive(registration.id, isActive);

    return jsonOk({
      url: registration.url,
      isActive,
      message: isActive ? "Monitoring resumed." : "Monitoring paused.",
    });
  } catch (err) {
    logger.error({ err, token }, "Failed to update monitoring registration");
    return jsonErr(500, "db_error", "Could not update monitoring registration.");
  }
}
