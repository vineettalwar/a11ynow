import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../../../app/api/cron/monitoring/route";

test("GET /api/cron/monitoring rejects unauthorized requests in production", async () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.CRON_SECRET;
  process.env.NODE_ENV = "production";
  delete process.env.CRON_SECRET;

  const res = await GET(new Request("http://localhost/api/cron/monitoring"));
  assert.equal(res.status, 401);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "unauthorized");

  process.env.NODE_ENV = prevEnv;
  if (prevSecret) process.env.CRON_SECRET = prevSecret;
});
