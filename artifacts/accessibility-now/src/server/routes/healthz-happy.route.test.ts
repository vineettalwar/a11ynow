import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../../../app/api/healthz/route";

test("GET /api/healthz returns status and scanEngineReady", async () => {
  const res = await GET(new Request("http://localhost/api/healthz"));
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; scanEngineReady: boolean };
  assert.equal(body.status, "ok");
  assert.equal(typeof body.scanEngineReady, "boolean");
});
