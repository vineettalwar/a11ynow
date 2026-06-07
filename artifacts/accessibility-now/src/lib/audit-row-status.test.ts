import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuditResult } from "@workspace/api-client-react";
import {
  auditRefetchIntervalMs,
  auditRowIsPending,
  auditRowLooksUsable,
  mergeAuditRow,
} from "./audit-row-status";

function row(partial: Partial<AuditResult> & Pick<AuditResult, "auditId">): AuditResult {
  return {
    url: "https://example.com/",
    scannedAt: new Date().toISOString(),
    score: 0,
    level: "moderate",
    totalViolations: 0,
    criticalViolations: 0,
    seriousViolations: 0,
    violations: [],
    passedChecks: 0,
    totalChecks: 0,
    scanEngine: "unknown",
    ...partial,
  };
}

describe("audit-row-status", () => {
  it("treats pending rows as not usable", () => {
    const pending = row({
      auditId: "a1",
      scanMetadata: { pending: true, profile: "strict", multiViewport: true, viewportsUsed: [] },
    });
    assert.equal(auditRowIsPending(pending), true);
    assert.equal(auditRowLooksUsable(pending), false);
  });

  it("polls while pending and stops when complete", () => {
    const pending = row({
      auditId: "a1",
      scanMetadata: { pending: true, profile: "strict", multiViewport: true, viewportsUsed: [] },
    });
    const complete = row({
      auditId: "a1",
      totalChecks: 35,
      passedChecks: 31,
      totalViolations: 6,
      violations: [{ id: "region" } as AuditResult["violations"][number]],
      scanMetadata: { pending: false, profile: "strict", multiViewport: true, viewportsUsed: [] },
    });
    assert.equal(auditRefetchIntervalMs(undefined), 1000);
    assert.equal(auditRefetchIntervalMs(pending), 1000);
    assert.equal(auditRefetchIntervalMs(complete), false);
  });

  it("mergeAuditRow prefers completed GET over pending POST", () => {
    const pendingPost = row({
      auditId: "a1",
      scanMetadata: { pending: true, profile: "strict", multiViewport: true, viewportsUsed: [] },
    });
    const completeGet = row({
      auditId: "a1",
      totalChecks: 10,
      totalViolations: 2,
      violations: [{ id: "color-contrast" } as AuditResult["violations"][number]],
      scanMetadata: { pending: false, profile: "strict", multiViewport: true, viewportsUsed: [] },
    });
    assert.equal(mergeAuditRow("a1", completeGet, pendingPost)?.totalViolations, 2);
  });
});
