import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CreateLeadBody } from "@workspace/api-zod";
import { buildLeadRecord } from "@/server/leads/build-lead-record";
import { D1LeadsRepository } from "@/server/leads/d1-leads-repository";
import { validateLeadPayload } from "@/server/leads/validate-lead-payload";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const parsed = CreateLeadBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: parsed.error.message,
      },
      { status: 400 },
    );
  }

  const validationError = validateLeadPayload(parsed.data);
  if (validationError) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: validationError,
      },
      { status: 400 },
    );
  }

  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) {
    return NextResponse.json(
      {
        error: "db_error",
        message: "D1 is not configured for the current runtime.",
      },
      { status: 500 },
    );
  }

  try {
    const repository = new D1LeadsRepository(env.DB);
    const lead = await repository.create(buildLeadRecord(parsed.data));

    return NextResponse.json(
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
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to save lead", error);
    return NextResponse.json(
      {
        error: "db_error",
        message: "Could not save your details. Please try again.",
      },
      { status: 500 },
    );
  }
}
