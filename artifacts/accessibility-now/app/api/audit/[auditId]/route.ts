import { GetAuditParams } from "@workspace/api-zod";
import { dbRowToAuditResult } from "@/server/audit-mapper";
import { jsonErr, jsonOk } from "@/server/http";
import { logger } from "@/server/logger";
import { findAuditById } from "@/server/storage/audits";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await params;
  const parsed = GetAuditParams.safeParse({ auditId });

  if (!parsed.success) {
    return jsonErr(400, "validation_error", parsed.error.message);
  }

  try {
    const row = await findAuditById(parsed.data.auditId);
    if (!row) {
      return jsonErr(404, "not_found", "Audit result not found.");
    }

    return jsonOk(await dbRowToAuditResult(row));
  } catch (err) {
    logger.error({ err }, "Failed to retrieve audit from database");
    return jsonErr(500, "db_error", "Could not retrieve the audit result.");
  }
}
