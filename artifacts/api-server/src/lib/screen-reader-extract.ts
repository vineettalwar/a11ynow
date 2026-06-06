export type ScreenReaderItemType =
  | "title"
  | "landmark"
  | "heading"
  | "link"
  | "button"
  | "image"
  | "form-label";

export interface ScreenReaderItem {
  type: ScreenReaderItemType;
  level?: number;
  role?: string;
  text: string;
  pass: boolean;
  issue?: string;
}

/** Browser-side extraction — injected via page.evaluate(). */
export function screenReaderExtractScript(): ScreenReaderItem[] {
  function getTextContent(el: Element): string {
    return (el.textContent ?? "").replace(/\s+/g, " ").trim();
  }

  function getAccessibleName(el: Element): string {
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel?.trim()) return ariaLabel.trim();
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const parts = labelledBy.split(" ").map((id) => {
        const ref = document.getElementById(id);
        return ref ? getTextContent(ref) : "";
      });
      const joined = parts.filter(Boolean).join(" ");
      if (joined) return joined;
    }
    const title = el.getAttribute("title");
    if (title?.trim()) return title.trim();
    return getTextContent(el);
  }

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
    const labelledByAttr = el.getAttribute("aria-labelledby");
    const labelledByText = labelledByAttr
      ? labelledByAttr
          .split(/\s+/)
          .map((id) => {
            const ref = id ? document.getElementById(id) : null;
            return ref ? getTextContent(ref) : "";
          })
          .filter(Boolean)
          .join(" ")
      : "";
    const labelEl =
      el.getAttribute("aria-label") || labelledByText || el.getAttribute("title") || "";
    items.push({
      node: el,
      item: { type: "landmark", role, text: labelEl || `<${tag}>`, pass: true },
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
            ? `Generic link text "${name}": use descriptive text`
            : undefined,
      },
    });
  });

  document
    .querySelectorAll("button, [role='button'], input[type='button'], input[type='submit'], input[type='reset']")
    .forEach((el) => {
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
    const isDecorative = role === "presentation" || role === "none" || alt === "";
    const missing = alt === null;
    items.push({
      node: el,
      item: {
        type: "image",
        text: isDecorative ? "(decorative: skipped)" : (alt ?? ""),
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

  document
    .querySelectorAll(
      "input:not([type='hidden']):not([type='button']):not([type='submit']):not([type='reset']), select, textarea",
    )
    .forEach((el) => {
      const id = el.getAttribute("id");
      const hasLabel = id
        ? !!document.querySelector(`label[for="${id}"]`)
        : !!el.closest("label");
      const ariaLabel = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
      const placeholder = el.getAttribute("placeholder");
      if (!hasLabel && !ariaLabel) {
        const typeLabel =
          el.tagName.toLowerCase() === "select" ? "Select" : el.getAttribute("type") || "Input";
        items.push({
          node: el,
          item: {
            type: "form-label",
            text: placeholder ? `${typeLabel} (placeholder only: "${placeholder}")` : typeLabel,
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

export function extractItemsFromDocument(document: Document): ScreenReaderItem[] {
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
  document.querySelectorAll(Object.keys(landmarkMap).join(", ")).forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role") || landmarkMap[tag] || tag;
    const labelledByAttr = el.getAttribute("aria-labelledby");
    const labelledByText = labelledByAttr
      ? labelledByAttr
          .split(/\s+/)
          .map((id) => {
            const ref = id ? document.getElementById(id) : null;
            return ref ? getTextContent(ref) : "";
          })
          .filter(Boolean)
          .join(" ")
      : "";
    const labelEl =
      el.getAttribute("aria-label") || labelledByText || el.getAttribute("title") || "";
    items.push({
      node: el,
      item: { type: "landmark", role, text: labelEl || `<${tag}>`, pass: true },
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
            ? `Generic link text "${name}": use descriptive text`
            : undefined,
      },
    });
  });

  document
    .querySelectorAll("button, [role='button'], input[type='button'], input[type='submit'], input[type='reset']")
    .forEach((el) => {
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
    const isDecorative = role === "presentation" || role === "none" || alt === "";
    const missing = alt === null;
    items.push({
      node: el,
      item: {
        type: "image",
        text: isDecorative ? "(decorative: skipped)" : (alt ?? ""),
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

  document
    .querySelectorAll(
      "input:not([type='hidden']):not([type='button']):not([type='submit']):not([type='reset']), select, textarea",
    )
    .forEach((el) => {
      const id = el.getAttribute("id");
      const hasLabel = id
        ? !!document.querySelector(`label[for="${id}"]`)
        : !!el.closest("label");
      const ariaLabel = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
      const placeholder = el.getAttribute("placeholder");
      if (!hasLabel && !ariaLabel) {
        const typeLabel =
          el.tagName.toLowerCase() === "select" ? "Select" : el.getAttribute("type") || "Input";
        items.push({
          node: el,
          item: {
            type: "form-label",
            text: placeholder ? `${typeLabel} (placeholder only: "${placeholder}")` : typeLabel,
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

export function itemsLookSparse(items: ScreenReaderItem[]): boolean {
  const meaningful = items.filter(
    (i) => i.type !== "title" && i.type !== "landmark" && (i.text.trim() || !i.pass),
  );
  return meaningful.length < 3;
}
