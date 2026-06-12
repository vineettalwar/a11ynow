import assert from "node:assert/strict";
import test from "node:test";
import { progressFromAccepted } from "./batch-scan-sse";

test("progressFromAccepted marks whole-site seed response as discovering", () => {
  const progress = progressFromAccepted({
    batchJobId: "job-1",
    status: "pending",
    urlCount: 1,
    urls: ["https://example.com/"],
  });
  assert.ok(progress);
  assert.equal(progress.discovering, true);
  assert.equal(progress.urlStates.length, 1);
  assert.equal(progress.urlStates[0]?.status, "queued");
});

test("progressFromAccepted does not mark explicit multi-url batches as discovering", () => {
  const progress = progressFromAccepted({
    batchJobId: "job-2",
    status: "pending",
    discoverySource: "single",
    urlCount: 2,
    urls: ["https://example.com/a", "https://example.com/b"],
  });
  assert.ok(progress);
  assert.equal(progress.discovering, false);
  assert.equal(progress.discoverySource, "single");
});
