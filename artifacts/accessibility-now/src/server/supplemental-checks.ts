/**
 * Supplemental accessibility checks beyond axe-core.
 * Covers BITV/BFSG requirements that axe may miss or only partially detect.
 */

import type { SupplementalFinding } from "./compliance/bitv-bfsg";
import type { AuditViolation } from "./scan";

export interface SupplementalCheckResult {
  findings: SupplementalFinding[];
  violations: AuditViolation[];
}

interface PageCheckPayload {
  lang: string | null;
  title: string | null;
  hasSkipLink: boolean;
  hasBarrierefreiheitLink: boolean;
  hasH1: boolean;
  hasMetaViewport: boolean;
  focusVisibleSampleFailed: boolean;
  horizontalScrollAt200Zoom: boolean;
}

/** Run supplemental checks inside the Playwright page context */
export async function runSupplementalChecksInPage(
  page: import("playwright").Page,
): Promise<SupplementalCheckResult> {
  const payload = await page.evaluate((): PageCheckPayload => {
    const doc = document;
    const html = doc.documentElement;
    const lang = html.getAttribute("lang")?.trim() || null;
    const title = doc.title?.trim() || null;

    const skipSelectors = [
      'a[href^="#"]:not([href="#"])',
      'a[href*="main"]',
      'a[href*="content"]',
      '[class*="skip" i]',
      '[id*="skip" i]',
    ];
    let hasSkipLink = false;
    for (const sel of skipSelectors) {
      try {
        const el = doc.querySelector(sel);
        if (el && (el.textContent?.trim().length ?? 0) > 0) {
          hasSkipLink = true;
          break;
        }
      } catch {
        /* ignore invalid selector */
      }
    }

    const barrierefreiheitPatterns = [
      /barrierefreiheit/i,
      /accessibility\s*statement/i,
      /erklärung.*barriere/i,
      /declaration.*accessibilit/i,
    ];
    const links = [...doc.querySelectorAll("a[href]")];
    const hasBarrierefreiheitLink = links.some((a) => {
      const text = (a.textContent ?? "") + " " + (a.getAttribute("aria-label") ?? "");
      const href = a.getAttribute("href") ?? "";
      return barrierefreiheitPatterns.some((p) => p.test(text) || p.test(href));
    });

    const hasH1 = doc.querySelectorAll("h1").length > 0;
    const viewportMeta = doc.querySelector('meta[name="viewport"]');
    const hasMetaViewport = Boolean(viewportMeta?.getAttribute("content")?.trim());

    let focusVisibleSampleFailed = false;
    const focusables = [
      ...doc.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ].slice(0, 8);

    for (const el of focusables) {
      if (el.offsetParent === null && getComputedStyle(el).position !== "fixed") continue;
      el.focus();
      const style = getComputedStyle(el);
      const outline = style.outlineStyle;
      const outlineWidth = parseFloat(style.outlineWidth) || 0;
      const boxShadow = style.boxShadow;
      const hasVisibleFocus =
        (outline !== "none" && outlineWidth > 0) ||
        (boxShadow !== "none" && boxShadow.length > 4);
      if (!hasVisibleFocus) {
        focusVisibleSampleFailed = true;
        break;
      }
      el.blur();
    }

    const originalZoom = html.style.zoom;
    html.style.zoom = "2";
    const horizontalScrollAt200Zoom = doc.documentElement.scrollWidth > window.innerWidth * 1.05;
    html.style.zoom = originalZoom;

    return {
      lang,
      title,
      hasSkipLink,
      hasBarrierefreiheitLink,
      hasH1,
      hasMetaViewport,
      focusVisibleSampleFailed,
      horizontalScrollAt200Zoom,
    };
  });

  return mapPayloadToResults(payload);
}

/** Static fallback checks from HTML string (JSDOM path) */
export function runSupplementalChecksFromHtml(html: string, pageUrl: string): SupplementalCheckResult {
  const langMatch = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  const lang = langMatch?.[1]?.trim() || null;
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || null;
  const hasH1 = /<h1[\s>]/i.test(html);
  const hasMetaViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  const hasSkipLink =
    /skip|sprung|zum\s+inhalt|main\s*content/i.test(html) && /<a[^>]+href=["']#[^"']+["']/i.test(html);
  const hasBarrierefreiheitLink = /barrierefreiheit|accessibility\s*statement/i.test(html);

  return mapPayloadToResults({
    lang,
    title,
    hasSkipLink,
    hasBarrierefreiheitLink,
    hasH1,
    hasMetaViewport,
    focusVisibleSampleFailed: false,
    horizontalScrollAt200Zoom: false,
  });
}

function mapPayloadToResults(payload: PageCheckPayload): SupplementalCheckResult {
  const findings: SupplementalFinding[] = [];
  const violations: AuditViolation[] = [];

  const addFail = (
    id: string,
    titleDe: string,
    titleEn: string,
    description: string,
    impact: AuditViolation["impact"],
    en301549?: string,
    bitv?: string,
  ) => {
    findings.push({ id, titleDe, titleEn, status: "fail", description, impact, en301549Clause: en301549, bitvSection: bitv });
    violations.push({
      id,
      wcagCriteria: en301549 ? `EN 301 549 ${en301549}` : "BITV 2.0 / BFSG",
      description,
      impact,
      affectedElements: 1,
      topSelectors: [],
      help: titleDe,
    });
  };

  const addWarn = (
    id: string,
    titleDe: string,
    titleEn: string,
    description: string,
    impact: AuditViolation["impact"],
    en301549?: string,
    bitv?: string,
  ) => {
    findings.push({ id, titleDe, titleEn, status: "warning", description, impact, en301549Clause: en301549, bitvSection: bitv });
  };

  const addPass = (id: string, titleDe: string, titleEn: string, description: string) => {
    findings.push({ id, titleDe, titleEn, status: "pass", description, impact: "minor" });
  };

  if (!payload.lang) {
    addFail(
      "supplemental-lang",
      "Sprachangabe fehlt",
      "Missing page language",
      "Das html-Element hat kein gültiges lang-Attribut. Erforderlich nach WCAG 3.1.1 / EN 301 549 9.1.3.1.1.",
      "serious",
      "9.1.3.1.1",
      "4.1.3 Sprache der Seite",
    );
  } else {
    addPass("supplemental-lang", "Sprachangabe", "Page language", `lang="${payload.lang}"`);
  }

  if (!payload.title) {
    addFail(
      "supplemental-title",
      "Seitentitel fehlt",
      "Missing document title",
      "Kein aussagekräftiger Seitentitel (<title>). Erforderlich nach WCAG 2.4.2 / EN 301 549 9.1.2.2.1.",
      "serious",
      "9.1.2.2.1",
      "4.1.2 Seitentitel",
    );
  } else {
    addPass("supplemental-title", "Seitentitel", "Document title", payload.title.slice(0, 120));
  }

  if (!payload.hasSkipLink) {
    addWarn(
      "supplemental-skip-link",
      "Kein Skip-Link erkannt",
      "No skip link detected",
      "Kein Sprunglink zum Hauptinhalt gefunden. Empfohlen nach WCAG 2.4.1 für wiederkehrende Navigation.",
      "moderate",
      "9.1.2.4.1",
      "4.1.2 Blöcke umgehen",
    );
  } else {
    addPass("supplemental-skip-link", "Skip-Link", "Skip link", "Sprunglink zum Hauptinhalt erkannt.");
  }

  if (!payload.hasBarrierefreiheitLink) {
    addWarn(
      "supplemental-barrierefreiheit-link",
      "Barrierefreiheitserklärung nicht verlinkt",
      "Accessibility statement not linked",
      "Kein Link zur Barrierefreiheitserklärung gefunden. BITV 2.0 und BFSG verlangen eine öffentlich zugängliche Erklärung.",
      "moderate",
      "9.1.2.2.1",
      "6 Barrierefreiheitserklärung",
    );
  } else {
    addPass(
      "supplemental-barrierefreiheit-link",
      "Barrierefreiheitserklärung",
      "Accessibility statement",
      "Link zur Barrierefreiheitserklärung erkannt.",
    );
  }

  if (!payload.hasH1) {
    addWarn(
      "page-has-heading-one",
      "Keine H1-Überschrift",
      "No H1 heading",
      "Die Seite hat keine H1-Überschrift. Empfohlen für klare Dokumentstruktur.",
      "moderate",
      "9.1.2.1.1",
      "4.1.2 Überschriften",
    );
  }

  if (!payload.hasMetaViewport) {
    addWarn(
      "meta-viewport",
      "Viewport-Meta fehlt",
      "Missing viewport meta",
      "Kein viewport meta-Tag — mobile Darstellung und Zoom können beeinträchtigt sein.",
      "moderate",
      "9.1.4.10.1",
      "4.1.4 Zoom und Reflow",
    );
  }

  if (payload.focusVisibleSampleFailed) {
    addFail(
      "supplemental-focus-visible",
      "Fokus nicht sichtbar",
      "Focus not visible",
      "Bei einer Stichprobe interaktiver Elemente war der Tastaturfokus nicht sichtbar (WCAG 2.4.7).",
      "serious",
      "9.1.2.1.1",
      "4.1.2 Sichtbarer Fokus",
    );
  }

  if (payload.horizontalScrollAt200Zoom) {
    addWarn(
      "supplemental-zoom-reflow",
      "Horizontaler Scroll bei 200% Zoom",
      "Horizontal scroll at 200% zoom",
      "Inhalt erfordert horizontales Scrollen bei 200% Zoom — Reflow-Anforderung (WCAG 1.4.10) möglicherweise nicht erfüllt.",
      "moderate",
      "9.1.4.10.1",
      "4.1.4 Zoom und Reflow",
    );
  }

  return { findings, violations };
}
