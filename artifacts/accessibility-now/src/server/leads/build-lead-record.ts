import type { LeadPayload, LeadRecord } from "./types";

function optionalText(value?: string): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildLeadRecord(
  payload: LeadPayload,
  now = new Date(),
): LeadRecord {
  return {
    leadId: crypto.randomUUID(),
    name: payload.name.trim(),
    email: payload.email.trim(),
    auditId: optionalText(payload.auditId),
    company: optionalText(payload.company),
    service: optionalText(payload.service),
    message: optionalText(payload.message),
    websiteUrl: optionalText(payload.websiteUrl),
    source: optionalText(payload.source),
    createdAt: now.toISOString(),
  };
}
