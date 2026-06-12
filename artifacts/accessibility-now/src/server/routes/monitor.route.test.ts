import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../../app/api/monitor/route";

test("POST /api/monitor rejects invalid email", async () => {
  const res = await POST(
    new Request("http://localhost/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com",
        email: "not-an-email",
        frequency: "weekly",
      }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "validation_error");
});

test("POST /api/monitor rejects invalid frequency", async () => {
  const res = await POST(
    new Request("http://localhost/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com",
        email: "test@example.com",
        frequency: "daily",
      }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "validation_error");
});

test("POST /api/monitor rejects missing URL", async () => {
  const res = await POST(
    new Request("http://localhost/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        frequency: "weekly",
      }),
    }),
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "validation_error");
});
