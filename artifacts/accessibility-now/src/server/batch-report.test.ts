import test from "node:test";
import assert from "node:assert/strict";
import type { AuditViolation } from "./scan";
import { aggregateCrossPageViolations, computeWeightedSiteScore } from "./batch-report";

function v(partial: Partial<AuditViolation> & Pick<AuditViolation, "id" | "description">): AuditViolation {
  return {
    wcagCriteria: "2.1",
    impact: "moderate",
    affectedElements: 1,
    topSelectors: [],
    ...partial,
  };
}

test("computeWeightedSiteScore returns 0 for empty input", () => {
  assert.equal(computeWeightedSiteScore([]), 0);
});

test("computeWeightedSiteScore single page", () => {
  assert.equal(computeWeightedSiteScore([{ score: 75, totalChecks: 40 }]), 75);
});

test("computeWeightedSiteScore weights by totalChecks", () => {
  const score = computeWeightedSiteScore([
    { score: 80, totalChecks: 10 },
    { score: 40, totalChecks: 2 },
  ]);
  assert.equal(score, Math.round((80 * 10 + 40 * 2) / 12));
});

test("computeWeightedSiteScore treats zero or missing totalChecks as 1", () => {
  assert.equal(
    computeWeightedSiteScore([
      { score: 100, totalChecks: 0 },
      { score: 0, totalChecks: 0 },
    ]),
    50,
  );
});

test("aggregateCrossPageViolations ignores error pages", () => {
  const out = aggregateCrossPageViolations([
    {
      url: "https://a.example/page",
      status: "error",
      violations: [v({ id: "image-alt", description: "x", affectedElements: 5 })],
    },
    {
      url: "https://b.example/",
      status: "success",
      violations: [v({ id: "color-contrast", description: "c", impact: "serious", affectedElements: 2 })],
    },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].id, "color-contrast");
});

test("aggregateCrossPageViolations merges same rule across URLs and sums elements", () => {
  const out = aggregateCrossPageViolations([
    {
      url: "https://a.example/",
      status: "success",
      violations: [v({ id: "duplicate-id", description: "d", affectedElements: 2 })],
    },
    {
      url: "https://a.example/other",
      status: "success",
      violations: [v({ id: "duplicate-id", description: "d", affectedElements: 3 })],
    },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].pageCount, 2);
  assert.equal(out[0].totalAffectedElements, 5);
  assert.deepEqual(out[0].affectedUrls.sort(), ["https://a.example/", "https://a.example/other"].sort());
});

test("aggregateCrossPageViolations sorts by impact before pageCount", () => {
  const out = aggregateCrossPageViolations([
    {
      url: "https://x.example/",
      status: "success",
      violations: [
        v({ id: "low", description: "low", impact: "minor", affectedElements: 1 }),
        v({ id: "high", description: "high", impact: "critical", affectedElements: 1 }),
      ],
    },
    {
      url: "https://y.example/",
      status: "success",
      violations: [v({ id: "mid", description: "mid", impact: "serious", affectedElements: 1 })],
    },
  ]);
  assert.deepEqual(
    out.map((r) => r.id),
    ["high", "mid", "low"],
  );
});
