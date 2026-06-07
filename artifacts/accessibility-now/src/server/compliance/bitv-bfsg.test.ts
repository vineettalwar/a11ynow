import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildComplianceReport, enrichViolationsWithCompliance } from "./bitv-bfsg";
import type { AuditViolation } from "../scan";

describe("buildComplianceReport", () => {
  it("marks non_conformant when violations exist", () => {
    const violations: AuditViolation[] = [
      {
        id: "color-contrast",
        wcagCriteria: "1.4.3",
        description: "Elements must have sufficient color contrast",
        impact: "serious",
        affectedElements: 2,
        topSelectors: [".btn"],
      },
    ];
    const report = buildComplianceReport(violations, []);
    assert.equal(report.overallStatus, "non_conformant");
    assert.equal(report.clauseFindings.length, 1);
    assert.equal(report.clauseFindings[0]!.en301549Clause, "9.1.1.4.3");
    assert.match(report.summaryDe, /Mängel/);
  });

  it("needs manual review when no violations", () => {
    const report = buildComplianceReport([], [
      { id: "supplemental-lang", titleDe: "Sprache", titleEn: "Lang", status: "pass", description: "ok", impact: "minor" },
    ]);
    assert.equal(report.overallStatus, "needs_manual_review");
    assert.ok(report.manualReviewRequired.length > 0);
  });
});

describe("enrichViolationsWithCompliance", () => {
  it("adds BITV fields to violations", () => {
    const [v] = enrichViolationsWithCompliance([
      {
        id: "image-alt",
        wcagCriteria: "1.1.1",
        description: "Images must have alternate text",
        impact: "critical",
        affectedElements: 1,
        topSelectors: ["img"],
      },
    ]);
    assert.equal(v!.en301549Clause, "9.1.1.1.1");
    assert.ok(v!.bitvSection);
    assert.ok(v!.titleDe);
  });
});
