/**
 * BITV 2.0 / BFSG (EN 301 549) compliance mapping for automated scan results.
 *
 * BITV 2.0 transposes EN 301 549 for German public-sector ICT.
 * BFSG (Barrierefreiheitsstärkungsgesetz) implements the European Accessibility Act
 * for products and services on the German market (enforcement from 28 June 2025).
 * Both reference WCAG 2.1 Level AA via EN 301 549 Chapter 9.
 */

import type { AuditViolation } from "../scan";

export type ComplianceStatus = "conformant" | "non_conformant" | "needs_manual_review";

export interface ComplianceClauseFinding {
  /** EN 301 549 clause reference, e.g. "9.1.1.1" */
  en301549Clause: string;
  /** German BITV 2.0 section label */
  bitvSection: string;
  /** WCAG success criterion when applicable */
  wcagCriterion?: string;
  /** Short German title */
  titleDe: string;
  /** Short English title */
  titleEn: string;
  status: ComplianceStatus;
  violationCount: number;
  /** Axe rule ids or supplemental check ids tied to this clause */
  relatedRuleIds: string[];
}

export interface SupplementalFinding {
  id: string;
  titleDe: string;
  titleEn: string;
  status: "pass" | "fail" | "warning";
  description: string;
  impact: AuditViolation["impact"];
  en301549Clause?: string;
  bitvSection?: string;
}

export interface ComplianceReport {
  framework: "BITV 2.0 / BFSG (EN 301 549)";
  frameworkVersion: string;
  legalContextDe: string;
  legalContextEn: string;
  /** Overall automated assessment — manual review always required for full conformance */
  overallStatus: ComplianceStatus;
  wcagLevel: "AA";
  clauseFindings: ComplianceClauseFinding[];
  supplementalFindings: SupplementalFinding[];
  /** Items that automated testing cannot verify (required for BITV/BFSG documentation) */
  manualReviewRequired: string[];
  summaryDe: string;
  summaryEn: string;
}

/** Map axe rule id → EN 301 549 / WCAG clause metadata */
const RULE_TO_CLAUSE: Record<
  string,
  { en301549: string; bitv: string; wcag?: string; titleDe: string; titleEn: string }
> = {
  "color-contrast": {
    en301549: "9.1.1.4.3",
    bitv: "4.1.3 Kontrast",
    wcag: "1.4.3",
    titleDe: "Kontrast (Minimum)",
    titleEn: "Contrast (Minimum)",
  },
  "image-alt": {
    en301549: "9.1.1.1.1",
    bitv: "4.1.1 Nicht-textuelle Inhalte",
    wcag: "1.1.1",
    titleDe: "Nicht-textuelle Inhalte",
    titleEn: "Non-text Content",
  },
  label: {
    en301549: "9.1.3.1.1",
    bitv: "4.1.3 Beschriftungen",
    wcag: "3.3.2",
    titleDe: "Beschriftungen oder Anweisungen",
    titleEn: "Labels or Instructions",
  },
  "button-name": {
    en301549: "9.1.4.1.2",
    bitv: "4.1.4 Name, Rolle, Wert",
    wcag: "4.1.2",
    titleDe: "Name, Rolle, Wert",
    titleEn: "Name, Role, Value",
  },
  "link-name": {
    en301549: "9.1.4.1.2",
    bitv: "4.1.4 Name, Rolle, Wert",
    wcag: "4.1.2",
    titleDe: "Link-Zugänglichkeitsname",
    titleEn: "Link Accessible Name",
  },
  "html-has-lang": {
    en301549: "9.1.3.1.1",
    bitv: "4.1.3 Sprache von Teilen",
    wcag: "3.1.1",
    titleDe: "Sprache der Seite",
    titleEn: "Language of Page",
  },
  "html-lang-valid": {
    en301549: "9.1.3.1.1",
    bitv: "4.1.3 Sprache von Teilen",
    wcag: "3.1.1",
    titleDe: "Gültige Sprachangabe",
    titleEn: "Valid Language Attribute",
  },
  "document-title": {
    en301549: "9.1.2.2.1",
    bitv: "4.1.2 Seitentitel",
    wcag: "2.4.2",
    titleDe: "Seitentitel",
    titleEn: "Page Title",
  },
  "heading-order": {
    en301549: "9.1.2.1.1",
    bitv: "4.1.2 Überschriftenstruktur",
    wcag: "1.3.1",
    titleDe: "Überschriftenstruktur",
    titleEn: "Heading Structure",
  },
  "bypass": {
    en301549: "9.1.2.4.1",
    bitv: "4.1.2 Blöcke umgehen",
    wcag: "2.4.1",
    titleDe: "Mechanismus zum Überspringen von Blöcken",
    titleEn: "Bypass Blocks",
  },
  "frame-title": {
    en301549: "9.1.4.1.2",
    bitv: "4.1.4 Name, Rolle, Wert",
    wcag: "4.1.2",
    titleDe: "Frame-Titel",
    titleEn: "Frame Title",
  },
  "aria-valid-attr": {
    en301549: "9.1.4.1.2",
    bitv: "4.1.4 Name, Rolle, Wert",
    wcag: "4.1.2",
    titleDe: "Gültige ARIA-Attribute",
    titleEn: "Valid ARIA Attributes",
  },
  "aria-required-attr": {
    en301549: "9.1.4.1.2",
    bitv: "4.1.4 Name, Rolle, Wert",
    wcag: "4.1.2",
    titleDe: "Erforderliche ARIA-Attribute",
    titleEn: "Required ARIA Attributes",
  },
  tabindex: {
    en301549: "9.1.2.1.1",
    bitv: "4.1.2 Tastaturbedienbarkeit",
    wcag: "2.1.1",
    titleDe: "Tastaturbedienbarkeit",
    titleEn: "Keyboard Accessible",
  },
  "focus-order-semantics": {
    en301549: "9.1.2.3.1",
    bitv: "4.1.2 Fokusreihenfolge",
    wcag: "2.4.3",
    titleDe: "Fokusreihenfolge",
    titleEn: "Focus Order",
  },
  region: {
    en301549: "9.1.2.1.1",
    bitv: "4.1.2 Struktur",
    wcag: "1.3.1",
    titleDe: "Landmark-Regionen",
    titleEn: "Landmark Regions",
  },
  "meta-viewport": {
    en301549: "9.1.4.10.1",
    bitv: "4.1.4 Zoom und Reflow",
    wcag: "1.4.4",
    titleDe: "Zoom und Reflow",
    titleEn: "Resize and Reflow",
  },
  "page-has-heading-one": {
    en301549: "9.1.2.1.1",
    bitv: "4.1.2 Überschriften",
    wcag: "2.4.6",
    titleDe: "Hauptüberschrift (H1)",
    titleEn: "Page Has Heading One",
  },
  "supplemental-lang": {
    en301549: "9.1.3.1.1",
    bitv: "4.1.3 Sprache der Seite",
    wcag: "3.1.1",
    titleDe: "Sprachangabe (html lang)",
    titleEn: "Page Language Declaration",
  },
  "supplemental-title": {
    en301549: "9.1.2.2.1",
    bitv: "4.1.2 Seitentitel",
    wcag: "2.4.2",
    titleDe: "Seitentitel vorhanden",
    titleEn: "Document Title Present",
  },
  "supplemental-skip-link": {
    en301549: "9.1.2.4.1",
    bitv: "4.1.2 Blöcke umgehen",
    wcag: "2.4.1",
    titleDe: "Skip-Link / Sprungmarke",
    titleEn: "Skip Navigation Link",
  },
  "supplemental-barrierefreiheit-link": {
    en301549: "9.1.2.2.1",
    bitv: "6 Barrierefreiheitserklärung",
    titleDe: "Barrierefreiheitserklärung verlinkt",
    titleEn: "Accessibility Statement Linked",
  },
  "supplemental-focus-visible": {
    en301549: "9.1.2.1.1",
    bitv: "4.1.2 Sichtbarer Fokus",
    wcag: "2.4.7",
    titleDe: "Sichtbarer Tastaturfokus",
    titleEn: "Visible Keyboard Focus",
  },
  "supplemental-zoom-reflow": {
    en301549: "9.1.4.10.1",
    bitv: "4.1.4 Zoom und Reflow",
    wcag: "1.4.10",
    titleDe: "Inhalt bei 200% Zoom nutzbar",
    titleEn: "Content Usable at 200% Zoom",
  },
};

const MANUAL_REVIEW_ITEMS = [
  "Vollständige Tastaturbedienbarkeit aller interaktiven Funktionen (manuell prüfen)",
  "Screenreader-Kompatibilität und sinnvolle Lesereihenfolge",
  "Verständlichkeit von Fehlermeldungen und Hilfetexten in Formularen",
  "Untertitel, Audiodeskription und Gebärdensprache bei Videos (falls vorhanden)",
  "PDF- und Office-Dokumente auf Barrierefreiheit",
  "Zeitlimits, Bewegung und Animationen (Ausnahmen und Steuerung)",
  "Erstellung der Barrierefreiheitserklärung gemäß BITV 2.0 / BFSG",
  "Technische Dokumentation und Konformitätserklärung für Behörden/Marktüberwachung",
] as const;

function clauseKey(en301549: string, bitv: string): string {
  return `${en301549}::${bitv}`;
}

function wcagFromCriteria(wcagCriteria: string): string | undefined {
  const m = wcagCriteria.match(/^(\d+\.\d+\.\d+)/);
  return m?.[1];
}

function resolveClauseForViolation(v: AuditViolation): {
  en301549: string;
  bitv: string;
  wcag?: string;
  titleDe: string;
  titleEn: string;
} {
  const mapped = RULE_TO_CLAUSE[v.id];
  if (mapped) return mapped;

  const wcag = wcagFromCriteria(v.wcagCriteria);
  return {
    en301549: wcag ? `9.1.${wcag.replace(/\./g, ".")}` : "9.1 (WCAG 2.1 AA)",
    bitv: wcag ? `4.1 WCAG ${wcag}` : "4.1 WCAG 2.1 AA",
    wcag,
    titleDe: v.description.slice(0, 80),
    titleEn: v.description.slice(0, 80),
  };
}

export function buildComplianceReport(
  violations: AuditViolation[],
  supplementalFindings: SupplementalFinding[],
): ComplianceReport {
  const clauseMap = new Map<string, ComplianceClauseFinding>();

  for (const v of violations) {
    const clause = resolveClauseForViolation(v);
    const key = clauseKey(clause.en301549, clause.bitv);
    const existing = clauseMap.get(key);
    if (existing) {
      existing.violationCount += 1;
      if (!existing.relatedRuleIds.includes(v.id)) existing.relatedRuleIds.push(v.id);
      existing.status = "non_conformant";
    } else {
      clauseMap.set(key, {
        en301549Clause: clause.en301549,
        bitvSection: clause.bitv,
        wcagCriterion: clause.wcag,
        titleDe: clause.titleDe,
        titleEn: clause.titleEn,
        status: "non_conformant",
        violationCount: 1,
        relatedRuleIds: [v.id],
      });
    }
  }

  for (const s of supplementalFindings) {
    if (s.status !== "fail") continue;
    const en301549 = s.en301549Clause ?? "9.1 (WCAG 2.1 AA)";
    const bitv = s.bitvSection ?? "4.1 WCAG 2.1 AA";
    const key = clauseKey(en301549, bitv);
    const existing = clauseMap.get(key);
    if (existing) {
      existing.violationCount += 1;
      if (!existing.relatedRuleIds.includes(s.id)) existing.relatedRuleIds.push(s.id);
      existing.status = "non_conformant";
    } else {
      clauseMap.set(key, {
        en301549Clause: en301549,
        bitvSection: bitv,
        titleDe: s.titleDe,
        titleEn: s.titleEn,
        status: "non_conformant",
        violationCount: 1,
        relatedRuleIds: [s.id],
      });
    }
  }

  const clauseFindings = [...clauseMap.values()].sort((a, b) => {
    const impactOrder = (ids: string[]) => {
      const v = violations.find((x) => ids.includes(x.id));
      if (!v) return 9;
      const ranks: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      return ranks[v.impact] ?? 9;
    };
    return impactOrder(a.relatedRuleIds) - impactOrder(b.relatedRuleIds);
  });

  const hasViolations = violations.length > 0 || supplementalFindings.some((s) => s.status === "fail");
  const overallStatus: ComplianceStatus = hasViolations ? "non_conformant" : "needs_manual_review";

  const failCount = violations.length + supplementalFindings.filter((s) => s.status === "fail").length;
  const warnCount = supplementalFindings.filter((s) => s.status === "warning").length;

  return {
    framework: "BITV 2.0 / BFSG (EN 301 549)",
    frameworkVersion: "EN 301 549 v3.2.1 / WCAG 2.1 AA",
    legalContextDe:
      "BITV 2.0 gilt für öffentliche Stellen; das BFSG setzt die EU-Barrierefreiheitsrichtlinie (EAA) für Produkte und Dienstleistungen um. Beide verweisen auf EN 301 549 Kapitel 9 (WCAG 2.1 Stufe AA).",
    legalContextEn:
      "BITV 2.0 applies to public-sector bodies; BFSG transposes the European Accessibility Act for products and services. Both reference EN 301 549 Chapter 9 (WCAG 2.1 Level AA).",
    overallStatus,
    wcagLevel: "AA",
    clauseFindings,
    supplementalFindings,
    manualReviewRequired: [...MANUAL_REVIEW_ITEMS],
    summaryDe: hasViolations
      ? `Automatisierte Prüfung: ${failCount} festgestellte Mängel${warnCount > 0 ? `, ${warnCount} Hinweise` : ""} gegen BITV 2.0 / BFSG (EN 301 549). Eine vollständige Konformität erfordert zusätzlich eine manuelle Prüfung.`
      : `Keine automatisierten Mängel gegen WCAG 2.1 AA festgestellt. Für BITV 2.0 / BFSG-Konformität ist dennoch eine manuelle Prüfung und Dokumentation erforderlich.`,
    summaryEn: hasViolations
      ? `Automated scan: ${failCount} issue(s)${warnCount > 0 ? `, ${warnCount} warning(s)` : ""} against BITV 2.0 / BFSG (EN 301 549). Full conformance still requires manual review.`
      : `No automated WCAG 2.1 AA issues detected. BITV 2.0 / BFSG conformance still requires manual review and documentation.`,
  };
}

/** Attach BITV/EN 301 549 fields to violations for detailed reporting */
export function enrichViolationsWithCompliance(violations: AuditViolation[]): AuditViolation[] {
  return violations.map((v) => {
    const clause = resolveClauseForViolation(v);
    return {
      ...v,
      en301549Clause: clause.en301549,
      bitvSection: clause.bitv,
      titleDe: clause.titleDe,
    };
  });
}
