import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AuditViolation } from "@workspace/api-client-react";
import { buildFixActionPlan, getFixDifficulty } from "./a11y-fix";

const violation = (partial: Partial<AuditViolation> & Pick<AuditViolation, "id">): AuditViolation => ({
  id: partial.id,
  wcagCriteria: partial.wcagCriteria ?? "1.1.1",
  description: partial.description ?? "Test",
  impact: partial.impact ?? "moderate",
  affectedElements: partial.affectedElements ?? 1,
  topSelectors: partial.topSelectors ?? [],
  ...partial,
});

describe("buildFixActionPlan", () => {
  it("orders quick wins before expert rules", () => {
    const plan = buildFixActionPlan([
      violation({ id: "keyboard", impact: "critical" }),
      violation({ id: "color-contrast", impact: "serious" }),
    ]);
    assert.equal(plan[0]?.ruleId, "color-contrast");
    assert.equal(plan[1]?.ruleId, "keyboard");
  });

  it("classifies known quick-win rules", () => {
    assert.equal(getFixDifficulty("image-alt"), "quick_win");
    assert.equal(getFixDifficulty("focus-order-semantics"), "expert");
  });
});
