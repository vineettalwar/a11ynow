import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getArtifactStorage,
  isR2ArtifactRef,
  persistViolationsArtifact,
  R2_ARTIFACT_PREFIX,
  resolveStoredViolations,
  violationsArtifactKey,
} from "./storage";

describe("artifact storage refs", () => {
  it("detects R2 artifact prefixes", () => {
    assert.equal(isR2ArtifactRef(`${R2_ARTIFACT_PREFIX}audits/id/page.jpg`), true);
    assert.equal(isR2ArtifactRef("data:image/jpeg;base64,abc"), false);
    assert.equal(isR2ArtifactRef(null), false);
  });
});

describe("violations artifact storage", () => {
  it("keeps violations inline when R2 is not bound", async () => {
    const sample = [
      {
        id: "color-contrast",
        wcagCriteria: "1.4.3",
        description: "Elements must have sufficient color contrast",
        impact: "serious" as const,
        affectedElements: 1,
        topSelectors: ["body"],
      },
    ];
    const persisted = await persistViolationsArtifact({ kind: "audit", id: "audit-1" }, sample);
    assert.deepEqual(persisted.violations, sample);
    assert.equal(persisted.violationsRef, null);
  });

  it("loads violations JSON from an artifact ref via inline storage fallback", async () => {
    const sample = [
      {
        id: "region",
        wcagCriteria: "1.3.1",
        description: "Page must have landmarks",
        impact: "moderate" as const,
        affectedElements: 1,
        topSelectors: ["html"],
      },
    ];
    const key = violationsArtifactKey({ kind: "audit", id: "audit-2" });
    await getArtifactStorage().put(key, JSON.stringify(sample), "application/json");
    const resolved = await resolveStoredViolations([], `${R2_ARTIFACT_PREFIX}${key}`);
    assert.deepEqual(resolved, sample);
  });
});
