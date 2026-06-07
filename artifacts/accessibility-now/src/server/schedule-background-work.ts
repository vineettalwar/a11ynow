/**
 * Keep async work alive after the HTTP response (Cloudflare Workers) or fire-and-forget locally.
 */
export function scheduleBackgroundWork(task: () => Promise<void>): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare") as typeof import("@opennextjs/cloudflare");
    const ctx = getCloudflareContext() as { ctx?: { waitUntil?: (p: Promise<unknown>) => void } };
    if (typeof ctx.ctx?.waitUntil === "function") {
      ctx.ctx.waitUntil(task());
      return;
    }
  } catch {
    /* local Next dev — no Cloudflare context */
  }
  void task();
}
