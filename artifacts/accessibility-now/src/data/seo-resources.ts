import type { SeoArticleContent } from "@/components/seo-article";

const COMPLIANCE_BC = [
  { href: "/", label: "Home" },
  { href: "/resources", label: "Resources" },
  { href: "/resources/compliance", label: "Compliance" },
];
const TECH_BC = [
  { href: "/", label: "Home" },
  { href: "/resources", label: "Resources" },
  { href: "/resources/technologies", label: "Technologies" },
];
const GUIDES_BC = [
  { href: "/", label: "Home" },
  { href: "/resources", label: "Resources" },
  { href: "/resources/guides", label: "Guides" },
];

export const SEO_CONTENT: Record<string, SeoArticleContent> = {
  // ───────── COMPLIANCE ─────────
  "compliance-ada": {
    breadcrumb: [...COMPLIANCE_BC, { href: "/resources/compliance/ada", label: "ADA" }],
    kicker: "Compliance · United States",
    title: "ADA accessibility for digital",
    titleAccent: "products.",
    intro:
      "The Americans with Disabilities Act (ADA) has been applied to websites and apps by U.S. courts since the late 1990s. Title III lawsuits target inaccessible digital experiences - and the costs of losing one, both financial and reputational, are significant.",
    sections: [
      {
        heading: "Does the ADA apply to your website?",
        body:
          "If your business operates a place of public accommodation in the U.S. - retail, hospitality, banking, healthcare, education, ticketing, transportation - courts have consistently held that your digital channels are covered.\n\nThe DOJ confirmed in 2022 and again in 2024 that ADA Title III applies to websites and mobile apps, and that WCAG 2.1 Level AA is the de facto standard regulators use to evaluate compliance.",
      },
      {
        heading: "What's actually required",
        bullets: [
          "Conformance with WCAG 2.1 Level AA across every public page and customer flow.",
          "Accessibility for screen reader, switch, voice control, magnification, and keyboard-only users.",
          "An accessible alternative for any third-party widget you embed (chat, booking, video).",
          "A documented remediation plan if you cannot fix a specific issue immediately.",
          "An accessibility statement with contact details for users to report barriers.",
        ],
      },
      {
        heading: "Litigation risk in 2026",
        body:
          "ADA Title III digital lawsuits have grown roughly 15% year over year since 2018. Plaintiff firms now scan thousands of sites monthly with automated tools and file complaints in batches.\n\nDefending a single ADA case typically costs $25k–$80k; settling costs $10k–$35k plus a remediation commitment. The cheapest outcome by an order of magnitude is to fix the issues before being sued.",
      },
      {
        heading: "How we help with ADA",
        bullets: [
          "Full WCAG 2.1 AA audit with manual screen reader and keyboard testing on real devices.",
          "Prioritised remediation plan that maps each issue to the user impact and the legal risk.",
          "Engineering pairing to fix high-risk issues and add regression tests.",
          "Continuous monitoring so new code does not reintroduce barriers.",
          "An accessibility statement and conformance report you can publish.",
        ],
      },
    ],
    related: [
      { href: "/resources/compliance/section-508", label: "Section 508", description: "U.S. federal procurement standard." },
      { href: "/eaa", label: "European Accessibility Act", description: "EU's equivalent regulation." },
      { href: "/resources/guides/wcag", label: "WCAG 2.2 guide", description: "The underlying technical standard." },
    ],
    ctaTitle: "Get audited before",
    ctaBody: "Plaintiff firms scan sites continuously. Get a real audit, fix the issues that matter, and publish a conformance report.",
  },

  "compliance-section-508": {
    breadcrumb: [...COMPLIANCE_BC, { href: "/resources/compliance/section-508", label: "Section 508" }],
    kicker: "Compliance · United States Federal",
    title: "Section 508 for federal vendors and",
    titleAccent: "agencies.",
    intro:
      "Section 508 of the Rehabilitation Act requires U.S. federal agencies - and the contractors who sell to them - to make their electronic and information technology accessible to people with disabilities.",
    sections: [
      {
        heading: "Who Section 508 applies to",
        body:
          "Section 508 applies to all U.S. federal agencies, plus any organisation supplying ICT (websites, apps, software, hardware, digital documents) to the federal government.\n\nIf you want to sell SaaS, services, or content to a federal agency, you will be asked for a VPAT (Voluntary Product Accessibility Template) ACR (Accessibility Conformance Report). No VPAT, no contract.",
      },
      {
        heading: "The technical standard",
        body:
          "The 2018 Section 508 Refresh harmonised Section 508 with WCAG 2.0 Level AA. The Access Board has signalled an upcoming refresh to WCAG 2.2 Level AA, in line with EU and U.K. trajectories.\n\nIn practice, building to WCAG 2.2 AA today covers Section 508, the EAA, the U.K. PSBAR, AODA, and most state laws simultaneously.",
      },
      {
        heading: "VPATs and ACRs explained",
        bullets: [
          "VPAT is the template; ACR is the completed report a vendor publishes for a specific product version.",
          "Use VPAT 2.5 (the current INT/EU/EN edition) so a single ACR covers Section 508, EN 301 549, and WCAG.",
          "An honest ACR with documented gaps and a remediation roadmap is far better than an inflated one - agencies verify.",
          "ACRs must be refreshed for every major version of the product.",
        ],
      },
      {
        heading: "What we deliver for federal vendors",
        bullets: [
          "WCAG 2.2 AA + Section 508 audit performed by a human accessibility engineer.",
          "A defensible VPAT 2.5 INT covering Section 508, EN 301 549, and WCAG simultaneously.",
          "Engineering remediation paired with developers, not handed off as a 200-page PDF.",
          "Re-test and updated ACR after fixes ship.",
        ],
      },
    ],
    related: [
      { href: "/resources/compliance/ada", label: "ADA", description: "U.S. private-sector law." },
      { href: "/resources/compliance/en-301-549", label: "EN 301 549", description: "EU's equivalent of Section 508." },
      { href: "/resources/glossary", label: "Glossary", description: "VPAT, ACR, WCAG, EN 301 549 explained." },
    ],
    ctaTitle: "Need a defensible",
    ctaBody: "We produce VPAT 2.5 INT reports that hold up to procurement review - backed by a real audit, not a self-attested checkbox.",
  },

  "compliance-aoda": {
    breadcrumb: [...COMPLIANCE_BC, { href: "/resources/compliance/aoda", label: "AODA" }],
    kicker: "Compliance · Canada (Ontario)",
    title: "AODA for organisations operating in",
    titleAccent: "Ontario.",
    intro:
      "The Accessibility for Ontarians with Disabilities Act (AODA) requires public-sector and many private-sector organisations to make their websites and digital content accessible to WCAG 2.0 Level AA.",
    sections: [
      {
        heading: "Who AODA applies to",
        body:
          "AODA applies to any organisation with one or more employees in Ontario - including public sector, non-profits with 50+ employees, and private businesses with 50+ employees.\n\nWebsite requirements have been in force for new and significantly refreshed sites since January 2014, and for all internet-facing content since January 2021.",
      },
      {
        heading: "What you need to comply",
        bullets: [
          "All public-facing websites and content must conform to WCAG 2.0 Level AA (excluding live captions and pre-recorded audio descriptions).",
          "An accessibility policy that is publicly available and updated annually.",
          "A multi-year accessibility plan reviewed at least every five years.",
          "Accessibility compliance reports filed with the Government of Ontario every three years (1 June 2026 next deadline).",
          "Staff training records on AODA and the Human Rights Code.",
        ],
      },
      {
        heading: "Penalties and enforcement",
        body:
          "Maximum administrative penalties are CAD $50,000 per day for individuals and CAD $100,000 per day for corporations. The province has been increasing audits and enforcement actions since the 2024 Rich Donovan AODA review.",
      },
      {
        heading: "How we help with AODA",
        bullets: [
          "WCAG 2.0 AA audit (we test to 2.2 by default - covers AODA and futureproofs you).",
          "Accessibility policy and multi-year plan templates customised to your org.",
          "Compliance report drafting support before your filing deadline.",
          "Ongoing monitoring so new content does not slip below conformance.",
        ],
      },
    ],
    related: [
      { href: "/eaa", label: "European Accessibility Act", description: "EU equivalent." },
      { href: "/resources/compliance/ada", label: "ADA", description: "U.S. equivalent for the private sector." },
      { href: "/resources/guides/wcag", label: "WCAG 2.2 guide", description: "The underlying standard." },
    ],
    ctaTitle: "AODA report due",
    ctaBody: "We can audit, remediate, and help you draft your AODA compliance report before the 1 June 2026 deadline.",
  },

  "compliance-en-301-549": {
    breadcrumb: [...COMPLIANCE_BC, { href: "/resources/compliance/en-301-549", label: "EN 301 549" }],
    kicker: "Compliance · European Union",
    title: "EN 301 549, the European accessibility",
    titleAccent: "standard.",
    intro:
      "EN 301 549 is the harmonised European standard for ICT accessibility. It is the technical specification that the European Accessibility Act (EAA), the Web Accessibility Directive (WAD), and EU public procurement rules all reference.",
    sections: [
      {
        heading: "What EN 301 549 covers",
        body:
          "EN 301 549 covers websites, mobile apps, software, hardware, electronic documents, ICT-based support services, ICT used in emergency communications, and digital signage. The current version is V3.2.1 (2021), with V4 expected to be published during 2026.\n\nFor the web, EN 301 549 incorporates WCAG 2.1 Level AA in full and adds extra requirements for biometrics, two-way voice communication, and authoring tools.",
      },
      {
        heading: "How it relates to other regulations",
        bullets: [
          "European Accessibility Act (EAA) - uses EN 301 549 as the presumption-of-conformity standard from 28 June 2025.",
          "Web Accessibility Directive (WAD) - public-sector bodies must conform since 2020.",
          "EU public procurement (Directive 2014/24/EU) - public bodies must require EN 301 549 conformance from suppliers.",
          "U.K. Public Sector Bodies Accessibility Regulations 2018 - references EN 301 549 directly.",
        ],
      },
      {
        heading: "EN 301 549 vs WCAG 2.2",
        body:
          "EN 301 549 currently references WCAG 2.1. WCAG 2.2 (W3C Recommendation October 2023) adds nine new success criteria covering cognitive accessibility, mobile, and authentication.\n\nWe build to WCAG 2.2 by default. The next EN 301 549 revision is widely expected to align with WCAG 2.2, and meeting 2.2 today positions you ahead of that update with no rework.",
      },
      {
        heading: "Reporting and conformance",
        bullets: [
          "Use the EU eAccessibility statement template (Decision EU 2018/1523) for public-sector sites.",
          "For EAA scope: produce technical documentation, an EU declaration of conformity, and CE-style internal records.",
          "For procurement: provide a VPAT 2.5 INT or completed EN 301 549 conformance table.",
          "Conformance evaluations should be repeated at least annually and after any significant release.",
        ],
      },
    ],
    related: [
      { href: "/eaa", label: "European Accessibility Act", description: "The flagship EU regulation." },
      { href: "/resources/compliance/section-508", label: "Section 508", description: "U.S. equivalent." },
      { href: "/resources/glossary", label: "Glossary", description: "EN 301 549, VPAT, ACR explained." },
    ],
    ctaTitle: "Need an EN 301 549",
    ctaBody: "We perform conformance assessments to the current EN 301 549 V3.2.1 plus WCAG 2.2 - futureproofing you for the next revision.",
  },

  // ───────── TECHNOLOGIES ─────────
  "tech-wordpress": {
    breadcrumb: [...TECH_BC, { href: "/resources/technologies/wordpress", label: "WordPress" }],
    kicker: "Technologies · CMS",
    title: "WordPress accessibility, done",
    titleAccent: "properly.",
    intro:
      "WordPress powers around 43% of the web - and a huge proportion of European enterprise content sites. Out of the box it can be accessible, but most themes, page-builders, and plugins introduce serious barriers.",
    sections: [
      {
        heading: "Where WordPress accessibility usually breaks",
        bullets: [
          "Page builders (Elementor, Divi, WPBakery) generate non-semantic markup, missing landmarks, and broken heading orders.",
          "Slider and carousel plugins ship without keyboard support, pause controls, or aria-live regions.",
          "Form plugins (Contact Form 7, Gravity, WPForms) often emit error messages that screen readers never announce.",
          "Cookie-consent banners are the single most common WCAG failure on WP sites - keyboard traps and contrast failures dominate.",
          "Themes labelled 'accessibility-ready' frequently fail manual testing despite the WordPress.org tag.",
        ],
      },
      {
        heading: "The theme decision",
        body:
          "The block themes built on the Site Editor (FSE) - Twenty Twenty-Four onwards - are the most accessible starting point WordPress has ever shipped. They use semantic HTML, real focus styles, and pass WCAG 2.2 AA in their default state.\n\nIf you must use a classic page-builder theme, expect to invest in serious remediation. We have helped Fortune 500 marketing teams replatform from Divi onto block themes in under eight weeks.",
      },
      {
        heading: "Plugins worth using",
        bullets: [
          "WP Accessibility - adds skip links, language attributes, alt-text enforcement, and removes target=_blank.",
          "Editoria11y - inline accessibility checks for editors right in the block editor.",
          "Sa11y - public-facing accessibility tester editors can run on any draft.",
          "Yoast SEO - its readability score correlates with cognitive accessibility (WCAG 3.1.5).",
        ],
      },
      {
        heading: "What we do for WordPress sites",
        bullets: [
          "Theme and plugin audit: identify which components actively block accessibility.",
          "Block-pattern library: accessible reusable patterns for marketing pages, hero sections, CTAs.",
          "Editor enablement: train your content team on heading structure, alt text, and link wording.",
          "CI checks via axe-core to prevent regressions when plugins update.",
        ],
      },
    ],
    related: [
      { href: "/resources/technologies/typo3", label: "TYPO3", description: "Enterprise CMS popular across DACH." },
      { href: "/resources/technologies/drupal", label: "Drupal", description: "Used by EU public sector." },
      { href: "/resources/guides/wcag", label: "WCAG guide", description: "The standard your WP site must meet." },
    ],
    ctaTitle: "Audit your WordPress site",
    ctaBody: "We audit WordPress sites against WCAG 2.2 AA with manual screen reader testing - not just an automated scan plugin.",
  },

  "tech-typo3": {
    breadcrumb: [...TECH_BC, { href: "/resources/technologies/typo3", label: "TYPO3" }],
    kicker: "Technologies · CMS",
    title: "TYPO3 accessibility for German-speaking",
    titleAccent: "enterprise.",
    intro:
      "TYPO3 is the dominant enterprise CMS across Germany, Austria, and Switzerland - used heavily by public-sector bodies, universities, and hospitals. The EAA and the German BFSG put TYPO3 sites squarely in regulatory scope.",
    sections: [
      {
        heading: "Why TYPO3 matters for accessibility",
        body:
          "Many TYPO3 deployments are public-sector and therefore already in scope of the Web Accessibility Directive - and from 28 June 2025 commercial TYPO3 sites must also comply with the EAA / German BFSG.\n\nTYPO3 has strong accessibility primitives in core (semantic Fluid templates, structured rich-text, the a11y System Extension) but most live sites depend on legacy TypoScript-rendered components that need attention.",
      },
      {
        heading: "Common TYPO3 a11y issues we find",
        bullets: [
          "Powermail forms with missing field labels and inaccessible error summaries.",
          "Bootstrap Package carousels and tabs without proper ARIA semantics.",
          "ke_search and indexed_search results pages with poor focus management.",
          "Image carousels and content sliders with no keyboard controls.",
          "Inaccessible PDF downloads - particularly old InDesign exports - linked from main navigation.",
        ],
      },
      {
        heading: "Our TYPO3 remediation approach",
        bullets: [
          "Audit Fluid templates and TypoScript-rendered partials for semantic correctness.",
          "Replace legacy carousel and tab extensions with accessible alternatives or custom components.",
          "Rebuild Powermail forms with proper labels, descriptions, and aria-live error summaries.",
          "Deliver an accessible PDF workflow and remediation guidance for legacy assets.",
          "BFSG / EAA conformance documentation: declaration of conformity plus internal technical file.",
        ],
      },
      {
        heading: "BFSG: the German EAA transposition",
        body:
          "Germany transposed the EAA into the Barrierefreiheitsstärkungsgesetz (BFSG), in force 28 June 2025. The BFSG covers e-commerce, banking, transport, and many B2C services - large portions of the TYPO3 install base.\n\nNon-conformance can trigger fines of up to €100,000 plus product withdrawal. The Bundesfachstelle Barrierefreiheit has confirmed it will conduct market surveillance on a sample basis from late 2025.",
      },
    ],
    related: [
      { href: "/eaa", label: "European Accessibility Act", description: "Including the German BFSG transposition." },
      { href: "/resources/technologies/wordpress", label: "WordPress", description: "If you're considering replatforming." },
      { href: "/resources/compliance/en-301-549", label: "EN 301 549", description: "The standard TYPO3 sites must meet." },
    ],
    ctaTitle: "TYPO3 site needs a BFSG",
    ctaBody: "We work in German and English with TYPO3 teams across DACH - audit, remediation, and BFSG documentation.",
  },

  "tech-drupal": {
    breadcrumb: [...TECH_BC, { href: "/resources/technologies/drupal", label: "Drupal" }],
    kicker: "Technologies · CMS",
    title: "Drupal accessibility for the EU public",
    titleAccent: "sector.",
    intro:
      "Drupal is the platform of choice across the EU public sector, including europa.eu, many national ministries, and most large universities. Accessibility has been a Drupal core gate since version 7 - but live deployments still need careful attention.",
    sections: [
      {
        heading: "Drupal core accessibility",
        body:
          "Since Drupal 7, no patch can land in core if it introduces a WCAG 2.0 AA failure. Drupal 10 ships with semantic Olivero (frontend) and Claro (admin) themes that pass WCAG 2.1 AA out of the box.\n\nThis is rare among CMS platforms and worth protecting. Custom modules and themes are where most issues now appear.",
      },
      {
        heading: "Where Drupal sites typically fail",
        bullets: [
          "Custom Twig templates that drop landmarks, headings, or skip links from the base theme.",
          "Webform configurations missing fieldset/legend grouping for radio and checkbox sets.",
          "Views with table-based layouts, missing captions, or non-semantic pagers.",
          "Paragraphs and Layout Builder components built without keyboard support.",
          "Third-party modules - particularly slick carousel, video embeds, and chat widgets.",
        ],
      },
      {
        heading: "Our Drupal-specific approach",
        bullets: [
          "Audit Twig templates against the Olivero baseline to catch regressions.",
          "Review Webform configurations and Views for semantic structure.",
          "Replace inaccessible contrib modules with accessible equivalents (or custom components).",
          "CKEditor 5 plugin tuning so editors produce accessible content by default.",
          "axe-core integration via Drupal's testing framework to catch issues in CI.",
        ],
      },
      {
        heading: "Public-sector documentation",
        body:
          "EU public-sector Drupal sites must publish an accessibility statement using the eAccessibility statement template (Decision EU 2018/1523). The statement must include the conformance status, known non-conformities, the assessment method used, and a contact route for users to report issues.\n\nWe produce these statements as part of every audit and keep them refreshed after each release.",
      },
    ],
    related: [
      { href: "/resources/compliance/en-301-549", label: "EN 301 549", description: "Standard for EU public-sector Drupal." },
      { href: "/resources/technologies/typo3", label: "TYPO3", description: "Common DACH public-sector alternative." },
      { href: "/resources/guides/aria", label: "ARIA guide", description: "For Drupal Layout Builder components." },
    ],
    ctaTitle: "Public-sector Drupal site",
    ctaBody: "We audit EU public-sector Drupal sites to EN 301 549 V3.2.1 and produce the accessibility statement you need to publish.",
  },

  "tech-shopify": {
    breadcrumb: [...TECH_BC, { href: "/resources/technologies/shopify", label: "Shopify" }],
    kicker: "Technologies · E-commerce",
    title: "Shopify accessibility for EAA-bound",
    titleAccent: "merchants.",
    intro:
      "From 28 June 2025 every Shopify merchant selling into the EU above the SME threshold must comply with the European Accessibility Act. E-commerce is explicitly named in the directive - and Shopify has shifted accessibility responsibility onto merchants.",
    sections: [
      {
        heading: "Where Shopify accessibility breaks",
        bullets: [
          "Themes - even Shopify's own Dawn - drift below WCAG 2.2 AA when customised.",
          "Apps (review widgets, upsell pop-ups, sticky cart bars) frequently introduce keyboard traps and missing labels.",
          "Cart drawers and quick-view modals often have broken focus management.",
          "Variant selectors using buttons-as-radios without proper ARIA semantics.",
          "Checkout extensibility blocks added through Checkout UI Extensions without accessible markup.",
        ],
      },
      {
        heading: "Shopify's checkout responsibility",
        body:
          "Shopify maintains the core checkout pages and is responsible for their baseline accessibility. Merchants are responsible for everything before checkout (theme, product pages, cart) and any extensions or apps added to checkout via Checkout UI Extensions.\n\nIn 2024 Shopify confirmed in its Help Center that EAA compliance for the storefront is the merchant's obligation. Their accessibility statement covers the platform, not your storefront.",
      },
      {
        heading: "What to ask of overlay widgets",
        body:
          "Several vendors sell 'accessibility overlays' for Shopify (accessiBe, UserWay, EqualWeb). These do not bring a non-compliant store into EAA compliance - and EU regulators have been explicit that overlays are not a defence.\n\nA real audit and remediation, performed by humans, is the only path to compliance and the only one that protects your brand from public criticism.",
      },
      {
        heading: "What we deliver for Shopify merchants",
        bullets: [
          "Theme audit against WCAG 2.2 AA on real assistive tech (NVDA, JAWS, VoiceOver, TalkBack).",
          "App-by-app audit so you know which third-party tools are dragging your conformance down.",
          "Replacement recommendations for problematic apps and accessible Liquid components.",
          "EAA technical documentation file and EU declaration of conformity.",
          "Continuous monitoring across collection, product, cart, and account pages.",
        ],
      },
    ],
    related: [
      { href: "/eaa", label: "European Accessibility Act", description: "What e-commerce merchants must comply with." },
      { href: "/resources/checklists", label: "Checklists", description: "Including the EAA e-commerce checklist." },
      { href: "/services/audits", label: "Our audits", description: "What we cover and how we test." },
    ],
    ctaTitle: "Shopify store EAA-ready",
    ctaBody: "We audit Shopify Plus and standard stores against the EAA and WCAG 2.2 - overlay-free and merchant-owned.",
  },

  "tech-react": {
    breadcrumb: [...TECH_BC, { href: "/resources/technologies/react", label: "React" }],
    kicker: "Technologies · Framework",
    title: "Accessible React: components your team will actually",
    titleAccent: "ship.",
    intro:
      "React is now the default for new product builds across European enterprise. It can produce extremely accessible interfaces - or extremely inaccessible ones. The difference is rarely the framework; it is the component primitives the team chose.",
    sections: [
      {
        heading: "Pick the right primitives",
        body:
          "Building accessible custom components from scratch is genuinely hard - focus management, aria, keyboard, RTL, screen-reader announcements all stack up.\n\nUse a primitives library that handles this for you: Radix UI, React Aria (Adobe), or Headless UI (Tailwind Labs). All three are battle-tested across hundreds of production design systems and pass WCAG 2.2 AA in their default state.",
      },
      {
        heading: "Things React teams routinely get wrong",
        bullets: [
          "Forgetting to manage focus when routes change in single-page apps - screen reader users land in random places.",
          "Click-on-div instead of <button> - no keyboard, no role, no name.",
          "Custom select widgets that re-implement <select> badly. Use the native element or a tested combobox.",
          "Toasts and notifications without aria-live regions - the user never hears them.",
          "Modals without focus trapping, return-focus, or escape-to-close.",
          "Skeleton loaders that flicker for screen reader users because nothing announces 'loading'.",
        ],
      },
      {
        heading: "Testing React for accessibility",
        bullets: [
          "axe-core via @axe-core/react in dev to catch issues at runtime.",
          "jest-axe inside React Testing Library tests to fail PRs that ship a11y regressions.",
          "Storybook a11y addon so designers and PMs see accessibility issues in the component catalogue.",
          "Real screen reader tests on built artefacts with NVDA + Firefox and VoiceOver + Safari.",
          "Cypress or Playwright with @axe-core integration on critical user journeys.",
        ],
      },
      {
        heading: "Routing and announcements",
        body:
          "React Router and Next.js's app router do not announce route changes to screen readers by default. Your shell needs an aria-live polite region that updates with the new page title on every navigation.\n\nWe ship a tiny RouteAnnouncer component as part of every React engagement - about 40 lines of code that closes one of the most consistent a11y gaps in SPA architectures.",
      },
    ],
    related: [
      { href: "/resources/technologies/nextjs", label: "Next.js", description: "If you're using the most popular React framework." },
      { href: "/resources/guides/aria", label: "ARIA guide", description: "When you do need to author custom components." },
      { href: "/resources/guides/keyboard-accessibility", label: "Keyboard accessibility", description: "What every component must support." },
    ],
    ctaTitle: "React app needs an audit",
    ctaBody: "We audit React applications against WCAG 2.2 AA and pair with your engineers to fix issues in code, not in a 200-page PDF.",
  },

  "tech-nextjs": {
    breadcrumb: [...TECH_BC, { href: "/resources/technologies/nextjs", label: "Next.js" }],
    kicker: "Technologies · Framework",
    title: "Next.js accessibility from app router to",
    titleAccent: "production.",
    intro:
      "Next.js is now the default React framework for European enterprise. Server components, the app router, and edge rendering bring real accessibility benefits - and a few new pitfalls worth knowing about.",
    sections: [
      {
        heading: "What the app router gets right",
        bullets: [
          "Server components emit semantic HTML on first paint - screen readers see real content immediately.",
          "Built-in <Link> and useRouter encourage real anchor tags rather than click-on-div.",
          "next/image enforces alt props and ships responsive, lazy-loaded images by default.",
          "next/font self-hosts fonts with display:swap, preventing text from disappearing during load.",
          "Streaming with Suspense lets you announce 'loading' regions properly via aria-live.",
        ],
      },
      {
        heading: "Where Next.js sites still slip",
        bullets: [
          "Route changes are not announced to screen readers - you must add a RouteAnnouncer component.",
          "loading.tsx and error.tsx files often forget aria-live and role='status' / role='alert'.",
          "Client components added later in the project frequently regress accessibility because nothing tests them.",
          "Internationalised routes (i18n) sometimes ship with missing or wrong lang attributes on <html>.",
          "Middleware-driven redirects can lose focus state for keyboard users.",
        ],
      },
      {
        heading: "Recommended setup",
        bullets: [
          "Use Radix UI or React Aria for all interactive primitives.",
          "Add @axe-core/react in development; jest-axe in component tests.",
          "Set lang on <html> dynamically in the app/layout.tsx based on the active locale.",
          "Configure next/eslint with eslint-plugin-jsx-a11y rules at error level, not warning.",
          "Add a RouteAnnouncer to the root layout.",
        ],
      },
      {
        heading: "Sample RouteAnnouncer",
        code:
          `'use client';\nimport { usePathname } from 'next/navigation';\nimport { useEffect, useState } from 'react';\n\nexport function RouteAnnouncer() {\n  const pathname = usePathname();\n  const [msg, setMsg] = useState('');\n  useEffect(() => {\n    setMsg(\`Navigated to \${document.title}\`);\n  }, [pathname]);\n  return (\n    <div\n      role=\"status\"\n      aria-live=\"polite\"\n      style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}\n    >\n      {msg}\n    </div>\n  );\n}`,
      },
    ],
    related: [
      { href: "/resources/technologies/react", label: "React", description: "Component-level accessibility patterns." },
      { href: "/resources/guides/keyboard-accessibility", label: "Keyboard accessibility", description: "Essential for any SPA." },
      { href: "/resources/guides/screen-readers", label: "Screen readers", description: "How announcements actually work." },
    ],
    ctaTitle: "Next.js app due an",
    ctaBody: "We pair with Next.js teams to audit, remediate, and add CI checks that keep accessibility from regressing.",
  },

  // ───────── GUIDES ─────────
  "guide-aria": {
    breadcrumb: [...GUIDES_BC, { href: "/resources/guides/aria", label: "ARIA" }],
    kicker: "Guides · ARIA",
    title: "ARIA without breaking",
    titleAccent: "things.",
    intro:
      "ARIA - Accessible Rich Internet Applications - is a set of HTML attributes that supply roles, states, and properties to assistive technology. It is essential for accessible custom components and dangerous when misused. This guide shows you when to reach for it.",
    sections: [
      {
        heading: "The first rule of ARIA",
        body:
          "The W3C's first rule of ARIA is: do not use ARIA. Use a native HTML element with the right semantics first. <button>, <a>, <details>, <dialog>, <input type='checkbox'>, <select> all ship with full keyboard, focus, role, name, state, and screen-reader integration for free.\n\nReach for ARIA only when no native element fits - e.g. a tab interface, a tree view, or a custom combobox.",
      },
      {
        heading: "The five things ARIA actually does",
        bullets: [
          "Role - tells assistive tech what kind of widget this is (button, tab, dialog, slider, treeitem).",
          "Property - describes the widget (aria-label, aria-describedby, aria-required).",
          "State - communicates current state (aria-checked, aria-expanded, aria-selected, aria-disabled).",
          "Live regions - announce dynamic content changes (aria-live, aria-atomic, aria-relevant).",
          "Relationships - connect elements (aria-controls, aria-owns, aria-labelledby).",
        ],
      },
      {
        heading: "Patterns worth memorising",
        body:
          "The WAI-ARIA Authoring Practices Guide (APG) is the closest thing the web has to an accessible component spec. Use it as your reference for tabs, dialogs, comboboxes, treegrids, menus, and disclosure widgets.\n\nIf you are using Radix, React Aria, or Headless UI you already get APG-conformant implementations for free. The guide is still essential reading for anyone building custom widgets.",
      },
      {
        heading: "ARIA antipatterns we still see",
        bullets: [
          "role='button' on a <div> - gets you the role but no keyboard, no focus, no Enter/Space handling. Just use <button>.",
          "aria-label on every element 'for accessibility' - overrides the visible text and confuses users.",
          "aria-hidden='true' on focusable elements - leaves keyboard users on invisible content.",
          "Stacking redundant roles (role='button' on a real <button>) - ignored at best, breaking at worst.",
          "Live regions wrapped around the entire page - every minor change becomes a screen-reader storm.",
        ],
      },
    ],
    related: [
      { href: "/resources/guides/keyboard-accessibility", label: "Keyboard accessibility", description: "What ARIA can and can't fix." },
      { href: "/resources/guides/screen-readers", label: "Screen readers", description: "How ARIA is consumed in practice." },
      { href: "/resources/guides/wcag", label: "WCAG guide", description: "The requirements ARIA helps you meet." },
    ],
    ctaTitle: "Custom components need a",
    ctaBody: "We audit custom widgets against the WAI-ARIA APG patterns and pair with your engineers to fix issues at the source.",
  },

  "guide-keyboard": {
    breadcrumb: [...GUIDES_BC, { href: "/resources/guides/keyboard-accessibility", label: "Keyboard accessibility" }],
    kicker: "Guides · Keyboard",
    title: "Keyboard accessibility every developer should",
    titleAccent: "know.",
    intro:
      "Keyboard accessibility is the foundation of every other assistive-technology experience. Switch users, voice-control users, screen-reader users, and many people with motor or visual impairments rely entirely on the keyboard. WCAG 2.1.1 makes this non-negotiable.",
    sections: [
      {
        heading: "The basics",
        bullets: [
          "Every interactive element must be reachable via Tab and operable via Enter or Space (and arrow keys for composite widgets).",
          "Tab order must follow the logical visual order of the page (WCAG 2.4.3).",
          "Focus must always be visible - the default browser ring is the minimum (WCAG 2.4.7, 2.4.11).",
          "No keyboard traps - the user must always be able to Tab back out (WCAG 2.1.2).",
          "Custom shortcuts must be remappable or disableable (WCAG 2.1.4) - they often clash with assistive tech shortcuts.",
        ],
      },
      {
        heading: "Focus management for SPAs",
        body:
          "Single-page applications break the browser's default focus behaviour because the page never reloads. Three rules to follow:\n\n1. On route change, move focus to a sensible landing element - typically the new <h1> or main landmark.\n\n2. When a modal opens, move focus into it; when it closes, return focus to the element that opened it.\n\n3. When dynamic content appears (a panel, a step in a wizard), move focus to it so the user knows it arrived.",
      },
      {
        heading: "Focus indicators in 2026",
        body:
          "WCAG 2.2 added SC 2.4.11 Focus Appearance (minimum), which raises the bar for visible focus. The indicator must:\n\n• cover the focused element with at least a 2 CSS pixel solid outline,\n• have a contrast ratio of at least 3:1 against unfocused state,\n• not be obscured by other content.\n\nDesigners often want subtle focus styles. The compliant minimum is more visible than most designs ship - make this conversation early.",
      },
      {
        heading: "Test like a keyboard user",
        bullets: [
          "Unplug your mouse for an hour. Try to complete every critical user journey on your site.",
          "Watch where focus actually lands when modals open and close.",
          "Tab through the page and note any element you cannot see the focus on.",
          "Try Shift+Tab - backwards focus order surfaces issues forward Tab hides.",
          "Try Esc on every overlay. Try Enter on every link. Try Space on every button.",
        ],
      },
    ],
    related: [
      { href: "/resources/guides/aria", label: "ARIA guide", description: "When custom widgets need ARIA roles and states." },
      { href: "/resources/guides/screen-readers", label: "Screen readers", description: "How keyboard navigation drives speech output." },
      { href: "/tools/keyboard-tester", label: "Keyboard tester", description: "Our free interactive tester." },
    ],
    ctaTitle: "Need keyboard navigation",
    ctaBody: "We audit complete keyboard journeys on your site, document the failures, and pair with your team to fix them properly.",
  },

  "guide-screen-readers": {
    breadcrumb: [...GUIDES_BC, { href: "/resources/guides/screen-readers", label: "Screen readers" }],
    kicker: "Guides · Screen readers",
    title: "Designing and building for screen-reader",
    titleAccent: "users.",
    intro:
      "Roughly 8% of the global accessibility audience uses a screen reader as their primary mode of interacting with digital content. Building for them means building semantic HTML first, supplemented by ARIA only where necessary, and testing in the actual screen readers your users use.",
    sections: [
      {
        heading: "The four screen readers that matter",
        bullets: [
          "NVDA + Firefox or Chrome on Windows - the most common combination in Europe.",
          "JAWS + Chrome or Edge on Windows - dominant in enterprise and government.",
          "VoiceOver + Safari on macOS and iOS - required for any site with significant Apple traffic.",
          "TalkBack + Chrome on Android - essential if you have a mobile-first audience.",
        ],
      },
      {
        heading: "How screen readers actually read pages",
        body:
          "Screen readers do not read the page top to bottom like a human. They build a virtual document that includes headings, landmarks, links, form controls, and text. Users navigate that virtual document with single-key shortcuts - H for next heading, K for next link, F for next form field, R for next region.\n\nThis means heading hierarchy and landmark structure (header, nav, main, aside, footer) are not decoration. They are the primary navigation mechanism for your site.",
      },
      {
        heading: "Things to do, every page",
        bullets: [
          "Use exactly one <h1> per page that describes the page's purpose.",
          "Maintain a strict heading hierarchy - never skip a level.",
          "Wrap your real content in <main>, navigation in <nav>, complementary in <aside>.",
          "Provide skip-to-main-content links as the first focusable element.",
          "Set a sensible <title> that changes per route - VoiceOver reads it on load.",
          "Use aria-live='polite' regions to announce non-urgent updates (toasts, validation, results).",
        ],
      },
      {
        heading: "Common mistakes that ruin the experience",
        bullets: [
          "Decorative icons read aloud - wrap them in aria-hidden='true' or use empty alt='' on images.",
          "Long alt text on hero images - keep it under 150 characters and describe meaning, not appearance.",
          "Form errors that change visual styles but never announce - use role='alert' or aria-live='assertive' carefully.",
          "Modal dialogs without aria-labelledby - the dialog opens with no name announced.",
          "Loading skeletons that produce no audio cue - add 'Loading [content]' to a polite live region.",
        ],
      },
    ],
    related: [
      { href: "/resources/guides/aria", label: "ARIA guide", description: "How ARIA shapes screen-reader output." },
      { href: "/resources/guides/keyboard-accessibility", label: "Keyboard accessibility", description: "Drives screen-reader navigation." },
      { href: "/tools/screen-reader-preview", label: "Screen reader preview", description: "Our free preview tool." },
    ],
    ctaTitle: "Need a screen-reader",
    ctaBody: "We test on real NVDA, JAWS, VoiceOver, and TalkBack - not just an automated scan - and document every issue we find.",
  },
};
