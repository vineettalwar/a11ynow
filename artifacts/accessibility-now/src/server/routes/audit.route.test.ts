import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../../app/api/audit/route";

test("POST /api/audit rejects invalid URL payloads", async () => {
  const res = await POST(
    new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "" }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "invalid_url");
});

test("POST /api/audit rejects private network URLs when private scans are disabled", async () => {
  const prev = process.env.SCAN_ALLOW_PRIVATE_URLS;
  process.env.SCAN_ALLOW_PRIVATE_URLS = "0";

  const res = await POST(
    new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "http://127.0.0.1" }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "invalid_url");

  if (prev === undefined) delete process.env.SCAN_ALLOW_PRIVATE_URLS;
  else process.env.SCAN_ALLOW_PRIVATE_URLS = prev;
});
