import { eq, asc } from "drizzle-orm";
import { monitoredUrlsTable, monitoringScansTable } from "@workspace/db";
import { logger } from "@/server/logger";
import { jsonErr, jsonOk, prepareRequestDb, requestDb } from "@/server/http";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  prepareRequestDb();
  const db = requestDb();

  const { token } = await params;

  if (!token || !/^[0-9a-f]{48}$/i.test(token)) {
    return jsonErr(400, "invalid_token", "Invalid monitoring token.");
  }

  try {
    const registrations = await db
      .select()
      .from(monitoredUrlsTable)
      .where(eq(monitoredUrlsTable.token, token))
      .limit(1);

    if (registrations.length === 0) {
      return jsonErr(404, "not_found", "Monitoring registration not found.");
    }

    const registration = registrations[0];

    const scans = await db
      .select()
      .from(monitoringScansTable)
      .where(eq(monitoringScansTable.monitoredUrlId, registration.id))
      .orderBy(asc(monitoringScansTable.scannedAt));

    const latest = scans.length > 0 ? scans[scans.length - 1] : null;

    return jsonOk({
      url: registration.url,
      frequency: registration.frequency,
      createdAt: registration.createdAt.toISOString(),
      nextScanAt: registration.nextScanAt.toISOString(),
      scans: scans.map((s: (typeof scans)[number]) => ({
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
    logger.error({ err, token }, "Failed to fetch monitoring data");
    return jsonErr(500, "db_error", "Could not retrieve monitoring data.");
  }
}
