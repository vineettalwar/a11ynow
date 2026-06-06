import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { db, leadsTable } from "@workspace/db";
import { CreateLeadBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { name, email, auditId, company, service, message, websiteUrl, source } = parsed.data;

  try {
    const leadId = randomUUID();
    const now = new Date();

    await db.insert(leadsTable).values({
      leadId,
      name,
      email,
      auditId: auditId ?? null,
      company: company ?? null,
      service: service ?? null,
      message: message ?? null,
      websiteUrl: websiteUrl ?? null,
      source: source ?? null,
      createdAt: now,
    });

    const emailDomain = email.split("@")[1] ?? "unknown";
    logger.info({ leadId, emailDomain, auditId, source, service }, "Lead captured");

    res.status(201).json({
      leadId,
      name,
      email,
      auditId: auditId ?? null,
      company: company ?? null,
      service: service ?? null,
      message: message ?? null,
      websiteUrl: websiteUrl ?? null,
      source: source ?? null,
      createdAt: now.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to save lead");
    res.status(500).json({ error: "db_error", message: "Could not save your details. Please try again." });
  }
});

export default router;
