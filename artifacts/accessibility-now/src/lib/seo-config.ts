export type SeoMeta = {
  title: string;
  description: string;
  /** Path without domain, e.g. /tools/contrast-checker */
  path: string;
  type?: "website" | "article";
  noindex?: boolean;
};

export const SITE = {
  name: "accessibility.now",
  url: "https://accessibility.now",
  parentBrand: "SomeTech.work",
  parentBrandUrl: "https://sometech.work",
  defaultDescription:
    "Free accessibility tools, WCAG guides, and EAA compliance resources. WCAG audits, remediation, and monitoring for EU teams — a SomeTech.work product.",
  ogImage: "https://accessibility.now/og-image.svg",
  twitterHandle: "@accessibilitynow",
} as const;

/** Per-route SEO metadata. Keys are paths without trailing slash (except "/"). */
export const SEO_ROUTES: Record<string, SeoMeta> = {
  "/": {
    path: "/",
    title: "accessibility.now — WCAG audits, free tools & EAA compliance",
    description:
      "Scan any site for WCAG issues, use nine free accessibility tools, and get expert audits and remediation. Built for EU teams by SomeTech.work.",
  },
  "/about": {
    path: "/about",
    title: "About accessibility.now — EU accessibility agency",
    description:
      "Senior accessibility engineers for WCAG audits, BFSG/EAA compliance, and remediation. A product of SomeTech.work.",
  },
  "/contact": {
    path: "/contact",
    title: "Contact — Get a WCAG or EAA audit",
    description: "Book a scope call for WCAG 2.2 audits, remediation sprints, or continuous monitoring.",
  },
  "/pricing": {
    path: "/pricing",
    title: "Pricing — Accessibility audits & remediation",
    description: "Fixed-scope WCAG audits, remediation sprints, and monitoring plans for EU companies.",
  },
  "/work": {
    path: "/work",
    title: "Work — Accessibility case studies",
    description: "Selected accessibility remediation and audit outcomes for EU clients.",
  },
  "/eaa": {
    path: "/eaa",
    title: "European Accessibility Act (EAA) guide — BFSG compliance",
    description:
      "What the EAA and BFSG require, who is in scope, and how to prepare your digital products before enforcement.",
  },
  "/services": {
    path: "/services",
    title: "Accessibility services — Audits, remediation, monitoring",
    description: "WCAG conformance audits, engineering remediation, and regression monitoring.",
  },
  "/services/audits": {
    path: "/services/audits",
    title: "WCAG accessibility audits — Manual + automated",
    description: "Full WCAG 2.2 conformance audits with screen reader and keyboard testing on real devices.",
  },
  "/services/remediation": {
    path: "/services/remediation",
    title: "Accessibility remediation — Engineering sprints",
    description: "Senior engineers fix WCAG issues in your codebase via pull requests and paired sessions.",
  },
  "/services/monitoring": {
    path: "/services/monitoring",
    title: "Accessibility monitoring — Continuous WCAG compliance",
    description: "Scheduled scans, regression alerts, and compliance dashboards for your live site.",
  },
  "/solutions/a11y-fix": {
    path: "/solutions/a11y-fix",
    title: "A11y Fix — Guided BFSG scan + fix plan",
    description: "POUR-grouped scan results with a self-serve remediation roadmap for BFSG/EAA readiness.",
  },
  "/tools": {
    path: "/tools",
    title: "Free accessibility tools — Scanner, contrast, simulators",
    description:
      "Twelve free tools: WCAG scanner, contrast checker, colour blindness simulator, screen reader preview, and more.",
  },
  "/tools/website-scanner": {
    path: "/tools/website-scanner",
    title: "Free website accessibility scanner — WCAG axe audit",
    description: "Run a full WCAG-tagged axe scan in headless Chromium. Optional mobile + desktop and strict profile.",
  },
  "/tools/contrast-checker": {
    path: "/tools/contrast-checker",
    title: "Colour contrast checker — WCAG AA & AAA",
    description: "Check text and UI contrast ratios against WCAG 2.2 with instant pass/fail and fix suggestions.",
  },
  "/tools/colour-blindness": {
    path: "/tools/colour-blindness",
    title: "Colour blindness simulator — Deuteranopia, protanopia & more",
    description: "Preview any URL through four types of colour vision deficiency.",
  },
  "/tools/screen-reader-preview": {
    path: "/tools/screen-reader-preview",
    title: "Screen reader preview — NVDA, JAWS & VoiceOver order",
    description: "See landmarks, headings, links, buttons, and alt text in screen reader reading order.",
  },
  "/tools/keyboard-tester": {
    path: "/tools/keyboard-tester",
    title: "Keyboard navigation tester — Tab order checklist",
    description: "Step-by-step keyboard testing guide with a persistent checklist for skip links and focus.",
  },
  "/tools/low-vision": {
    path: "/tools/low-vision",
    title: "Low vision simulator — Blur, tunnel & macular loss",
    description: "Simulate moderate and severe low vision conditions on any website URL.",
  },
  "/tools/mobile-checklist": {
    path: "/tools/mobile-checklist",
    title: "Mobile accessibility checklist — iOS & Android",
    description: "Touch targets, VoiceOver/TalkBack labels, dynamic type, and gesture alternatives.",
  },
  "/tools/wcag-checklist": {
    path: "/tools/wcag-checklist",
    title: "WCAG 2.1 AA checklist — All 50 success criteria",
    description: "Interactive checklist for every Level A and AA success criterion with progress saved locally.",
  },
  "/tools/focus-order": {
    path: "/tools/focus-order",
    title: "Focus order visualizer — Keyboard tab sequence",
    description: "Screenshot any page with numbered markers showing keyboard Tab order and issue detection.",
  },
  "/tools/alt-text-checker": {
    path: "/tools/alt-text-checker",
    title: "Alt text checker — Find missing & empty image alt",
    description: "Scan a URL for images missing alt attributes or using poor alternative text.",
  },
  "/tools/heading-structure": {
    path: "/tools/heading-structure",
    title: "Heading structure checker — H1–H6 hierarchy",
    description: "Validate heading levels and empty headings for screen reader navigation.",
  },
  "/tools/link-text-checker": {
    path: "/tools/link-text-checker",
    title: "Link text checker — Generic & empty link audit",
    description: "Find links with no accessible name or generic text like 'click here' and 'read more'.",
  },
  "/resources": {
    path: "/resources",
    title: "Accessibility resources — Guides, checklists & compliance",
    description: "Engineering-grade WCAG guides, EAA checklists, compliance explainers, and platform playbooks.",
  },
  "/resources/wcag-guide": {
    path: "/resources/wcag-guide",
    title: "WCAG 2.2 guide — Success criteria explained",
    description: "Plain-English walkthrough of WCAG 2.2 Level A and AA requirements for developers and designers.",
    type: "article",
  },
  "/resources/eaa-checklist": {
    path: "/resources/eaa-checklist",
    title: "EAA checklist — Interactive BFSG compliance list",
    description: "Track EAA and BFSG readiness with an interactive checklist you can export.",
  },
  "/resources/glossary": {
    path: "/resources/glossary",
    title: "Accessibility glossary — WCAG, EAA, ARIA & VPAT",
    description: "Searchable glossary of accessibility acronyms and terms.",
  },
  "/resources/blog": {
    path: "/resources/blog",
    title: "Accessibility blog — EAA, WCAG & engineering",
    description: "Deep-dives on EAA enforcement, e-commerce WCAG, and automated vs manual testing.",
  },
  "/resources/blog/eaa-enforcement": {
    path: "/resources/blog/eaa-enforcement",
    title: "EAA enforcement timeline — What happens next",
    description: "How European Accessibility Act enforcement unfolds and what businesses should do now.",
    type: "article",
  },
  "/resources/blog/wcag-ecommerce": {
    path: "/resources/blog/wcag-ecommerce",
    title: "WCAG for e-commerce — Checkout, filters & product pages",
    description: "The accessibility issues that cost online retailers conversions and how to fix them.",
    type: "article",
  },
  "/resources/blog/automated-vs-manual": {
    path: "/resources/blog/automated-vs-manual",
    title: "Automated vs manual accessibility testing",
    description: "What axe and Lighthouse catch — and the 60–80% of WCAG issues only humans find.",
    type: "article",
  },
  "/resources/compliance": {
    path: "/resources/compliance",
    title: "Digital accessibility laws by region",
    description: "ADA, Section 508, AODA, EN 301 549, UK Equality Act, and EAA explained for product teams.",
  },
  "/resources/compliance/ada": {
    path: "/resources/compliance/ada",
    title: "ADA website accessibility — Requirements & litigation risk",
    description: "How ADA Title III applies to websites and what WCAG 2.1 AA conformance looks like in practice.",
    type: "article",
  },
  "/resources/compliance/section-508": {
    path: "/resources/compliance/section-508",
    title: "Section 508 — Federal accessibility & VPAT",
    description: "Section 508 requirements for U.S. federal vendors and how to produce a VPAT ACR.",
    type: "article",
  },
  "/resources/compliance/aoda": {
    path: "/resources/compliance/aoda",
    title: "AODA compliance — Ontario accessibility law",
    description: "Accessibility for Ontarians with Disabilities Act requirements for websites and apps.",
    type: "article",
  },
  "/resources/compliance/en-301-549": {
    path: "/resources/compliance/en-301-549",
    title: "EN 301 549 — EU procurement accessibility standard",
    description: "How EN 301 549 maps to WCAG and what it means for public sector ICT in Europe.",
    type: "article",
  },
  "/resources/compliance/uk-equality-act": {
    path: "/resources/compliance/uk-equality-act",
    title: "UK Equality Act — Website accessibility requirements",
    description: "How the Equality Act 2010 applies to UK websites and the PSBAR public sector bar.",
    type: "article",
  },
  "/resources/compliance/wcag-22": {
    path: "/resources/compliance/wcag-22",
    title: "WCAG 2.2 compliance — What's new & who must comply",
    description: "New success criteria in WCAG 2.2 and how they affect audits, procurement, and EAA conformance.",
    type: "article",
  },
  "/resources/technologies": {
    path: "/resources/technologies",
    title: "Platform accessibility guides — WordPress, React, Shopify",
    description: "Platform-specific WCAG playbooks for WordPress, TYPO3, Drupal, Shopify, React, and Next.js.",
  },
  "/resources/technologies/wordpress": {
    path: "/resources/technologies/wordpress",
    title: "WordPress accessibility — Themes, blocks & plugins",
    description: "Make WordPress sites WCAG 2.2 compliant: themes, Gutenberg blocks, forms, and media.",
    type: "article",
  },
  "/resources/technologies/typo3": {
    path: "/resources/technologies/typo3",
    title: "TYPO3 accessibility — BITV & BFSG for enterprise CMS",
    description: "Accessibility patterns for TYPO3 backends, Fluid templates, and German public sector sites.",
    type: "article",
  },
  "/resources/technologies/drupal": {
    path: "/resources/technologies/drupal",
    title: "Drupal accessibility — Modules, themes & admin UI",
    description: "WCAG conformance for Drupal 10/11: semantic templates, forms, and contributed modules.",
    type: "article",
  },
  "/resources/technologies/shopify": {
    path: "/resources/technologies/shopify",
    title: "Shopify accessibility — Storefront WCAG for merchants",
    description: "Theme audits, checkout accessibility, and EAA readiness for Shopify merchants.",
    type: "article",
  },
  "/resources/technologies/react": {
    path: "/resources/technologies/react",
    title: "React accessibility — Components, ARIA & focus",
    description: "Accessible React patterns: semantic HTML, focus management, live regions, and testing.",
    type: "article",
  },
  "/resources/technologies/nextjs": {
    path: "/resources/technologies/nextjs",
    title: "Next.js accessibility — App Router, SSR & metadata",
    description: "WCAG patterns for Next.js: route announcers, skip links, image alt, and server components.",
    type: "article",
  },
  "/resources/technologies/vue": {
    path: "/resources/technologies/vue",
    title: "Vue.js accessibility — Composition API & a11y patterns",
    description: "Accessible Vue 3 components, focus traps, and testing with axe and screen readers.",
    type: "article",
  },
  "/resources/technologies/angular": {
    path: "/resources/technologies/angular",
    title: "Angular accessibility — CDK a11y & Material components",
    description: "Use Angular CDK a11y, LiveAnnouncer, and Material patterns for WCAG conformance.",
    type: "article",
  },
  "/resources/guides": {
    path: "/resources/guides",
    title: "Accessibility guides — WCAG, ARIA, keyboard & screen readers",
    description: "Engineering walkthroughs for WCAG, WAI-ARIA, keyboard navigation, and screen reader design.",
  },
  "/resources/guides/aria": {
    path: "/resources/guides/aria",
    title: "ARIA guide — Roles, states & when not to use ARIA",
    description: "Practical WAI-ARIA for developers: landmarks, live regions, and the first rule of ARIA.",
    type: "article",
  },
  "/resources/guides/keyboard-accessibility": {
    path: "/resources/guides/keyboard-accessibility",
    title: "Keyboard accessibility guide — Tab order & focus",
    description: "Everything developers need for WCAG 2.1.1 keyboard access and 2.4 focus appearance.",
    type: "article",
  },
  "/resources/guides/screen-readers": {
    path: "/resources/guides/screen-readers",
    title: "Screen reader guide — NVDA, JAWS & VoiceOver",
    description: "Design and build for screen reader users: landmarks, headings, and common mistakes.",
    type: "article",
  },
  "/resources/guides/alt-text": {
    path: "/resources/guides/alt-text",
    title: "Alt text guide — Meaningful image descriptions",
    description: "When to use alt text, when to leave it empty, and how to write descriptions that help.",
    type: "article",
  },
  "/resources/guides/forms": {
    path: "/resources/guides/forms",
    title: "Accessible forms guide — Labels, errors & validation",
    description: "WCAG patterns for form labels, error identification, and accessible validation messages.",
    type: "article",
  },
  "/resources/checklists": {
    path: "/resources/checklists",
    title: "Accessibility checklists — EAA, WCAG & mobile",
    description: "Interactive checklists for EAA, WCAG 2.1 AA, mobile, and Shopify storefront pre-flight.",
  },
  "/resources/checklists/shopify-eaa": {
    path: "/resources/checklists/shopify-eaa",
    title: "Shopify EAA pre-flight checklist — Storefront audit",
    description: "Theme, checkout, and product page checks for Shopify merchants approaching EAA deadlines.",
  },
  "/legal/privacy": {
    path: "/legal/privacy",
    title: "Privacy policy — accessibility.now",
    description: "How accessibility.now collects and processes personal data.",
    noindex: true,
  },
  "/legal/accessibility": {
    path: "/legal/accessibility",
    title: "Accessibility statement — accessibility.now",
    description: "Our commitment to WCAG conformance and how to report accessibility barriers.",
  },
};

export function resolveSeoMeta(pathname: string): SeoMeta {
  const path = pathname.replace(/\/$/, "") || "/";
  return (
    SEO_ROUTES[path] ?? {
      path,
      title: `${SITE.name} — Page not found`,
      description: SITE.defaultDescription,
      noindex: true,
    }
  );
}

/** All indexable paths for sitemap generation */
export function sitemapPaths(): string[] {
  return Object.values(SEO_ROUTES)
    .filter((m) => !m.noindex)
    .map((m) => m.path)
    .sort();
}
