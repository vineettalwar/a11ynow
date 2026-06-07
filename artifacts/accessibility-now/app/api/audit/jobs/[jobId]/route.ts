import { eq } from "drizzle-orm";
import { auditsTable } from "@workspace/db";
import { dbRowToAuditResult } from "@/server/audit-mapper";
import { jsonErr, jsonOk, prepareRequestDb, requestDb } from "@/server/http";
import { getScanJob } from "@/server/jobs/scan-job-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  if (!jobId?.trim()) {
    return jsonErr(400, "validation_error", "jobId is required.");
  }

  const job = await getScanJob(jobId);
  if (!job) {
    return jsonErr(404, "not_found", "Audit job not found.");
  }

  prepareRequestDb();
  const db = requestDb();
  const rows = await db
    .select()
    .from(auditsTable)
    .where(eq(auditsTable.auditId, job.auditId))
    .limit(1);

  const auditRow = rows[0];
  const result = auditRow ? await dbRowToAuditResult(auditRow) : undefined;

  return jsonOk({
    jobId: job.jobId,
    auditId: job.auditId,
    status: job.status,
    url: job.url,
    error: job.errorMessage ?? undefined,
    result,
  });
}
