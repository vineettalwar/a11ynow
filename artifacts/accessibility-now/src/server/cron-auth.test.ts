import assert from "node:assert/strict";
import test from "node:test";
import { verifyCronSecret } from "./cron-auth";

test("verifyCronSecret allows requests when secret unset in non-production", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.CRON_SECRET;
  process.env.NODE_ENV = "development";
  delete process.env.CRON_SECRET;

  const result = verifyCronSecret(new Request("http://localhost/api/cron/monitoring"));
  assert.equal(result.ok, true);

  process.env.NODE_ENV = prevEnv;
  if (prevSecret) process.env.CRON_SECRET = prevSecret;
});

test("verifyCronSecret rejects when secret unset in production", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.CRON_SECRET;
  process.env.NODE_ENV = "production";
  delete process.env.CRON_SECRET;

  const result = verifyCronSecret(new Request("http://localhost/api/cron/monitoring"));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.message, /CRON_SECRET/);
  }

  process.env.NODE_ENV = prevEnv;
  if (prevSecret) process.env.CRON_SECRET = prevSecret;
});

test("verifyCronSecret requires bearer token when secret is set", () => {
  const prevSecret = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";

  const unauthorized = verifyCronSecret(new Request("http://localhost/api/cron/monitoring"));
  assert.equal(unauthorized.ok, false);

  const authorized = verifyCronSecret(
    new Request("http://localhost/api/cron/monitoring", {
      headers: { authorization: "Bearer test-secret" },
    }),
  );
  assert.equal(authorized.ok, true);

  if (prevSecret) process.env.CRON_SECRET = prevSecret;
  else delete process.env.CRON_SECRET;
});
