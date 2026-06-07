import { eq } from "drizzle-orm";
import { GetAuditParams } from "@workspace/api-zod";
import { auditsTable } from "@workspace/db";
import { dbRowToAuditResult } from "@/server/audit-mapper";
import { jsonErr, jsonOk, prepareRequestDb, requestDb } from "@/server/http";
import { logger } from "@/server/logger";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ auditId: string }> },
) {
  prepareRequestDb();
  const db = requestDb();

  const { auditId } = await params;
  const parsed = GetAuditParams.safeParse({ auditId });

  if (!parsed.success) {
    return jsonErr(400, "validation_error", parsed.error.message);
  }

  try {
    const rows = await db
      .select()
      .from(auditsTable)
      .where(eq(auditsTable.auditId, parsed.data.auditId))
      .limit(1);

    if (rows.length === 0) {
      return jsonErr(404, "not_found", "Audit result not found.");
    }

    return jsonOk(await dbRowToAuditResult(rows[0]));
  } catch (err) {
    logger.error({ err }, "Failed to retrieve audit from database");
    return jsonErr(500, "db_error", "Could not retrieve the audit result.");
  }
}
