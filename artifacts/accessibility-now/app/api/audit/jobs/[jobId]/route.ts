import { dbRowToAuditResult } from "@/server/audit-mapper";
import { jsonErr, jsonOk } from "@/server/http";
import { getScanJob } from "@/server/jobs/scan-job-store";
import { findAuditById } from "@/server/storage/audits";

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

  const auditRow = await findAuditById(job.auditId);
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
