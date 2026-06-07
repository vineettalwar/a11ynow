import { randomUUID } from "crypto";
import { CreateLeadBody } from "@workspace/api-zod";
import { leadsTable } from "@workspace/db";
import { logger } from "@/server/logger";
import { jsonErr, jsonOk, prepareRequestDb, readJson, requestDb } from "@/server/http";

export async function POST(req: Request) {
  prepareRequestDb();
  const db = requestDb();

  const body = await readJson(req);
  const parsed = CreateLeadBody.safeParse(body);
  if (!parsed.success) {
    return jsonErr(400, "validation_error", parsed.error.message);
  }

  const { name, email, auditId } = parsed.data;

  try {
    const leadId = randomUUID();
    const now = new Date();

    await db.insert(leadsTable).values({
      leadId,
      name,
      email,
      auditId: auditId ?? null,
      createdAt: now,
    });

    const emailDomain = email.split("@")[1] ?? "unknown";
    logger.info({ leadId, emailDomain, auditId }, "Lead captured");

    return jsonOk(
      {
        leadId,
        name,
        email,
        auditId: auditId ?? null,
        createdAt: now.toISOString(),
      },
      201,
    );
  } catch (err) {
    logger.error({ err }, "Failed to save lead");
    return jsonErr(500, "db_error", "Could not save your details. Please try again.");
  }
}
