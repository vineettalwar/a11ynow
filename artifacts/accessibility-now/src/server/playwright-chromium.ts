import type { Browser } from "playwright";
import { getBindings } from "./cloudflare";

export const CHROMIUM_HEADLESS_LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
] as const;

export const CHROMIUM_INSTALL_COMMAND =
  "pnpm exec playwright install chromium" as const;

export class ChromiumNotInstalledError extends Error {
  readonly installCommand = CHROMIUM_INSTALL_COMMAND;

  constructor(cause?: unknown) {
    super(
      `Chromium browser not installed. Run: ${CHROMIUM_INSTALL_COMMAND}` +
        (typeof process !== "undefined" && process.platform === "linux"
          ? " (add --with-deps on Linux servers)"
          : ""),
    );
    this.name = "ChromiumNotInstalledError";
    if (cause !== undefined) this.cause = cause;
  }
}

function isMissingExecutableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("Executable doesn't exist") || msg.includes("ENOENT");
}

async function launchCloudflareBrowser(): Promise<Browser> {
  const browserBinding = getBindings().BROWSER;
  if (!browserBinding) {
    throw new ChromiumNotInstalledError(new Error("BROWSER binding not configured"));
  }
  const { launch } = await import(
    /* webpackIgnore: true */ "@cloudflare/playwright"
  );
  return launch(browserBinding) as unknown as Browser;
}

async function launchLocalBrowser(): Promise<Browser> {
  const { chromium } = await import("playwright");
  return chromium.launch({
    args: [...CHROMIUM_HEADLESS_LAUNCH_ARGS],
  });
}

export async function launchChromiumWithRetry(options?: {
  attempts?: number;
  backoffMs?: number;
}): Promise<Browser> {
  const attempts = options?.attempts ?? 2;
  const backoffMs = options?.backoffMs ?? 400;
  const useCloudflare = Boolean(getBindings().BROWSER) && process.env.CF_PAGES === "1";
  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      if (useCloudflare) {
        return await launchCloudflareBrowser();
      }
      return await launchLocalBrowser();
    } catch (err) {
      lastErr = err;
      if (!useCloudflare && isMissingExecutableError(err)) {
        throw new ChromiumNotInstalledError(err);
      }
      if (i < attempts - 1) {
        await new Promise<void>((r) => setTimeout(r, backoffMs * (i + 1)));
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

let chromiumReady = false;

export function isChromiumReady(): boolean {
  if (getBindings().BROWSER) return true;
  return chromiumReady;
}

export async function probeChromium(): Promise<boolean> {
  try {
    const browser = await launchChromiumWithRetry({ attempts: 1 });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("about:blank", { timeout: 10_000 });
    await context.close();
    await browser.close();
    chromiumReady = true;
    return true;
  } catch {
    chromiumReady = false;
    return false;
  }
}

export async function launchChromiumHeadless(): Promise<Browser> {
  return launchChromiumWithRetry();
}

/** @deprecated Use launchChromiumWithRetry — batch scans share one browser instance. */
export async function launchChromiumForAudit(): Promise<Browser> {
  return launchChromiumWithRetry();
}
