import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupByPour, getFixDifficultyLabel } from "./a11y-fix-pour.js";

describe("a11y-fix-pour", () => {
  it("groups violations by POUR principle", () => {
    const groups = groupByPour([
      {
        id: "color-contrast",
        wcagCriteria: "1.4.3 Contrast",
        description: "Low contrast",
        impact: "serious",
        affectedElements: 2,
      },
      {
        id: "button-name",
        wcagCriteria: "2.5.3 Label in Name",
        description: "Missing name",
        impact: "critical",
        affectedElements: 1,
      },
      {
        id: "html-has-lang",
        wcagCriteria: "3.1.1 Language",
        description: "Missing lang",
        impact: "serious",
        affectedElements: 1,
      },
    ]);
    assert.ok(groups.Perceivable.some((v) => v.id === "color-contrast"));
    assert.ok(groups.Operable.some((v) => v.id === "button-name"));
    assert.ok(groups.Understandable.some((v) => v.id === "html-has-lang"));
  });

  it("labels fix difficulty", () => {
    assert.equal(getFixDifficultyLabel("color-contrast"), "Quick win");
    assert.equal(getFixDifficultyLabel("focus-order-semantics"), "Expert");
    assert.equal(getFixDifficultyLabel("unknown-rule"), "Moderate");
  });
});
