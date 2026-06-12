import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../../../app/api/healthz/route";

test("GET /api/healthz returns health payload", async () => {
  const res = await GET();
  assert.equal(res.status, 200);
  const body = (await res.json()) as {
    status: string;
    scanEngineReady: boolean;
    scansInFlight: number;
    scansQueued: number;
  };
  assert.ok(["ok", "draining"].includes(body.status));
  assert.equal(typeof body.scanEngineReady, "boolean");
  assert.equal(typeof body.scansInFlight, "number");
  assert.equal(typeof body.scansQueued, "number");
});
