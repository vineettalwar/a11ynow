import { createRequire } from "node:module";

/**
 * Browser-safe axe-core source for Playwright injection.
 *
 * Turbopack bundles a top-level `axe-core` import and breaks the UMD `module`
 * guard, so `AxeBuilder`'s default source throws `ReferenceError: module is not
 * defined` inside `page.evaluate`. Resolve the published package via Node instead.
 */
let cachedAxeSource: string | undefined;

export function getAxeSource(): string {
  if (cachedAxeSource) return cachedAxeSource;

  const require = createRequire(import.meta.url);
  const axe = require("axe-core") as { source?: string };
  if (!axe.source) {
    throw new Error("Failed to load axe-core source for Playwright injection");
  }

  cachedAxeSource = axe.source;
  return cachedAxeSource;
}
