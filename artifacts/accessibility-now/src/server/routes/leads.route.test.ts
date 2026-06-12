import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../../app/api/leads/route";

test("POST /api/leads rejects invalid JSON", async () => {
  const res = await POST(
    new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "validation_error");
});

test("POST /api/leads rejects payloads missing required fields", async () => {
  const res = await POST(
    new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", email: "bad" }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "validation_error");
});

test("POST /api/leads rejects pricing leads without company", async () => {
  const res = await POST(
    new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "test@example.com",
        source: "pricing",
        service: "audit",
        message: "Need an audit",
      }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string; message: string };
  assert.equal(body.error, "validation_error");
  assert.match(body.message, /Company/);
});
