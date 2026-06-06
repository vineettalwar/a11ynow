/** Server-side POUR mapping for A11y Fix PDF (mirrors frontend pour-mapper). */

export type PourPrincipleName = "Perceivable" | "Operable" | "Understandable" | "Robust";

export const POUR_ORDER: PourPrincipleName[] = [
  "Perceivable",
  "Operable",
  "Understandable",
  "Robust",
];

export interface PourViolationLike {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
  help?: string;
  bitvSection?: string;
  titleDe?: string;
}

const RULE_TO_PRINCIPLE: Record<string, PourPrincipleName> = {
  "color-contrast": "Perceivable",
  "image-alt": "Perceivable",
  "html-has-lang": "Understandable",
  "document-title": "Understandable",
  label: "Understandable",
  "button-name": "Operable",
  "link-name": "Operable",
  bypass: "Operable",
  "skip-link": "Operable",
  "focus-order-semantics": "Operable",
};

function principleFromWcagNumber(scNumber: string): PourPrincipleName {
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

export function getViolationPrinciple(v: PourViolationLike): PourPrincipleName {
  const scMatch = v.wcagCriteria?.match(/(\d+\.\d+(?:\.\d+)?)/);
  if (scMatch) return principleFromWcagNumber(scMatch[1]);
  return RULE_TO_PRINCIPLE[v.id] ?? "Robust";
}

const QUICK_WIN = new Set([
  "color-contrast",
  "image-alt",
  "html-has-lang",
  "document-title",
  "label",
  "link-name",
  "button-name",
  "skip-link",
  "bypass",
]);

const EXPERT = new Set(["focus-order-semantics", "keyboard", "nested-interactive"]);

export function getFixDifficultyLabel(ruleId: string): string {
  if (QUICK_WIN.has(ruleId)) return "Quick win";
  if (EXPERT.has(ruleId)) return "Expert";
  return "Moderate";
}

export function groupByPour<T extends PourViolationLike>(
  violations: T[],
): Record<PourPrincipleName, T[]> {
  const groups: Record<PourPrincipleName, T[]> = {
    Perceivable: [],
    Operable: [],
    Understandable: [],
    Robust: [],
  };
  for (const v of violations) {
    groups[getViolationPrinciple(v)].push(v);
  }
  const rank = { critical: 4, serious: 3, moderate: 2, minor: 1 };
  for (const name of POUR_ORDER) {
    groups[name].sort(
      (a, b) => (rank[b.impact] ?? 0) - (rank[a.impact] ?? 0),
    );
  }
  return groups;
}
