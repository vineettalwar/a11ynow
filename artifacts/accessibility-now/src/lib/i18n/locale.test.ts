import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  localeFromPathname,
  localizedPath,
  stripLocalePrefix,
  switchLocalePath,
} from "./locale.ts";

describe("locale path helpers", () => {
  it("detects German locale from /de prefix", () => {
    assert.equal(localeFromPathname("/de"), "de");
    assert.equal(localeFromPathname("/de/pricing"), "de");
    assert.equal(localeFromPathname("/pricing"), "en");
  });

  it("strips and adds locale prefixes", () => {
    assert.equal(stripLocalePrefix("/de/pricing"), "/pricing");
    assert.equal(localizedPath("/pricing", "de"), "/de/pricing");
    assert.equal(localizedPath("/pricing", "en"), "/pricing");
    assert.equal(localizedPath("/", "de"), "/de");
  });

  it("switches locale while preserving path", () => {
    assert.equal(switchLocalePath("/de/pricing", "en"), "/pricing");
    assert.equal(switchLocalePath("/pricing", "de"), "/de/pricing");
    assert.equal(switchLocalePath("/de", "en"), "/");
    assert.equal(switchLocalePath("/", "de"), "/de");
  });
});
