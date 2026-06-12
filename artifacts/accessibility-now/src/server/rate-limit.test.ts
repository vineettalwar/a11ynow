import assert from "node:assert/strict";
import test from "node:test";
import { enforceRateLimit } from "../rate-limit";

test("enforceRateLimit allows requests under the limit locally", async () => {
  const req = new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
  const first = await enforceRateLimit(req, { namespace: "test-local", limit: 5 });
  assert.equal(first, null);
});

test("enforceRateLimit returns 429 when limit exceeded locally", async () => {
  const ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
  const opts = { namespace: `test-burst-${Date.now()}`, limit: 2 };

  for (let i = 0; i < 2; i++) {
    const allowed = await enforceRateLimit(
      new Request("http://localhost/api/test", { headers: { "x-forwarded-for": ip } }),
      opts,
    );
    assert.equal(allowed, null);
  }

  const blocked = await enforceRateLimit(
    new Request("http://localhost/api/test", { headers: { "x-forwarded-for": ip } }),
    opts,
  );
  assert.ok(blocked);
  assert.equal(blocked?.status, 429);
  const body = (await blocked!.json()) as { error: string };
  assert.equal(body.error, "rate_limited");
});
