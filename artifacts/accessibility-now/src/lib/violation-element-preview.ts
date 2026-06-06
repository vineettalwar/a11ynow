import type { AuditViolation } from "@workspace/api-client-react";

export function primaryViolationSelector(violation: AuditViolation): string {
  const fromInst = violation.instanceDetails?.find((i) => i.selector?.trim())?.selector;
  if (fromInst?.trim()) return fromInst.trim();
  const fromTop = (violation.topSelectors ?? []).find((s) => Boolean(s?.trim()));
  return (fromTop ?? "").trim();
}

/** JPEG data URL from the primary flagged instance when the scan captured one. */
export function primaryInstanceElementScreenshot(violation: AuditViolation): string | undefined {
  const details = violation.instanceDetails;
  if (!details?.length) return undefined;
  const primaryInst = details.find((i) => i.selector?.trim()) ?? details[0];
  const raw =
    primaryInst?.elementScreenshot?.trim() ??
    details.find((i) => i.elementScreenshot?.trim())?.elementScreenshot?.trim();
  if (!raw?.startsWith("data:image/")) return undefined;
  return raw;
}
