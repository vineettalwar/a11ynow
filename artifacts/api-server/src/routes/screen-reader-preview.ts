import { Router, type IRouter } from "express";
import { lookup as dnsLookup } from "dns";
import { promisify } from "util";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const dnsLookupAsync = promisify(dnsLookup);
const PRIVATE_IP_RE = /^(127\.|0\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|::1$|fc00:|fd[0-9a-f]{2}:|fe80:)/i;

async function validateUrl(raw: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let parsed: URL;
  try { parsed = new URL(raw); } catch { return { ok: false, error: "Invalid URL." }; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs are allowed." };
  }
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
  if (PRIVATE_IP_RE.test(hostname)) return { ok: false, error: "Internal addresses not allowed." };
  try {
    const { address } = await dnsLookupAsync(hostname);
    if (PRIVATE_IP_RE.test(address)) return { ok: false, error: "Internal addresses not allowed." };
  } catch { return { ok: false, error: "Could not resolve hostname." }; }
  return { ok: true, url: parsed.href };
}

type ItemType = "title" | "landmark" | "heading" | "link" | "button" | "image" | "form-label";

interface ScreenReaderItem {
  type: ItemType;
  level?: number;
  role?: string;
  text: string;
  pass: boolean;
  issue?: string;
}

function getTextContent(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

function getAccessibleName(el: Element): string {
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const parts = labelledBy.split(" ").map((id) => {
      const ref = el.ownerDocument.getElementById(id);
      return ref ? getTextContent(ref) : "";
    });
    const joined = parts.filter(Boolean).join(" ");
    if (joined) return joined;
  }
  const title = el.getAttribute("title");
  if (title?.trim()) return title.trim();
  return getTextContent(el);
}

function extractItems(document: Document): ScreenReaderItem[] {
  const items: Array<{ node: Element; item: ScreenReaderItem }> = [];

  const title = document.title?.trim();
  const titleEl = document.querySelector("title");
  if (titleEl) {
    items.push({
      node: titleEl,
      item: {
        type: "title",
        text: title || "",
        pass: !!title,
        issue: !title ? "Page has no <title>" : undefined,
      },
    });
  } else {
    items.push({
      node: document.documentElement,
      item: { type: "title", text: "", pass: false, issue: "Page is missing a <title> element" },
    });
  }

  const landmarkMap: Record<string, string> = {
    header: "banner",
    nav: "navigation",
    main: "main",
    footer: "contentinfo",
    aside: "complementary",
    section: "region",
    form: "form",
    search: "search",
  };
  const landmarkSelectors = Object.keys(landmarkMap).join(", ");
  document.querySelectorAll(landmarkSelectors).forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role") || landmarkMap[tag] || tag;
    const labelEl =
      el.getAttribute("aria-label") ||
      (el.getAttribute("aria-labelledby")
        ? getTextContent(document.getElementById(el.getAttribute("aria-labelledby")!)!)
        : "") ||
      el.getAttribute("title") ||
      "";
    items.push({
      node: el,
      item: {
        type: "landmark",
        role,
        text: labelEl || `<${tag}>`,
        pass: true,
      },
    });
  });

  for (let level = 1; level <= 6; level++) {
    document.querySelectorAll(`h${level}`).forEach((el) => {
      const text = getTextContent(el);
      items.push({
        node: el,
        item: {
          type: "heading",
          level,
          text,
          pass: !!text,
          issue: !text ? "Heading is empty" : undefined,
        },
      });
    });
  }

  document.querySelectorAll("a[href]").forEach((el) => {
    const name = getAccessibleName(el);
    const href = el.getAttribute("href") || "";
    const isGeneric = /^(click here|here|read more|more|link|this)$/i.test(name.trim());
    const isEmpty = !name.trim();
    items.push({
      node: el,
      item: {
        type: "link",
        text: name || href,
        pass: !isEmpty && !isGeneric,
        issue: isEmpty
          ? "Link has no accessible name"
          : isGeneric
            ? `Generic link text "${name}" — use descriptive text`
            : undefined,
      },
    });
  });

  document.querySelectorAll("button, [role='button'], input[type='button'], input[type='submit'], input[type='reset']").forEach((el) => {
    const name = getAccessibleName(el);
    items.push({
      node: el,
      item: {
        type: "button",
        text: name,
        pass: !!name.trim(),
        issue: !name.trim() ? "Button has no accessible name" : undefined,
      },
    });
  });

  document.querySelectorAll("img").forEach((el) => {
    const alt = el.getAttribute("alt");
    const role = el.getAttribute("role");
    const isDecorativeByRole = role === "presentation" || role === "none";
    const isDecorativeByAlt = alt === "";
    const isDecorative = isDecorativeByRole || isDecorativeByAlt;
    const missing = alt === null;
    items.push({
      node: el,
      item: {
        type: "image",
        text: isDecorative ? "(decorative — skipped)" : alt ?? "",
        pass: !missing,
        issue: missing ? "Image is missing the alt attribute" : undefined,
      },
    });
  });

  document.querySelectorAll("label").forEach((el) => {
    const text = getTextContent(el);
    const forAttr = el.getAttribute("for");
    const hasControl = forAttr
      ? !!document.getElementById(forAttr)
      : !!el.querySelector("input, select, textarea");
    items.push({
      node: el,
      item: {
        type: "form-label",
        text,
        pass: !!text && hasControl,
        issue: !text
          ? "Label has no text"
          : !hasControl
            ? "Label is not associated with a form control"
            : undefined,
      },
    });
  });

  document.querySelectorAll("input:not([type='hidden']):not([type='button']):not([type='submit']):not([type='reset']), select, textarea").forEach((el) => {
    const id = el.getAttribute("id");
    const hasLabel = id
      ? !!document.querySelector(`label[for="${id}"]`)
      : !!el.closest("label");
    const ariaLabel = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
    const placeholder = el.getAttribute("placeholder");
    if (!hasLabel && !ariaLabel) {
      const typeLabel = el.tagName.toLowerCase() === "select"
        ? "Select"
        : el.getAttribute("type") || "Input";
      items.push({
        node: el,
        item: {
          type: "form-label",
          text: placeholder ? `${typeLabel} (placeholder only: "${placeholder}")` : `${typeLabel}`,
          pass: false,
          issue: "Form control has no associated label",
        },
      });
    }
  });

  items.sort((a, b) => {
    if (a.item.type === "title") return -1;
    if (b.item.type === "title") return 1;
    const pos = a.node.compareDocumentPosition(b.node);
    if (pos & 4) return -1;
    if (pos & 2) return 1;
    return 0;
  });

  return items.map((i) => i.item);
}

router.get("/screen-reader-preview", async (req, res): Promise<void> => {
  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!rawUrl) {
    res.status(400).json({ error: "missing_param", message: "url query parameter is required." });
    return;
  }

  const validation = await validateUrl(rawUrl);
  if (!validation.ok) {
    res.status(400).json({ error: "invalid_url", message: validation.error });
    return;
  }

  const { url } = validation;

  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "accessibility.now/1.0 Screen Reader Preview (+https://accessibility.now)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      res.status(502).json({ error: "fetch_failed", message: `The page returned HTTP ${response.status}.` });
      return;
    }

    const html = await response.text();
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: false });
    const items = extractItems(dom.window.document as unknown as Document);

    logger.info({ url, itemCount: items.length }, "Screen reader preview completed");
    res.json({ url, items });
  } catch (err) {
    logger.error({ err, url }, "Screen reader preview failed");
    res.status(500).json({ error: "fetch_failed", message: "Could not fetch or parse the page." });
  }
});

export default router;
