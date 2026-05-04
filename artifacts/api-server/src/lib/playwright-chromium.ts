import { chromium, type Browser } from "playwright";

/**
 * Headless Chromium flags shared by audits, batch scans, page screenshots, and focus-order.
 * Keep in one place so server / container hardening stays consistent.
 */
export const CHROMIUM_HEADLESS_LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
] as const;

export async function launchChromiumHeadless(): Promise<Browser> {
  return chromium.launch({
    args: [...CHROMIUM_HEADLESS_LAUNCH_ARGS],
  });
}
