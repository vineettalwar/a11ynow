import test from "node:test";
import assert from "node:assert/strict";
import {
  ScanBudget,
  ScanTimeoutError,
  computeScanBudgetMs,
  scoreToLevel,
  validateScanUrl,
  PRIVATE_IP_RE,
} from "./scan";
import { ChromiumNotInstalledError } from "./playwright-chromium";

test("scoreToLevel maps thresholds", () => {
  assert.equal(scoreToLevel(0), "critical");
  assert.equal(scoreToLevel(19), "critical");
  assert.equal(scoreToLevel(20), "poor");
  assert.equal(scoreToLevel(79), "good");
  assert.equal(scoreToLevel(80), "excellent");
  assert.equal(scoreToLevel(100), "excellent");
});

test("computeScanBudgetMs adds multi-viewport and strict extras", () => {
  const base = computeScanBudgetMs({ multiViewport: false, profile: "default" });
  const multi = computeScanBudgetMs({ multiViewport: true, profile: "default" });
  const strict = computeScanBudgetMs({ multiViewport: false, profile: "strict" });
  assert.ok(multi > base);
  assert.ok(strict > base);
});

test("ScanBudget navigation and page load settle scale with remaining time", () => {
  const budget = new ScanBudget(100_000);
  assert.ok(budget.navigationTimeoutMs() > 40_000);
  assert.equal(budget.pageLoadSettleTimeoutMs(), 2_500);
  assert.equal(budget.skipElementScreenshots(), false);
  assert.equal(budget.canRunExtraViewport(), true);
});

test("ScanBudget exhaust throws ScanTimeoutError", () => {
  const budget = new ScanBudget(0);
  assert.throws(() => budget.assertRemaining("test"), ScanTimeoutError);
  assert.equal(budget.pageLoadSettleTimeoutMs(), 0);
  assert.equal(budget.skipElementScreenshots(), true);
});

test("validateScanUrl rejects invalid protocol", async () => {
  const result = await validateScanUrl("ftp://example.com", false);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /http/i);
  }
});

test("validateScanUrl rejects malformed URL", async () => {
  const result = await validateScanUrl("not-a-url", false);
  assert.equal(result.ok, false);
});

test("validateScanUrl rejects localhost when private targets disallowed", async () => {
  const result = await validateScanUrl("http://localhost:8080", false);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /internal/i);
  }
});

test("validateScanUrl allows localhost when private targets allowed", async () => {
  const result = await validateScanUrl("http://localhost:8080", true);
  assert.equal(result.ok, true);
});

test("PRIVATE_IP_RE matches RFC1918 literals", () => {
  assert.match("192.168.1.1", PRIVATE_IP_RE);
  assert.match("10.0.0.5", PRIVATE_IP_RE);
  assert.doesNotMatch("8.8.8.8", PRIVATE_IP_RE);
});

test("ChromiumNotInstalledError includes install command", () => {
  const err = new ChromiumNotInstalledError();
  assert.equal(err.name, "ChromiumNotInstalledError");
  assert.match(err.message, /playwright install chromium/);
  assert.match(err.installCommand, /playwright install chromium/);
});
