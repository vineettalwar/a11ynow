import { A11yFixIcon } from "@/lib/product-icons";
import {
  Activity,
  BookMarked,
  BookOpen,
  CheckSquare,
  Code,
  FileText,
  Layers,
  Search,
  ShieldCheck,
} from "lucide-react";
import { localizedPath, type Locale } from "./locale";
import { getSiteMessages } from "./site-messages";

type SimpleLink = { href: string; label: string };

export type NavColumn = {
  href: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  items: SimpleLink[];
};

const SERVICE_HREFS = [
  "/solutions/a11y-fix",
  "/services/audits",
  "/services/remediation",
  "/services/monitoring",
] as const;

const SERVICE_ITEM_HREFS = [
  ["/solutions/a11y-fix", "/solutions/a11y-fix", "/services/remediation", "/services/monitoring"],
  ["/services/audits", "/eaa", "/services/audits", "/resources/compliance/section-508"],
  ["/services/remediation", "/services/remediation", "/services/remediation", "/services/remediation"],
  ["/services/monitoring", "/services/monitoring", "/services/monitoring", "/services/monitoring"],
] as const;

const RESOURCE_HREFS = [
  "/resources/guides",
  "/resources/checklists",
  "/resources/glossary",
  "/resources/compliance",
  "/resources/technologies",
  "/resources/blog",
] as const;

const RESOURCE_ITEM_HREFS = [
  [
    "/resources/wcag-guide",
    "/resources/guides/aria",
    "/resources/guides/keyboard-accessibility",
    "/resources/guides/screen-readers",
    "/resources/guides/alt-text",
    "/resources/guides/forms",
  ],
  [
    "/resources/eaa-checklist",
    "/tools/wcag-checklist",
    "/tools/mobile-checklist",
    "/resources/checklists/shopify-eaa",
  ],
  [
    "/resources/glossary#letter-E",
    "/resources/glossary#letter-W",
    "/resources/glossary#letter-V",
  ],
  [
    "/eaa",
    "/resources/compliance/en-301-549",
    "/resources/compliance/ada",
    "/resources/compliance/section-508",
    "/resources/compliance/aoda",
    "/resources/compliance/uk-equality-act",
    "/resources/compliance/wcag-22",
  ],
  [
    "/resources/technologies/wordpress",
    "/resources/technologies/typo3",
    "/resources/technologies/drupal",
    "/resources/technologies/shopify",
    "/resources/technologies/react",
    "/resources/technologies/nextjs",
  ],
  [
    "/resources/blog/eaa-enforcement",
    "/resources/blog/wcag-ecommerce",
    "/resources/blog/automated-vs-manual",
  ],
] as const;

const SERVICE_ICONS = [A11yFixIcon, Search, Code, Activity] as const;
const RESOURCE_ICONS = [BookOpen, CheckSquare, BookMarked, ShieldCheck, Layers, FileText] as const;

function localizeLinks(hrefs: readonly string[], labels: readonly string[], locale: Locale): SimpleLink[] {
  return hrefs.map((href, index) => ({
    href: localizedPath(href, locale),
    label: labels[index] ?? "",
  }));
}

export function getNavLinks(locale: Locale): SimpleLink[] {
  const m = getSiteMessages(locale).nav;
  return [
    { href: localizedPath("/pricing", locale), label: m.pricing },
    { href: localizedPath("/tools", locale), label: m.tools },
  ];
}

export function getServicesColumns(locale: Locale): NavColumn[] {
  const columns = getSiteMessages(locale).services.columns;
  const keys = ["a11yFix", "audits", "remediation", "monitoring"] as const;

  return keys.map((key, columnIndex) => {
    const column = columns[key];
    return {
      href: localizedPath(SERVICE_HREFS[columnIndex], locale),
      title: column.title,
      description: column.description,
      icon: SERVICE_ICONS[columnIndex],
      items: localizeLinks(SERVICE_ITEM_HREFS[columnIndex], column.items, locale),
    };
  });
}

export function getResourcesColumns(locale: Locale): NavColumn[] {
  const columns = getSiteMessages(locale).resources.columns;
  const keys = ["guides", "checklists", "glossary", "compliance", "technologies", "blog"] as const;

  return keys.map((key, columnIndex) => {
    const column = columns[key];
    return {
      href: localizedPath(RESOURCE_HREFS[columnIndex], locale),
      title: column.title,
      description: column.description,
      icon: RESOURCE_ICONS[columnIndex],
      items: localizeLinks(RESOURCE_ITEM_HREFS[columnIndex], column.items, locale),
    };
  });
}

export function getFooterLinks(locale: Locale) {
  const m = getSiteMessages(locale).footer;
  const lp = (path: string) => localizedPath(path, locale);

  return {
    services: [
      { href: lp("/services/audits"), label: m.audits },
      { href: lp("/services/remediation"), label: m.remediation },
      { href: lp("/services/monitoring"), label: m.monitoring },
      { href: lp("/pricing"), label: m.pricing },
    ],
    resources: [
      { href: lp("/resources/guides"), label: m.guides },
      { href: lp("/resources/checklists"), label: m.checklists },
      { href: lp("/resources/glossary"), label: m.glossary },
      { href: lp("/resources/compliance"), label: m.compliance },
      { href: lp("/resources/technologies"), label: m.technologies },
      { href: lp("/resources/blog"), label: m.blog },
    ],
    toolsLegal: [
      { href: lp("/tools"), label: m.allTools },
      { href: lp("/eaa"), label: m.eaaGuide },
      { href: lp("/legal/privacy"), label: m.privacy },
      { href: lp("/legal/accessibility"), label: m.accessibilityStatement },
    ],
  };
}
