import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronRight, Search } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

type Term = { term: string; short: string; body: string };

const TERMS: Term[] = [
  { term: "ACR", short: "Accessibility Conformance Report", body: "A completed VPAT - the published document a vendor provides to demonstrate how a specific product version conforms with WCAG, Section 508, or EN 301 549." },
  { term: "ADA", short: "Americans with Disabilities Act", body: "U.S. civil rights law from 1990. Title III is regularly applied to private-sector websites and mobile apps; WCAG 2.1 AA is the de facto standard regulators use." },
  { term: "AODA", short: "Accessibility for Ontarians with Disabilities Act", body: "Ontario provincial law requiring WCAG 2.0 AA conformance for most public-sector and private organisations with 50+ Ontario employees." },
  { term: "ARIA", short: "Accessible Rich Internet Applications", body: "A W3C specification defining HTML attributes (roles, states, properties) used to make custom widgets understandable to assistive technology." },
  { term: "Assistive technology", short: "AT", body: "Hardware or software that helps people with disabilities access content. Includes screen readers, switches, voice control, magnification, refreshable braille displays." },
  { term: "axe-core", short: "Open-source rules engine", body: "Deque's open-source accessibility rules engine used by most modern testing tools and CI integrations. Catches roughly 30–40% of WCAG issues automatically." },
  { term: "BFSG", short: "Barrierefreiheitsstärkungsgesetz", body: "Germany's transposition of the European Accessibility Act, in force from 28 June 2025. Penalties up to €100,000 plus product withdrawal." },
  { term: "CSUN", short: "California State University Northridge Conference", body: "The largest annual assistive technology conference in the world, held each March." },
  { term: "EAA", short: "European Accessibility Act", body: "EU Directive 2019/882, applied from 28 June 2025. Requires accessibility for a broad range of consumer products and digital services across the EU single market." },
  { term: "EN 301 549", short: "European accessibility standard", body: "The harmonised European standard for ICT accessibility (V3.2.1). Referenced by the EAA, the Web Accessibility Directive, and EU procurement rules." },
  { term: "Focus indicator", short: "Visible focus", body: "The visual outline shown around the currently focused element. WCAG 2.4.7 (Level AA) and 2.4.11 (Level AA, new in 2.2) define the requirements." },
  { term: "Headings", short: "h1–h6", body: "The structural skeleton of a page used by screen readers as a primary navigation mechanism. Hierarchy must be strict - never skip a level." },
  { term: "JAWS", short: "Job Access With Speech", body: "Commercial Windows screen reader by Vispero, dominant in U.S. enterprise and government. Roughly 40% of screen-reader users globally as of 2024 WebAIM survey." },
  { term: "Landmark", short: "Semantic region", body: "Top-level page regions screen readers can jump between: header, nav, main, aside, footer, search, form. Defined by HTML elements or ARIA roles." },
  { term: "Live region", short: "aria-live", body: "An ARIA mechanism for announcing dynamic content changes to screen readers. 'polite' waits, 'assertive' interrupts. Use sparingly and intentionally." },
  { term: "NVDA", short: "NonVisual Desktop Access", body: "Free open-source Windows screen reader by NV Access. The most-used screen reader in Europe and increasingly worldwide." },
  { term: "Overlay", short: "Accessibility overlay", body: "Third-party widget claiming to make a site accessible automatically (accessiBe, UserWay, EqualWeb). Has been rejected as a defence by U.S. courts and EU regulators alike." },
  { term: "POUR", short: "Perceivable, Operable, Understandable, Robust", body: "The four foundational principles of WCAG. Every success criterion sits under one of them." },
  { term: "PSBAR", short: "Public Sector Bodies Accessibility Regulations", body: "U.K. regulation transposing the Web Accessibility Directive. Public-sector sites must meet WCAG 2.2 AA." },
  { term: "RGAA", short: "Référentiel général d'amélioration de l'accessibilité", body: "France's national accessibility framework, aligned with WCAG and EN 301 549. Required for public-sector sites since 2009; expanded to large private companies under the EAA transposition." },
  { term: "Screen reader", short: "AT category", body: "Software that reads aloud the structured content of a screen. Common ones: NVDA, JAWS, VoiceOver, TalkBack, Narrator." },
  { term: "Section 508", short: "Rehabilitation Act §508", body: "U.S. federal law requiring agencies and their suppliers to make ICT accessible. Refreshed in 2018 to align with WCAG 2.0 AA." },
  { term: "Skip link", short: "Skip to content", body: "A keyboard-accessible link, typically the first focusable element on a page, that lets users bypass repeated navigation. Required for WCAG 2.4.1." },
  { term: "TalkBack", short: "Android screen reader", body: "Google's built-in Android screen reader. Required testing target for any mobile app or mobile-first site." },
  { term: "VoiceOver", short: "Apple screen reader", body: "Apple's built-in screen reader on macOS, iOS, iPadOS, watchOS, and tvOS. Use with Safari for the most reliable behaviour." },
  { term: "VPAT", short: "Voluntary Product Accessibility Template", body: "A template (currently version 2.5 INT) used to document conformance with WCAG, Section 508, and EN 301 549. Procurement teams worldwide ask for it." },
  { term: "WAD", short: "Web Accessibility Directive", body: "EU Directive 2016/2102 requiring public-sector websites and apps to meet EN 301 549 (and therefore WCAG 2.1 AA). In force since 2020." },
  { term: "WAI-ARIA", short: "WAI ARIA", body: "Same as ARIA, formally hosted under the W3C's Web Accessibility Initiative." },
  { term: "WCAG", short: "Web Content Accessibility Guidelines", body: "The W3C's foundational web accessibility standard. Current version is WCAG 2.2 (October 2023). WCAG 3 is in early draft." },
  { term: "WebAIM", short: "Web Accessibility In Mind", body: "Non-profit research group at Utah State University. Their annual WebAIM Million survey of homepage accessibility is the de facto industry benchmark." },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Glossary() {
  const [query, setQuery] = useState("");
  const heroRef = useSectionReveal<HTMLDivElement>();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TERMS;
    return TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.short.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Term[]>();
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const presentLetters = new Set(grouped.map(([l]) => l));

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-20 pb-14 px-4">
        <div ref={heroRef} className="container mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground reveal-child">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/resources" className="hover:text-foreground transition-colors">Resources</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Glossary</span>
          </nav>
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">Resources · Glossary</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Accessibility <span className="heading-accent">glossary.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed mb-8">
            Plain-English definitions for the acronyms, regulations, and jargon you will hear from accessibility consultants, regulators, and procurement teams.
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search terms…"
              className="w-full pl-11 pr-4 py-3 rounded-full border bg-white text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Search glossary"
            />
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-white border-b sticky top-14 z-20 backdrop-blur-sm bg-white/90">
        <div className="container mx-auto max-w-5xl flex flex-wrap gap-2 justify-center">
          {ALPHABET.map((l) => (
            <a
              key={l}
              href={presentLetters.has(l) ? `#letter-${l}` : undefined}
              aria-disabled={!presentLetters.has(l)}
              className={[
                "w-8 h-8 rounded-md flex items-center justify-center text-xs font-mono font-bold transition-colors",
                presentLetters.has(l)
                  ? "text-foreground hover:bg-primary hover:text-white"
                  : "text-muted-foreground/30 cursor-default",
              ].join(" ")}
            >
              {l}
            </a>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          {grouped.length === 0 && (
            <p className="text-center text-muted-foreground py-20">No matches for "{query}".</p>
          )}
          {grouped.map(([letter, terms]) => (
            <div key={letter} id={`letter-${letter}`} className="mb-14 scroll-mt-32">
              <h2 className="text-5xl font-extrabold mb-6 heading-accent inline-block">{letter}</h2>
              <dl className="space-y-8">
                {terms.map((t) => (
                  <div key={t.term} className="border-l-2 border-border pl-5 hover:border-primary transition-colors">
                    <dt className="font-extrabold text-lg font-sans">
                      {t.term}
                      <span className="ml-3 text-xs font-mono font-medium text-muted-foreground">{t.short}</span>
                    </dt>
                    <dd className="text-muted-foreground text-sm md:text-base leading-relaxed mt-2">{t.body}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 warm-section">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-display-md font-extrabold mb-4">
            Spotted a missing <span className="heading-accent">term?</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-sm md:text-base max-w-xl mx-auto">
            Email us and we will add it. We update the glossary as new regulations and standards land.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Suggest a term
          </Link>
        </div>
      </section>
    </div>
  );
}
