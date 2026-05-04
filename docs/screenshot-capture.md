# Screenshot capture (server and IDE)

This note covers **headless screenshots** in this repo and **Cursor’s Browser MCP**, plus remaining edge cases.

## Server-side (`@workspace/api-server`)

Full-page PNGs for **`/api/page-screenshot`** and **`/api/focus-order`** use `artifacts/api-server/src/lib/playwright-screenshot.ts`.

### Behaviour

1. **Primary path**: Single `page.screenshot({ fullPage: true, scale: "css", animations: "disabled" })` with a **`deviceScaleFactor: 1`** context to avoid oversized GPU bitmaps and flaky Chromium failures.

2. **Fallback path**: If that throws (very tall/wide pages, GPU limits), **tiled strip capture** runs:
   - Viewport width may grow up to **4096px** to reduce horizontal tiling.
   - **`position: fixed`** and **`position: sticky`** are set to **`visibility: hidden`** for the strip pass only so they do not redraw on every tile (the page context is discarded afterward; we do not restore visibility).
   - **Scroll size stability**: `scrollWidth` / `scrollHeight` are polled until two consecutive reads match (within a time budget) before and after viewport widen + hide, to reduce mis-tiling when layout shifts after load (fonts, images, resize observers).
   - **2D tiling**: Columns × rows with scroll/clipping math, then **pngjs** vertical and horizontal stitching.

Shared Chromium launch lives in `src/lib/playwright-chromium.ts`. Compliance scans use the same stable screenshot props on viewport and element JPEGs in `src/lib/scan.ts`.

### If a real URL still fails

Capture the **URL**, **approximate viewport**, and whether the failure is **single-frame** or **strip** (check API logs for `Single-frame full-page screenshot failed` / `Tiled strip screenshot failed`). Pathological cases include:

- Infinite or unbounded document growth (malicious or broken scripts).
- **`scrollWidth` / `scrollHeight` never stabilizing**: we eventually take the last measurement and log a warning.
- **Cross-origin or canvas-tainted** content (rare for our clip-based strips).

---

## Cursor IDE: Browser MCP

The **Cursor Browser MCP** (simple browser, snapshot, screenshot tools) is **not part of this repository**. It uses its own Chromium automation stack.

If you see errors such as **“cannot capture screenshot”** or timeouts there:

1. Take a **fresh `browser_snapshot`** after navigation or layout changes before screenshotting.
2. Prefer **viewport-sized** captures when full-page fails; very tall pages hit the same class of **GPU / max texture** limits as Playwright.
3. **Close other heavy GPU tabs** or try again; failures are often intermittent.
4. For **this product’s** URL previews, use the **API** (`/api/page-screenshot`, audits, focus-order) so behaviour matches the code above.

There is no in-repo switch to “fix” Cursor MCP; report recurring failures through **Cursor support / feedback** with steps and URL.

---

## Summary

| Surface | Fixed / sticky in tiles | Wide / tall pages | Layout settle |
|--------|-------------------------|-------------------|---------------|
| API strip fallback | Hidden for strip pass | Tiling + 4096 cap | Polled stable size |
| Cursor Browser MCP | N/A (not our code) | Try smaller capture / snapshot | N/A |
