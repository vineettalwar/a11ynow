import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { discoverSiteUrls } from "./site-discovery";

describe("discoverSiteUrls", () => {
  it("returns at least the seed URL for invalid hosts in test", async () => {
    const result = await discoverSiteUrls("https://example.com", { maxPages: 3 });
    assert.ok(result.urls.length >= 1);
    assert.equal(result.urls[0], "https://example.com/");
  });

  it("respects maxPages cap", async () => {
    const result = await discoverSiteUrls("https://example.com", { maxPages: 2 });
    assert.ok(result.urls.length <= 2);
  });
});
