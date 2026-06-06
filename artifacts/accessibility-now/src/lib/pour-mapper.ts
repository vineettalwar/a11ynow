import type { AuditViolation } from "@workspace/api-client-react";
import { POUR_NAMES, type PourPrincipleName } from "@/data/pour-principles";

/** Map WCAG success criterion number (e.g. "1.4.3") to a POUR principle. */
export function principleFromWcagNumber(scNumber: string): PourPrincipleName {
  const match = scNumber.match(/^(\d)\./);
  const chapter = match ? Number(match[1]) : 0;
  switch (chapter) {
    case 1:
      return "Perceivable";
    case 2:
      return "Operable";
    case 3:
      return "Understandable";
    case 4:
      return "Robust";
    default:
      return "Robust";
  }
}

/** Infer POUR from axe rule id when WCAG criterion text is missing. */
const RULE_TO_PRINCIPLE: Record<string, PourPrincipleName> = {
  "color-contrast": "Perceivable",
  "image-alt": "Perceivable",
  "input-image-alt": "Perceivable",
  "object-alt": "Perceivable",
  "svg-img-alt": "Perceivable",
  "area-alt": "Perceivable",
  "role-img-alt": "Perceivable",
  "html-has-lang": "Understandable",
  "document-title": "Understandable",
  "label": "Understandable",
  "form-field-multiple-labels": "Understandable",
  "duplicate-id-active": "Robust",
  "duplicate-id-aria": "Robust",
  "duplicate-id": "Robust",
  "aria-valid-attr": "Robust",
  "aria-valid-attr-value": "Robust",
  "aria-roles": "Robust",
  "aria-required-attr": "Robust",
  "button-name": "Operable",
  "link-name": "Operable",
  "bypass": "Operable",
  "focus-order-semantics": "Operable",
  "tabindex": "Operable",
  "scrollable-region-focusable": "Operable",
  "frame-title": "Perceivable",
  "meta-viewport": "Perceivable",
  "heading-order": "Perceivable",
  "landmark-one-main": "Perceivable",
  "region": "Perceivable",
  "page-has-heading-one": "Perceivable",
  "skip-link": "Operable",
  "focus-visible": "Operable",
};

export function getViolationPrinciple(violation: AuditViolation): PourPrincipleName {
  const wcag = violation.wcagCriteria ?? "";
  const scMatch = wcag.match(/(\d+\.\d+(?:\.\d+)?)/);
  if (scMatch) return principleFromWcagNumber(scMatch[1]);
  if (violation.id && RULE_TO_PRINCIPLE[violation.id]) {
    return RULE_TO_PRINCIPLE[violation.id];
  }
  return "Robust";
}

export type PourViolationGroups = Record<PourPrincipleName, AuditViolation[]>;

export function groupViolationsByPour(violations: AuditViolation[]): PourViolationGroups {
  const groups: PourViolationGroups = {
    Perceivable: [],
    Operable: [],
    Understandable: [],
    Robust: [],
  };
  for (const v of violations) {
    groups[getViolationPrinciple(v)].push(v);
  }
  for (const name of POUR_NAMES) {
    groups[name].sort((a, b) => impactRank(b.impact) - impactRank(a.impact));
  }
  return groups;
}

function impactRank(impact: AuditViolation["impact"]): number {
  switch (impact) {
    case "critical":
      return 4;
    case "serious":
      return 3;
    case "moderate":
      return 2;
    case "minor":
      return 1;
    default:
      return 0;
  }
}
