import assert from "node:assert/strict";
import test from "node:test";
import { batchJobToProgress, type BatchJobRecord } from "./batch-job-store";

function sampleJob(overrides: Partial<BatchJobRecord>): BatchJobRecord {
  const now = new Date();
  return {
    batchJobId: "job-1",
    status: "pending",
    discoverySource: null,
    scanProfile: "default",
    multiViewport: false,
    urlsJson: ["https://example.com/"],
    progressJson: [{ url: "https://example.com/", status: "queued" }],
    resultJson: null,
    errorMessage: null,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  };
}

test("batchJobToProgress marks whole-site seed jobs as discovering", () => {
  const progress = batchJobToProgress(sampleJob({ discoverySource: null, status: "pending" }));
  assert.equal(progress.discovering, true);
  assert.equal(progress.urlStates.length, 1);
});

test("batchJobToProgress keeps discovering while worker runs discovery", () => {
  const progress = batchJobToProgress(sampleJob({ discoverySource: null, status: "running" }));
  assert.equal(progress.discovering, true);
});

test("batchJobToProgress stops discovering after URLs are resolved", () => {
  const progress = batchJobToProgress(
    sampleJob({
      discoverySource: "sitemap",
      status: "running",
      urlsJson: ["https://example.com/", "https://example.com/about"],
      progressJson: [
        { url: "https://example.com/", status: "done", score: 90, pageScreenshot: "ref-1" },
        { url: "https://example.com/about", status: "scanning" },
      ],
    }),
  );
  assert.equal(progress.discovering, false);
  assert.equal(progress.discoverySource, "sitemap");
  assert.equal(progress.urlStates[0]?.pageScreenshot, "ref-1");
});
