import { Router, type IRouter } from "express";
import { chromium } from "playwright";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const dnsLookupAsync = promisify(dnsLookup);
const PRIVATE_IP_RE =
  /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;
const TIMEOUT_MS = 25000;

export type ElementType = "link" | "button" | "input" | "select" | "textarea" | "other";

export interface FocusableElement {
  index: number;
  type: ElementType;
  tag: string;
  role: string;
  name: string;
  tabIndex: number;
  rect: { x: number; y: number; width: number; height: number };
  issues: string[];
}

export interface FocusOrderResult {
  url: string;
  screenshotBase64: string;
  pageWidth: number;
  pageHeight: number;
  elements: FocusableElement[];
  hasSkipLink: boolean;
}

async function validateUrl(
  raw: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "Invalid URL." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (PRIVATE_IP_RE.test(hostname)) {
    return { ok: false, error: "Internal addresses are not allowed." };
  }
  try {
    const { address } = await dnsLookupAsync(hostname);
    if (PRIVATE_IP_RE.test(address)) {
      return { ok: false, error: "Internal addresses are not allowed." };
    }
  } catch {
    return { ok: false, error: "Could not resolve hostname." };
  }
  return { ok: true, url: parsed.href };
}

router.get("/focus-order", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  if (typeof raw !== "string" || !raw) {
    res.status(400).json({ error: "missing_url", message: "A url query parameter is required." });
    return;
  }

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const validation = await validateUrl(normalized);
  if (!validation.ok) {
    res.status(400).json({ error: "invalid_url", message: validation.error });
    return;
  }

  const { url } = validation;
  logger.info({ url }, "Focus order analysis started");

  let browser: import("playwright").Browser | undefined;
  try {
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: "accessibility.now/1.0 FocusOrder (+https://accessibility.now)",
    });

    await context.route("**", async (route) => {
      const reqUrl = route.request().url();
      let parsedReq: URL;
      try {
        parsedReq = new URL(reqUrl);
      } catch {
        await route.abort("addressunreachable");
        return;
      }
      const hostname = parsedReq.hostname.replace(/^\[|\]$/g, "");
      if (PRIVATE_IP_RE.test(hostname)) {
        await route.abort("addressunreachable");
        return;
      }
      try {
        const { address } = await dnsLookupAsync(hostname);
        if (PRIVATE_IP_RE.test(address)) {
          await route.abort("addressunreachable");
          return;
        }
      } catch {
        await route.abort("namenotresolved");
        return;
      }
      await route.continue();
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: TIMEOUT_MS });

    const evaluateRaw = await page.evaluate(() => {
      const FOCUSABLE_SELECTOR = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled]):not([type='hidden'])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
        "details > summary",
      ].join(", ");

      function isTabbable(el: HTMLElement): boolean {
        if (el.hidden) return false;
        if ((el as HTMLInputElement).disabled) return false;
        let node: HTMLElement | null = el;
        while (node) {
          const style = window.getComputedStyle(node);
          if (style.display === "none" || style.visibility === "hidden") return false;
          if ((node as HTMLElement & { inert?: boolean }).inert) return false;
          node = node.parentElement;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        return true;
      }

      function getLabelText(el: Element): string {
        const id = el.getAttribute("id");
        if (id) {
          const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
          if (label) return (label.textContent ?? "").replace(/\s+/g, " ").trim();
        }
        const wrappingLabel = el.closest("label");
        if (wrappingLabel) {
          const clone = wrappingLabel.cloneNode(true) as HTMLElement;
          clone.querySelectorAll("input,select,textarea,button").forEach((c) => c.remove());
          const text = (clone.textContent ?? "").replace(/\s+/g, " ").trim();
          if (text) return text;
        }
        return "";
      }

      function getAccessibleName(el: Element): string {
        const ariaLabel = el.getAttribute("aria-label");
        if (ariaLabel?.trim()) return ariaLabel.trim();

        const labelledBy = el.getAttribute("aria-labelledby");
        if (labelledBy) {
          const parts = labelledBy.split(/\s+/).map((id) => {
            const ref = document.getElementById(id);
            return ref ? (ref.textContent ?? "").replace(/\s+/g, " ").trim() : "";
          });
          const joined = parts.filter(Boolean).join(" ");
          if (joined) return joined;
        }

        const tag = el.tagName.toLowerCase();
        const isFormControl = ["input", "select", "textarea"].includes(tag);
        if (isFormControl) {
          const labelText = getLabelText(el);
          if (labelText) return labelText;
        }

        const title = el.getAttribute("title");
        if (title?.trim()) return title.trim();

        const alt = el.getAttribute("alt");
        if (alt !== null && alt.trim()) return alt.trim();

        const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        if (text) return text.slice(0, 100);

        const placeholder = el.getAttribute("placeholder");
        if (placeholder?.trim()) return `(placeholder: ${placeholder.trim()})`;

        const value = (el as HTMLInputElement).value;
        if (value?.trim()) return value.trim();

        return "";
      }

      function getRole(el: Element): string {
        const explicit = el.getAttribute("role");
        if (explicit) return explicit;
        const tag = el.tagName.toLowerCase();
        const type = el.getAttribute("type") ?? "";
        const roleMap: Record<string, string> = {
          a: "link",
          button: "button",
          select: "combobox",
          textarea: "textbox",
          summary: "button",
        };
        if (tag === "input") {
          const inputRoleMap: Record<string, string> = {
            checkbox: "checkbox",
            radio: "radio",
            submit: "button",
            button: "button",
            reset: "button",
            range: "slider",
          };
          return inputRoleMap[type] ?? "textbox";
        }
        return roleMap[tag] ?? tag;
      }

      function getElementType(el: Element): string {
        const tag = el.tagName.toLowerCase();
        if (tag === "a") return "link";
        if (tag === "button") return "button";
        if (tag === "input") {
          const t = el.getAttribute("type") ?? "";
          if (["submit", "button", "reset", "image"].includes(t)) return "button";
          return "input";
        }
        if (tag === "select") return "select";
        if (tag === "textarea") return "textarea";
        const role = el.getAttribute("role") ?? "";
        if (role === "button") return "button";
        if (role === "link") return "link";
        return "other";
      }

      const allNodes = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(isTabbable);

      const withTabIndex = allNodes.map((el) => ({
        el,
        tabIndex: el.tabIndex ?? 0,
      }));

      const positive = withTabIndex.filter((n) => n.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
      const zero = withTabIndex.filter((n) => n.tabIndex === 0);
      const ordered = [...positive, ...zero];

      const elements = ordered.map((n, idx) => {
        const el = n.el;
        const rect = el.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const name = getAccessibleName(el);
        const tag = el.tagName.toLowerCase();
        const type = getElementType(el);
        const role = getRole(el);
        const tabIndex = n.tabIndex;
        const issues: string[] = [];
        if (!name) issues.push("Missing accessible name");
        if (tabIndex > 0) issues.push(`tabindex="${tabIndex}" — avoid positive tabindex`);

        return {
          index: idx + 1,
          type,
          tag,
          role,
          name,
          tabIndex,
          rect: {
            x: rect.left + scrollX,
            y: rect.top + scrollY,
            width: rect.width,
            height: rect.height,
          },
          issues,
        };
      });

      const hasSkipLink = elements.length > 0 && (
        elements[0].type === "link" &&
        /skip|jump|main|content/i.test(elements[0].name)
      );

      return {
        elements,
        pageWidth: document.documentElement.scrollWidth,
        pageHeight: document.documentElement.scrollHeight,
        hasSkipLink,
      };
    });

    const { elements, pageWidth, pageHeight } = evaluateRaw as unknown as {
      elements: FocusableElement[];
      pageWidth: number;
      pageHeight: number;
      hasSkipLink: boolean;
    };

    const png = await page.screenshot({ type: "png", fullPage: true });
    await context.close();

    const screenshotBase64 = png.toString("base64");

    const hasSkipLink = elements.length > 0 &&
      elements[0].type === "link" &&
      /skip|jump|main|content/i.test(elements[0].name);

    if (!hasSkipLink && elements.length > 0) {
      elements.forEach((el) => {
        if (el.index === 1) {
          el.issues.push("No skip link detected — first focusable element is not a skip link");
        }
      });
    }

    const result: FocusOrderResult = {
      url,
      screenshotBase64,
      pageWidth,
      pageHeight,
      elements,
      hasSkipLink,
    };

    logger.info({ url, elementCount: elements.length, hasSkipLink }, "Focus order analysis complete");
    res.json(result);
  } catch (err) {
    logger.error({ err, url }, "Focus order analysis failed");
    res.status(502).json({
      error: "analysis_failed",
      message: "The page could not be captured. It may be unreachable, require authentication, or block automated browsers.",
    });
  } finally {
    await browser?.close().catch(() => {});
  }
});

export default router;
