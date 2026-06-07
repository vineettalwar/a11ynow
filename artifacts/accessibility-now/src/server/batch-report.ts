import type { AuditViolation } from "./scan";

export interface WeightedSiteScoreInput {
  score: number;
  totalChecks: number;
}

/**
 * Site-wide score: weighted average of per-page scores, each weighted by axe
 * `totalChecks` so pages with more auditable surface contribute proportionally more.
 */
export function computeWeightedSiteScore(pages: WeightedSiteScoreInput[]): number {
  if (pages.length === 0) return 0;
  const totalWeight = pages.reduce((sum, p) => sum + Math.max(1, p.totalChecks || 1), 0);
  if (totalWeight <= 0) return 0;
  const weighted = pages.reduce((sum, p) => sum + p.score * Math.max(1, p.totalChecks || 1), 0);
  return Math.round(weighted / totalWeight);
}

export interface CrossPageViolationReport {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: AuditViolation["impact"];
  pageCount: number;
  totalAffectedElements: number;
  affectedUrls: string[];
}

const IMPACT_RANK: Record<AuditViolation["impact"], number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

/**
 * Roll up axe violations across successful pages (same rule id), then sort by
 * severity, number of pages, and total affected elements.
 */
export function aggregateCrossPageViolations(
  pages: Array<{ url: string; status: "success" | "error"; violations: AuditViolation[] }>,
): CrossPageViolationReport[] {
  const violationMap = new Map<
    string,
    { violation: AuditViolation; pageUrls: string[]; totalElements: number }
  >();

  for (const page of pages) {
    if (page.status !== "success") continue;

    for (const v of page.violations) {
      const existing = violationMap.get(v.id);
      if (existing) {
        if (!existing.pageUrls.includes(page.url)) existing.pageUrls.push(page.url);
        existing.totalElements += v.affectedElements;
      } else {
        violationMap.set(v.id, {
          violation: v,
          pageUrls: [page.url],
          totalElements: v.affectedElements,
        });
      }
    }
  }

  return Array.from(violationMap.values())
    .map(({ violation, pageUrls, totalElements }) => ({
      id: violation.id,
      wcagCriteria: violation.wcagCriteria,
      description: violation.description,
      impact: violation.impact,
      pageCount: pageUrls.length,
      totalAffectedElements: totalElements,
      affectedUrls: pageUrls,
    }))
    .sort((a, b) => {
      const d = IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact];
      if (d !== 0) return d;
      if (b.pageCount !== a.pageCount) return b.pageCount - a.pageCount;
      return b.totalAffectedElements - a.totalAffectedElements;
    });
}
