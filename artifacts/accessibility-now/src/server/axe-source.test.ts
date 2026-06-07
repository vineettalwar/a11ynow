import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAxeSource } from "./axe-source.js";

describe("getAxeSource", () => {
  it("returns browser-safe axe-core source with a typeof module guard", () => {
    const source = getAxeSource();
    assert.match(source, /^(\(function axeFunction|function axeFunction)/);
    assert.match(source, /typeof module === ['"]undefined['"]/);
  });
});
