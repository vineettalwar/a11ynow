import type { LeadPayload } from "./types";

export function validateLeadPayload(payload: LeadPayload): string | null {
  if (!payload.name.trim()) {
    return "Name is required.";
  }

  if (!payload.email.trim()) {
    return "Email is required.";
  }

  const source = payload.source?.trim();
  if (source === "contact" || source === "pricing") {
    if (!payload.company?.trim()) {
      return "Company is required.";
    }

    if (!payload.service?.trim()) {
      return "Please select a service.";
    }

    if (!payload.message?.trim()) {
      return "Please provide more details.";
    }
  }

  return null;
}
