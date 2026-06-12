import { CreateLeadBody } from "@workspace/api-zod";
import { buildLeadRecord } from "@/server/leads/build-lead-record";
import { getLeadsRepository } from "@/server/leads/get-leads-repository";
import { validateLeadPayload } from "@/server/leads/validate-lead-payload";
import { logger } from "@/server/logger";
import { jsonErr, jsonOk, prepareRequestDb, readJson } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";

export async function POST(req: Request) {
  const limited = await enforceRateLimit(req, { namespace: "leads", limit: 15 });
  if (limited) return limited;

  prepareRequestDb();

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return jsonErr(400, "validation_error", "Request body must be valid JSON.");
  }

  const parsed = CreateLeadBody.safeParse(body);
  if (!parsed.success) {
    return jsonErr(400, "validation_error", parsed.error.message);
  }

  const validationError = validateLeadPayload(parsed.data);
  if (validationError) {
    return jsonErr(400, "validation_error", validationError);
  }

  try {
    const repository = getLeadsRepository();
    const lead = await repository.create(buildLeadRecord(parsed.data));

    const emailDomain = lead.email.split("@")[1] ?? "unknown";
    logger.info(
      { leadId: lead.leadId, emailDomain, auditId: lead.auditId },
      "Lead captured",
    );

    return jsonOk(
      {
        leadId: lead.leadId,
        name: lead.name,
        email: lead.email,
        auditId: lead.auditId,
        company: lead.company,
        service: lead.service,
        message: lead.message,
        websiteUrl: lead.websiteUrl,
        source: lead.source,
        createdAt: lead.createdAt,
      },
      201,
    );
  } catch (err) {
    logger.error({ err }, "Failed to save lead");
    return jsonErr(500, "db_error", "Could not save your details. Please try again.");
  }
}
