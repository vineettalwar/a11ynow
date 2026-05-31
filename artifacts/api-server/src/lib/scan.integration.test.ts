import test from "node:test";
import assert from "node:assert/strict";
import { runAccessibilityScan } from "./scan";

const integrationEnabled = process.env.SCAN_INTEGRATION === "1";

test(
  "integration: example.com returns playwright engine",
  { skip: !integrationEnabled },
  async () => {
    const result = await runAccessibilityScan("https://example.com", {
      collectRuntimeDiagnostics: false,
    });
    assert.equal(result.scanEngine, "playwright");
    assert.ok(result.totalChecks > 0);
    assert.ok(result.score >= 0 && result.score <= 100);
  },
);
