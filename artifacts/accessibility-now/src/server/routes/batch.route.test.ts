import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../../app/api/audit/batch/route";

test("POST /api/audit/batch rejects wholeSite without url", async () => {
  const res = await POST(
    new Request("http://localhost/api/audit/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wholeSite: true }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "validation_error");
});

test("POST /api/audit/batch rejects invalid wholeSite seed URL", async () => {
  const prev = process.env.SCAN_ALLOW_PRIVATE_URLS;
  process.env.SCAN_ALLOW_PRIVATE_URLS = "0";

  const res = await POST(
    new Request("http://localhost/api/audit/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wholeSite: true, url: "http://127.0.0.1" }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "invalid_url");

  if (prev === undefined) delete process.env.SCAN_ALLOW_PRIVATE_URLS;
  else process.env.SCAN_ALLOW_PRIVATE_URLS = prev;
});
