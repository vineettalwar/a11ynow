import { PNG } from "pngjs";
import type { Page } from "playwright";
import { logger } from "./logger";

/**
 * Spread onto `page.screenshot` / `locator.screenshot` (with a `deviceScaleFactor: 1` context)
 * to reduce flaky Chromium capture failures.
 */
export const stablePlaywrightScreenshotProps = {
  animations: "disabled" as const,
  scale: "css" as const,
} as const;

export function screenshotFriendlyContextOptions(viewport: { width: number; height: number }): {
  viewport: { width: number; height: number };
  deviceScaleFactor: number;
} {
  return { viewport, deviceScaleFactor: 1 };
}

/** Widen strip viewport for wide pages; cap avoids extreme GPU allocations. */
const MAX_STRIP_VIEWPORT_WIDTH = 4096;

function stitchPngBuffersVertical(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) throw new Error("No PNG strips to stitch.");
  const pngs = buffers.map((b) => PNG.sync.read(b));
  const width = pngs[0]!.width;
  for (let i = 1; i < pngs.length; i++) {
    if (pngs[i]!.width !== width) {
      throw new Error(`PNG strip width mismatch: ${pngs[i]!.width} vs ${width}`);
    }
  }
  const height = pngs.reduce((sum, p) => sum + p.height, 0);
  const dst = new PNG({ width, height });
  let y = 0;
  for (const p of pngs) {
    p.bitblt(dst, 0, 0, p.width, p.height, 0, y);
    y += p.height;
  }
  return PNG.sync.write(dst);
}

function stitchPngBuffersHorizontal(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) throw new Error("No PNG columns to stitch.");
  const pngs = buffers.map((b) => PNG.sync.read(b));
  const height = pngs[0]!.height;
  for (let i = 1; i < pngs.length; i++) {
    if (pngs[i]!.height !== height) {
      throw new Error(`PNG column height mismatch: ${pngs[i]!.height} vs ${height}`);
    }
  }
  const width = pngs.reduce((sum, p) => sum + p.width, 0);
  const dst = new PNG({ width, height });
  let x = 0;
  for (const p of pngs) {
    p.bitblt(dst, 0, 0, p.width, p.height, x, 0);
    x += p.width;
  }
  return PNG.sync.write(dst);
}

async function widenViewportForStrip(page: Page, scrollWidth: number): Promise<void> {
  const vp = page.viewportSize();
  if (!vp) throw new Error("Missing viewport for strip capture");
  const targetW = Math.min(Math.max(vp.width, scrollWidth, 1), MAX_STRIP_VIEWPORT_WIDTH);
  if (targetW !== vp.width) {
    await page.setViewportSize({ width: targetW, height: vp.height });
  }
}

/** Hides `position: fixed` chrome during strip capture so it does not repeat on every tile. */
async function hideFixedElementsForStripCapture(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      if (getComputedStyle(el).position !== "fixed") return;
      if (el.dataset.__a11yPwshotFixed === "1") return;
      el.dataset.__a11yPwshotFixed = "1";
      el.dataset.__a11yPwshotPrevVis = el.style.visibility;
      el.style.visibility = "hidden";
    });
  });
}

async function readDocumentScrollSize(page: Page): Promise<{ width: number; height: number }> {
  return page.evaluate(() => {
    const el = document.documentElement;
    const body = document.body;
    return {
      width: Math.max(el.scrollWidth, body?.scrollWidth ?? 0, 1),
      height: Math.max(el.scrollHeight, body?.scrollHeight ?? 0, 1),
    };
  });
}

async function captureFullPagePngStrips(page: Page, timeout: number): Promise<Buffer> {
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" })).catch(() => undefined);
  await new Promise<void>((r) => setTimeout(r, 50));

  let { width: totalW, height: totalH } = await readDocumentScrollSize(page);
  await widenViewportForStrip(page, totalW);
  await hideFixedElementsForStripCapture(page);

  ({ width: totalW, height: totalH } = await readDocumentScrollSize(page));

  const vp = page.viewportSize();
  if (!vp || vp.width < 1 || vp.height < 1) {
    throw new Error("Missing viewport for strip capture");
  }

  const vpW = vp.width;
  const vpH = vp.height;
  const maxScrollX = Math.max(0, totalW - vpW);
  const maxScrollY = Math.max(0, totalH - vpH);

  const stripDeadline = Date.now() + Math.min(120_000, Math.max(timeout, 30_000));
  const perShotMs = () => Math.min(25_000, Math.max(5_000, stripDeadline - Date.now()));

  const columnImages: Buffer[] = [];
  let coverageX = 0;

  while (coverageX < totalW) {
    if (Date.now() > stripDeadline) {
      throw new Error("Strip capture exceeded time budget");
    }

    const strips: Buffer[] = [];
    let coverageY = 0;
    let columnDocW = 0;

    while (coverageY < totalH) {
      if (Date.now() > stripDeadline) {
        throw new Error("Strip capture exceeded time budget");
      }

      const scrollTargetX = Math.min(coverageX, maxScrollX);
      const scrollTargetY = Math.min(coverageY, maxScrollY);

      await page
        .evaluate(
          ({ sx, sy }) => {
            window.scrollTo({ left: sx, top: sy, behavior: "instant" });
          },
          { sx: scrollTargetX, sy: scrollTargetY },
        )
        .catch(() => undefined);

      await new Promise<void>((r) => setTimeout(r, 80));

      const snap = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));

      const visibleEndX = Math.min(snap.x + vpW, totalW);
      const stripStartDocX = Math.max(coverageX, snap.x);
      const stripDocW = visibleEndX - stripStartDocX;

      const visibleEndY = Math.min(snap.y + vpH, totalH);
      const stripStartDocY = Math.max(coverageY, snap.y);
      const stripDocH = visibleEndY - stripStartDocY;

      if (stripDocW <= 0 || stripDocH <= 0) {
        throw new Error("Strip capture made no progress (scroll / clip math)");
      }

      if (columnDocW === 0) {
        columnDocW = stripDocW;
      } else if (stripDocW !== columnDocW) {
        logger.warn({ columnDocW, stripDocW, coverageY }, "Unexpected strip width drift within column");
      }

      const clipX = stripStartDocX - snap.x;
      const clipY = stripStartDocY - snap.y;

      const shot = await page.screenshot({
        type: "png",
        fullPage: false,
        ...stablePlaywrightScreenshotProps,
        clip: { x: clipX, y: clipY, width: columnDocW, height: stripDocH },
        timeout: perShotMs(),
      });
      strips.push(shot);
      coverageY = stripStartDocY + stripDocH;
    }

    columnImages.push(strips.length === 1 ? strips[0]! : stitchPngBuffersVertical(strips));
    coverageX += columnDocW;
  }

  if (columnImages.length === 1) return columnImages[0]!;
  return stitchPngBuffersHorizontal(columnImages);
}

/**
 * Full-page PNG. Uses CSS pixel scale and no animations to avoid intermittent Chromium
 * "Unable to capture screenshot" failures; falls back to tiled strips when the single
 * composite still fails (very tall / wide pages, GPU limits). Strip mode hides
 * `position: fixed` elements so headers do not repeat per tile.
 */
export async function captureFullPagePng(
  page: Page,
  options?: { screenshotTimeoutMs?: number; logLabel?: string },
): Promise<Buffer> {
  const timeout = options?.screenshotTimeoutMs ?? 90_000;
  const label = options?.logLabel ?? "full-page-png";

  try {
    return await page.screenshot({
      type: "png",
      fullPage: true,
      ...stablePlaywrightScreenshotProps,
      timeout,
    });
  } catch (err) {
    logger.warn(
      { err, label },
      "Single-frame full-page screenshot failed; using tiled strip capture",
    );
    try {
      return await captureFullPagePngStrips(page, timeout);
    } catch (stripErr) {
      logger.error({ err: stripErr, label }, "Tiled strip screenshot failed");
      throw err;
    }
  }
}
