import type { Page } from "playwright";

function isTransientNavError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Timeout") ||
    msg.includes("timeout") ||
    msg.includes("net::ERR") ||
    msg.includes("NS_ERROR") ||
    msg.includes("Navigation failed")
  );
}

/** Navigate for tool routes (screenshots, focus order). Prefer domcontentloaded over networkidle. */
export async function gotoPageForCapture(
  page: Page,
  url: string,
  timeoutMs: number,
): Promise<void> {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  } catch (err) {
    if (!isTransientNavError(err)) throw err;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
  }

  await page.waitForLoadState("networkidle", { timeout: Math.min(8_000, timeoutMs) }).catch(() => undefined);
  await new Promise<void>((r) => setTimeout(r, 400));
}
