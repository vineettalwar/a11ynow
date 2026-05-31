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

export const CHROMIUM_INSTALL_COMMAND =
  "pnpm --filter @workspace/api-server exec playwright install chromium" as const;

export class ChromiumNotInstalledError extends Error {
  readonly installCommand = CHROMIUM_INSTALL_COMMAND;

  constructor(cause?: unknown) {
    super(
      `Chromium browser not installed. Run: ${CHROMIUM_INSTALL_COMMAND}` +
        (process.platform === "linux" ? " (add --with-deps on Linux servers)" : ""),
    );
    this.name = "ChromiumNotInstalledError";
    if (cause !== undefined) this.cause = cause;
  }
}

function isMissingExecutableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("Executable doesn't exist") || msg.includes("ENOENT");
}

export async function launchChromiumWithRetry(options?: {
  attempts?: number;
  backoffMs?: number;
}): Promise<Browser> {
  const attempts = options?.attempts ?? 2;
  const backoffMs = options?.backoffMs ?? 400;
  let lastErr: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await chromium.launch({
        args: [...CHROMIUM_HEADLESS_LAUNCH_ARGS],
      });
    } catch (err) {
      lastErr = err;
      if (isMissingExecutableError(err)) {
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
  return chromiumReady;
}

/** Launch Chromium once at startup; does not throw (API stays up without browser). */
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
