import type { AuditViolation } from "@workspace/api-client-react";
import type { PourPrincipleName } from "@/data/pour-principles";
import { getViolationPrinciple, groupViolationsByPour } from "@/lib/pour-mapper";
import { getHumanContextForViolation } from "@/lib/violation-human-context";

export type FixDifficulty = "quick_win" | "moderate" | "expert";

export type A11yFixJourneyStep = "choose" | "scan" | "plan" | "act";

export const A11Y_FIX_JOURNEY_STEPS: { id: A11yFixJourneyStep; label: string }[] = [
  { id: "choose", label: "Choose" },
  { id: "scan", label: "Scan" },
  { id: "plan", label: "Plan" },
  { id: "act", label: "Act" },
];

export const A11Y_FIX_PLAN_STORAGE_PREFIX = "a11y_fix_plan_";

export function getPlanStorageKey(auditId: string): string {
  return `${A11Y_FIX_PLAN_STORAGE_PREFIX}${auditId}`;
}

export interface FixActionItem {
  id: string;
  ruleId: string;
  title: string;
  principle: PourPrincipleName;
  difficulty: FixDifficulty;
  impact: AuditViolation["impact"];
  help?: string;
  helpUrl?: string;
  bitvSection?: string;
  wcagCriteria: string;
  plainLead: string;
  relatedToolPath?: string;
  affectedElements: number;
}

const DIFFICULTY_ORDER: Record<FixDifficulty, number> = {
  quick_win: 0,
  moderate: 1,
  expert: 2,
};

const IMPACT_ORDER: Record<string, number> = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1,
};

export function buildFixActionPlan(violations: AuditViolation[]): FixActionItem[] {
  return [...violations]
    .sort((a, b) => {
      const d = DIFFICULTY_ORDER[getFixDifficulty(a.id)] - DIFFICULTY_ORDER[getFixDifficulty(b.id)];
      if (d !== 0) return d;
      const i = (IMPACT_ORDER[b.impact] ?? 0) - (IMPACT_ORDER[a.impact] ?? 0);
      if (i !== 0) return i;
      return (b.affectedElements ?? 0) - (a.affectedElements ?? 0);
    })
    .map((v) => {
      const human = getHumanContextForViolation(v);
      return {
        id: `${v.id}:${v.wcagCriteria}`,
        ruleId: v.id,
        title: v.titleDe ?? v.description,
        principle: getViolationPrinciple(v),
        difficulty: getFixDifficulty(v.id),
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        bitvSection: v.bitvSection,
        wcagCriteria: v.wcagCriteria,
        plainLead: human.plainLead,
        relatedToolPath: human.relatedToolPath,
        affectedElements: v.affectedElements ?? 0,
      };
    });
}

export function loadPlanProgress(auditId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getPlanStorageKey(auditId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function savePlanProgress(auditId: string, completed: Set<string>): void {
  try {
    localStorage.setItem(getPlanStorageKey(auditId), JSON.stringify([...completed]));
  } catch {
    // localStorage may be unavailable
  }
}

export function intentContactHref(
  intent: A11yFixIntent,
  opts: { url?: string; auditId?: string },
): string {
  const service = intent === "monitor" ? "monitoring" : intent === "engineers" ? "remediation" : "audit";
  const params = new URLSearchParams({ service, source: "a11y-fix" });
  if (opts.url) params.set("url", opts.url);
  if (opts.auditId) params.set("auditId", opts.auditId);
  return `/contact?${params.toString()}`;
}

export type A11yFixIntent = "self" | "engineers" | "monitor";

export const A11Y_FIX_INTENTS: { id: A11yFixIntent; label: string; description: string }[] = [
  {
    id: "self",
    label: "Fix it myself",
    description: "Get a POUR-grouped action plan with step-by-step guidance for your team.",
  },
  {
    id: "engineers",
    label: "Ship fixes for me",
    description: "Our engineers open PRs against your repo — scoped from this scan.",
  },
  {
    id: "monitor",
    label: "Stay compliant",
    description: "Baseline scan now, then automated re-scans and regression alerts.",
  },
];

const QUICK_WIN_RULES = new Set([
  "color-contrast",
  "image-alt",
  "input-image-alt",
  "object-alt",
  "svg-img-alt",
  "area-alt",
  "role-img-alt",
  "html-has-lang",
  "document-title",
  "meta-viewport",
  "page-has-heading-one",
  "bypass",
  "skip-link",
  "frame-title",
  "link-name",
  "button-name",
  "label",
  "duplicate-id",
  "duplicate-id-active",
  "duplicate-id-aria",
]);

const EXPERT_RULES = new Set([
  "focus-order-semantics",
  "scrollable-region-focusable",
  "nested-interactive",
  "aria-dialog-name",
  "aria-hidden-focus",
  "aria-input-field-name",
  "aria-toggle-field-name",
  "aria-tooltip-name",
  "aria-meter-name",
  "aria-progressbar-name",
  "aria-treeitem-name",
  "aria-command-name",
  "aria-roledescription",
  "keyboard",
  "focus-trap",
]);

export function getFixDifficulty(ruleId: string): FixDifficulty {
  if (QUICK_WIN_RULES.has(ruleId)) return "quick_win";
  if (EXPERT_RULES.has(ruleId)) return "expert";
  return "moderate";
}

export function difficultyLabel(d: FixDifficulty): string {
  switch (d) {
    case "quick_win":
      return "Quick win";
    case "moderate":
      return "Moderate";
    case "expert":
      return "Expert needed";
  }
}

export function difficultyBadgeClass(d: FixDifficulty): string {
  switch (d) {
    case "quick_win":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "moderate":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "expert":
      return "bg-rose-50 text-rose-700 border-rose-200";
  }
}

export interface PourSummary {
  name: PourPrincipleName;
  violationCount: number;
  affectedElements: number;
  quickWins: number;
  moderate: number;
  expert: number;
}

export function summarizePourGroups(violations: AuditViolation[]): PourSummary[] {
  const groups = groupViolationsByPour(violations);
  return (Object.keys(groups) as PourPrincipleName[]).map((name) => {
    const items = groups[name];
    let quickWins = 0;
    let moderate = 0;
    let expert = 0;
    let affectedElements = 0;
    for (const v of items) {
      affectedElements += v.affectedElements ?? 0;
      const d = getFixDifficulty(v.id);
      if (d === "quick_win") quickWins += 1;
      else if (d === "moderate") moderate += 1;
      else expert += 1;
    }
    return {
      name,
      violationCount: items.length,
      affectedElements,
      quickWins,
      moderate,
      expert,
    };
  });
}

export function countByDifficulty(violations: AuditViolation[]): Record<FixDifficulty, number> {
  const counts: Record<FixDifficulty, number> = { quick_win: 0, moderate: 0, expert: 0 };
  for (const v of violations) {
    counts[getFixDifficulty(v.id)] += 1;
  }
  return counts;
}

/** Suggested next service based on scan shape and user intent. */
export function recommendedUpsell(
  violations: AuditViolation[],
  intent: A11yFixIntent,
): { href: string; title: string; body: string; cta: string } {
  const { expert } = countByDifficulty(violations);
  const hasExpert = expert >= 3;

  if (intent === "monitor") {
    return {
      href: "/contact?service=monitoring",
      title: "Set up compliance monitoring",
      body: "Weekly or monthly re-scans, regression alerts, and quarterly manual spot-checks — so fixes stay shipped.",
      cta: "Discuss monitoring →",
    };
  }

  if (intent === "engineers" || hasExpert) {
    return {
      href: "/contact?service=remediation",
      title: "Let our engineers ship the fixes",
      body: "Sprint-based remediation with PRs citing WCAG criteria. Typical sprint: 15–30 issues resolved in two weeks.",
      cta: "Book remediation scoping →",
    };
  }

  return {
    href: "/contact?service=audit",
    title: "Validate with a manual audit",
    body: "Automated scans catch roughly 30% of WCAG issues. A manual audit covers keyboard, screen readers, and cognitive gaps.",
    cta: "Book a manual audit →",
  };
}
