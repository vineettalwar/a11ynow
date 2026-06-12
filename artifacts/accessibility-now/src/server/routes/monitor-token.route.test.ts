import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../../../app/api/monitor/[token]/route";

test("GET /api/monitor/:token rejects malformed token", async () => {
  const res = await GET(new Request("http://localhost/api/monitor/abc"), {
    params: Promise.resolve({ token: "abc" }),
  });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "invalid_token");
});

test("PATCH /api/monitor/:token rejects invalid action", async () => {
  const token = "b".repeat(48);
  const { PATCH } = await import("../../../app/api/monitor/[token]/route");
  const res = await PATCH(
    new Request(`http://localhost/api/monitor/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    }),
    { params: Promise.resolve({ token }) },
  );
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "validation_error");
});
