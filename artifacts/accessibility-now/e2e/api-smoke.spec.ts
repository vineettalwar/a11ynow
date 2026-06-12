import { test, expect } from "@playwright/test";

test.describe("API smoke paths", () => {
  test("healthz returns ok with scanEngineReady", async ({ request }) => {
    const res = await request.get("/api/healthz");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { status: string; scanEngineReady: boolean };
    expect(body.status).toBe("ok");
    expect(typeof body.scanEngineReady).toBe("boolean");
  });

  test("monitor signup validates email", async ({ request }) => {
    const res = await request.post("/api/monitor", {
      data: {
        url: "https://example.com",
        email: "not-an-email",
        frequency: "weekly",
      },
    });
    expect(res.status()).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("validation_error");
  });

  test("monitor dashboard rejects malformed token", async ({ request }) => {
    const res = await request.get("/api/monitor/abc");
    expect(res.status()).toBe(400);
  });
});
