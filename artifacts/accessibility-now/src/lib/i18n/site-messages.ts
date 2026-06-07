import type { Locale } from "./locale";

export type SiteMessages = {
  nav: {
    main: string;
    services: string;
    pricing: string;
    tools: string;
    resources: string;
    about: string;
    contact: string;
    getAudit: string;
    openMenu: string;
    closeMenu: string;
    allServices: string;
    browseResources: string;
  };
  services: {
    tagline: string;
    columns: {
      a11yFix: { title: string; description: string; items: string[] };
      audits: { title: string; description: string; items: string[] };
      remediation: { title: string; description: string; items: string[] };
      monitoring: { title: string; description: string; items: string[] };
    };
  };
  resources: {
    tagline: string;
    columns: {
      guides: { title: string; description: string; items: string[] };
      checklists: { title: string; description: string; items: string[] };
      glossary: { title: string; description: string; items: string[] };
      compliance: { title: string; description: string; items: string[] };
      technologies: { title: string; description: string; items: string[] };
      blog: { title: string; description: string; items: string[] };
    };
  };
  footer: {
    tagline: string;
    services: string;
    resources: string;
    toolsLegal: string;
    audits: string;
    remediation: string;
    monitoring: string;
    pricing: string;
    guides: string;
    checklists: string;
    glossary: string;
    compliance: string;
    technologies: string;
    blog: string;
    allTools: string;
    eaaGuide: string;
    privacy: string;
    accessibilityStatement: string;
    language: string;
  };
  languageSwitcher: {
    label: string;
    english: string;
    german: string;
  };
};

const en: SiteMessages = {
  nav: {
    main: "Main navigation",
    services: "Services",
    pricing: "Pricing",
    tools: "Tools",
    resources: "Resources",
    about: "About",
    contact: "Contact",
    getAudit: "Get an audit →",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    allServices: "All services →",
    browseResources: "Browse all resources →",
  },
  services: {
    tagline: "EAA-ready engineering. Senior team, fixed scope, sprint cadence.",
    columns: {
      a11yFix: {
        title: "A11y Fix",
        description: "Guided BFSG scan + fix plan.",
        items: [
          "POUR-grouped BFSG scan",
          "Self-serve fix roadmap",
          "Escalate to engineers",
          "Baseline + monitoring",
        ],
      },
      audits: {
        title: "Audits",
        description: "Manual + automated.",
        items: [
          "WCAG 2.2 conformance audit",
          "EAA / BFSG compliance audit",
          "Mobile app audit",
          "VPAT / ACR for procurement",
        ],
      },
      remediation: {
        title: "Remediation",
        description: "Engineers paired with yours.",
        items: [
          "Sprint-based engineering",
          "Pull request delivery",
          "Component library fixes",
          "Design system advisory",
        ],
      },
      monitoring: {
        title: "Monitoring",
        description: "Continuous compliance.",
        items: [
          "Monthly automated scans",
          "Regression alerts",
          "Compliance dashboard",
          "Annual conformance review",
        ],
      },
    },
  },
  resources: {
    tagline: "All resources · written by engineers, free to use.",
    columns: {
      guides: {
        title: "Guides",
        description: "Engineering-grade walkthroughs.",
        items: ["WCAG 2.2", "ARIA", "Keyboard accessibility", "Screen readers", "Alt text", "Accessible forms"],
      },
      checklists: {
        title: "Checklists",
        description: "Interactive, exportable.",
        items: ["EAA Checklist", "WCAG 2.1 AA", "Mobile", "Shopify EAA"],
      },
      glossary: {
        title: "Glossary",
        description: "Acronyms decoded.",
        items: ["EAA, EN 301 549", "WCAG, WAI-ARIA", "VPAT, ACR"],
      },
      compliance: {
        title: "Compliance",
        description: "Laws by region.",
        items: [
          "European Accessibility Act",
          "EN 301 549",
          "ADA",
          "Section 508",
          "AODA",
          "UK Equality Act",
          "WCAG 2.2",
        ],
      },
      technologies: {
        title: "Technologies",
        description: "Platform-specific.",
        items: ["WordPress", "TYPO3", "Drupal", "Shopify", "React", "Next.js"],
      },
      blog: {
        title: "Blog",
        description: "Engineering deep-dives.",
        items: ["EAA enforcement", "WCAG for e-commerce", "Automated vs manual"],
      },
    },
  },
  footer: {
    tagline: "A11y agency: WCAG audits, remediation, and monitoring, focused on teams shipping in the EU.",
    services: "Services",
    resources: "Resources",
    toolsLegal: "Tools & Legal",
    audits: "Audits",
    remediation: "Remediation",
    monitoring: "Monitoring",
    pricing: "Pricing",
    guides: "Guides",
    checklists: "Checklists",
    glossary: "Glossary",
    compliance: "Compliance",
    technologies: "Technologies",
    blog: "Blog",
    allTools: "All tools",
    eaaGuide: "EAA Guide",
    privacy: "Privacy Policy",
    accessibilityStatement: "Accessibility Statement",
    language: "Language",
  },
  languageSwitcher: {
    label: "Language selection",
    english: "English",
    german: "German",
  },
};

const de: SiteMessages = {
  nav: {
    main: "Hauptnavigation",
    services: "Leistungen",
    pricing: "Preise",
    tools: "Tools",
    resources: "Ressourcen",
    about: "Über uns",
    contact: "Kontakt",
    getAudit: "Audit anfragen →",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
    allServices: "Alle Leistungen →",
    browseResources: "Alle Ressourcen →",
  },
  services: {
    tagline: "EAA-ready Engineering. Senior-Team, fester Scope, Sprint-Rhythmus.",
    columns: {
      a11yFix: {
        title: "A11y Fix",
        description: "Geführter BFSG-Scan + Fix-Plan.",
        items: [
          "POUR-gruppierter BFSG-Scan",
          "Self-Service-Fix-Roadmap",
          "An Engineers eskalieren",
          "Baseline + Monitoring",
        ],
      },
      audits: {
        title: "Audits",
        description: "Manuell + automatisiert.",
        items: [
          "WCAG-2.2-Konformitätsaudit",
          "EAA- / BFSG-Compliance-Audit",
          "Mobile-App-Audit",
          "VPAT / ACR für Beschaffung",
        ],
      },
      remediation: {
        title: "Remediation",
        description: "Engineers an Ihrer Seite.",
        items: [
          "Sprint-basiertes Engineering",
          "Pull-Request-Lieferung",
          "Component-Library-Fixes",
          "Design-System-Beratung",
        ],
      },
      monitoring: {
        title: "Monitoring",
        description: "Kontinuierliche Compliance.",
        items: [
          "Monatliche automatisierte Scans",
          "Regressions-Alerts",
          "Compliance-Dashboard",
          "Jährlicher Konformitäts-Review",
        ],
      },
    },
  },
  resources: {
    tagline: "Alle Ressourcen · von Engineers geschrieben, kostenlos nutzbar.",
    columns: {
      guides: {
        title: "Guides",
        description: "Engineering-Walkthroughs.",
        items: ["WCAG 2.2", "ARIA", "Tastatur-Barrierefreiheit", "Screenreader", "Alt-Text", "Barrierefreie Formulare"],
      },
      checklists: {
        title: "Checklisten",
        description: "Interaktiv, exportierbar.",
        items: ["EAA-Checkliste", "WCAG 2.1 AA", "Mobile", "Shopify EAA"],
      },
      glossary: {
        title: "Glossar",
        description: "Akronyme erklärt.",
        items: ["EAA, EN 301 549", "WCAG, WAI-ARIA", "VPAT, ACR"],
      },
      compliance: {
        title: "Compliance",
        description: "Recht nach Region.",
        items: [
          "European Accessibility Act",
          "EN 301 549",
          "ADA",
          "Section 508",
          "AODA",
          "UK Equality Act",
          "WCAG 2.2",
        ],
      },
      technologies: {
        title: "Technologien",
        description: "Plattformspezifisch.",
        items: ["WordPress", "TYPO3", "Drupal", "Shopify", "React", "Next.js"],
      },
      blog: {
        title: "Blog",
        description: "Engineering-Deep-Dives.",
        items: ["EAA-Durchsetzung", "WCAG für E-Commerce", "Automatisiert vs. manuell"],
      },
    },
  },
  footer: {
    tagline:
      "A11y-Agentur: WCAG-Audits, Remediation und Monitoring – für Teams, die in der EU liefern.",
    services: "Leistungen",
    resources: "Ressourcen",
    toolsLegal: "Tools & Rechtliches",
    audits: "Audits",
    remediation: "Remediation",
    monitoring: "Monitoring",
    pricing: "Preise",
    guides: "Guides",
    checklists: "Checklisten",
    glossary: "Glossar",
    compliance: "Compliance",
    technologies: "Technologien",
    blog: "Blog",
    allTools: "Alle Tools",
    eaaGuide: "EAA-Guide",
    privacy: "Datenschutz",
    accessibilityStatement: "Barrierefreiheitserklärung",
    language: "Sprache",
  },
  languageSwitcher: {
    label: "Sprachauswahl",
    english: "Englisch",
    german: "Deutsch",
  },
};

export const siteMessages: Record<Locale, SiteMessages> = { en, de };

export function getSiteMessages(locale: Locale): SiteMessages {
  return siteMessages[locale];
}
