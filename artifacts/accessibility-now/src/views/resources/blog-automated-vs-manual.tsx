"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { useBtnGsapHover } from "@/hooks/use-btn-gsap-hover";
import { ArrowLeft, Clock, Check, X } from "lucide-react";

const AUTOMATED_CAN = [
  "Missing alt attributes on images",
  "Insufficient colour contrast ratios",
  "Form inputs without associated labels",
  "Missing or duplicate page titles",
  "Missing lang attribute on <html>",
  "Duplicate id attributes on a page",
  "Links with no accessible name",
  "Buttons with no accessible name",
  "Images of text (for most cases)",
  "Video content missing a <track> element",
  "aria-* attribute typos and invalid values",
  "Role attribute invalid values",
];

const AUTOMATED_CANNOT = [
  "Whether alt text is meaningful or correct",
  "Logical heading hierarchy in context",
  "Focus order that makes sense for the flow",
  "Colour used as the only indicator (requires understanding context)",
  "Keyboard operability of complex interactive widgets",
  "Screen reader announcement quality for dynamic content",
  "Cognitive load and reading level",
  "Whether error messages are specific and actionable",
  "Reflow quality and layout at 320px-equivalent",
  "Session timeout UX and warnings",
  "Whether a skip link actually works correctly",
  "Accessibility of SVG graphics and data visualisations",
];

const TOOLS = [
  {
    name: "axe-core",
    type: "Library / browser extension",
    strengths: "High signal-to-noise ratio. Low false positive rate. Used by Deque Systems. Browser extension and CLI versions. Can integrate into CI/CD.",
    limitations: "Conservative - misses more than it flags. Does not test dynamic interactions.",
    best: "Unit and integration testing in your test suite. Baseline CI checks.",
  },
  {
    name: "Lighthouse",
    type: "Browser DevTools / CI",
    strengths: "Built into Chrome DevTools. Covers accessibility as part of a broader audit. Easy to run. Integrates with GitHub Actions.",
    limitations: "Uses axe-core under the hood, so shares its coverage limitations. Score is a snapshot of the initial page state only.",
    best: "Initial baseline assessment. Regression checks in CI pipelines.",
  },
  {
    name: "WAVE",
    type: "Browser extension",
    strengths: "Visual annotation directly on the page. Good for developer education. Shows errors, alerts, and structural elements.",
    limitations: "High alert volume can obscure real errors. Not suitable for CI/CD. No API.",
    best: "Developer education and initial visual exploration of a page.",
  },
  {
    name: "Pa11y",
    type: "CLI / Node library",
    strengths: "Headless. Scriptable. Can crawl multiple pages. Multiple rule engine options (htmlcs, axe). Easy to integrate in CI.",
    limitations: "Less context-aware than browser extensions. Requires configuration to test authenticated pages.",
    best: "Large-scale automated scanning of public pages. CI/CD pipeline integration.",
  },
];

export default function BlogAutomatedVsManual() {
  const heroRef = useSectionReveal<HTMLElement>();
  const bodyRef = useSectionReveal<HTMLElement>();
  const ctaRef = useSectionReveal<HTMLElement>();
  const pageRef = useRef<HTMLDivElement>(null);

  useBtnGsapHover(pageRef, 0.18);

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link href="/resources/blog" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-8 font-sans">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to blog
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-sans uppercase tracking-wider">
              Testing
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="w-3.5 h-3.5" /> 8 min read
            </span>
            <span className="text-xs text-muted-foreground font-mono">March 2025</span>
          </div>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Automated vs manual<br />
            <span className="heading-accent">accessibility testing.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Automated scanners are fast, cheap, and consistent. They are also incomplete. Understanding
            what they can and cannot find -- and why manual testing is non-negotiable for EAA compliance
            -- will change how you plan your testing strategy.
          </p>
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border/40">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold font-sans text-primary shrink-0" aria-hidden="true">
              MC
            </div>
            <div>
              <p className="text-sm font-bold font-sans leading-tight">Marcus Chen</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>Engineering & Strategy · 8 min read</p>
            </div>
          </div>
        </div>
      </section>

      <section ref={bodyRef} className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-0">
              The 30% figure
            </h2>
            <p>
              The most widely cited statistic in accessibility testing is that automated tools catch around
              30--40% of WCAG violations. This figure comes from research by Deque, WebAIM, and others who
              have applied automated tools to large page samples and compared the results to manual audits.
            </p>
            <p>
              The exact percentage varies by product type. For a simple marketing page with minimal
              interactivity, automated tools might catch 50--60% of issues. For a complex SPA with rich
              interactive components -- a checkout flow, a data table with dynamic filtering, a dashboard
              with custom controls -- the number drops closer to 20--25%.
            </p>
            <p>
              The important thing to understand is why automated tools have this ceiling. It is not a
              tooling quality problem -- it is a structural limitation of what static or DOM-level analysis
              can determine without human judgment.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-12">
              What automated tools can detect
            </h2>
          </div>

          {/* Comparison tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-8">
            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-green-50 px-5 py-4 border-b flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <p className="font-bold text-sm font-sans text-green-800">Automated tools CAN detect</p>
              </div>
              <ul className="divide-y">
                {AUTOMATED_CAN.map((item) => (
                  <li key={item} className="px-5 py-3 text-xs text-muted-foreground flex items-start gap-2.5" style={{ fontFamily: "var(--app-font-mono)" }}>
                    <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-red-50 px-5 py-4 border-b flex items-center gap-2">
                <X className="w-4 h-4 text-red-600" />
                <p className="font-bold text-sm font-sans text-red-800">Automated tools CANNOT detect</p>
              </div>
              <ul className="divide-y">
                {AUTOMATED_CANNOT.map((item) => (
                  <li key={item} className="px-5 py-3 text-xs text-muted-foreground flex items-start gap-2.5" style={{ fontFamily: "var(--app-font-mono)" }}>
                    <X className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>
            <p>
              To understand why alt text quality cannot be automated: a tool can detect that an alt attribute
              is present. It cannot determine whether the text 'red shoe product photo' is an adequate
              description of a product image for a user who cannot see it. That judgment requires a human
              with contextual knowledge of the product and user need.
            </p>
            <p>
              Similarly, a tool can detect that interactive elements have a tabindex attribute. It cannot
              simulate a keyboard user navigating through a complex form and determine whether the tab order
              is logical for the task being completed. That requires a tester who understands both keyboard
              navigation and the intended user journey.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-12">
              What manual testing involves
            </h2>
            <p>
              A thorough manual audit typically comprises three layers of testing:
            </p>
            <ol>
              <li>
                <strong>Keyboard-only testing.</strong> Navigate the entire product using only Tab, Shift+Tab,
                Enter, Space, and arrow keys. Verify that all functionality is reachable, operable, and
                logical in the tab sequence. This catches keyboard traps, illogical focus order, and
                components that respond to mouse events only.
              </li>
              <li>
                <strong>Screen reader testing.</strong> Test with at least two screen reader / browser
                combinations: typically NVDA + Firefox and VoiceOver + Safari (covering the two most
                common screen reader engines). Listen to how the product is announced -- heading structure,
                link names, interactive component states, dynamic updates, form error messages.
              </li>
              <li>
                <strong>Cognitive and visual review.</strong> Review content for readability, predictability,
                and error recoverability. Check that forms provide clear labels and instructions. Verify that
                error messages are specific and actionable. Assess whether session timeouts are handled
                appropriately.
              </li>
            </ol>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-12">
              Automated testing tools compared
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border my-8">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-5 py-3.5 font-bold font-sans uppercase tracking-wider text-muted-foreground">Tool</th>
                  <th className="text-left px-5 py-3.5 font-bold font-sans uppercase tracking-wider text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="text-left px-5 py-3.5 font-bold font-sans uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Strengths</th>
                  <th className="text-left px-5 py-3.5 font-bold font-sans uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Limitations</th>
                  <th className="text-left px-5 py-3.5 font-bold font-sans uppercase tracking-wider text-muted-foreground">Best for</th>
                </tr>
              </thead>
              <tbody>
                {TOOLS.map((tool, i) => (
                  <tr key={tool.name} className={`border-b last:border-b-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                    <td className="px-5 py-4 font-bold font-sans">{tool.name}</td>
                    <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{tool.type}</td>
                    <td className="px-5 py-4 text-muted-foreground leading-relaxed hidden lg:table-cell max-w-xs">{tool.strengths}</td>
                    <td className="px-5 py-4 text-muted-foreground leading-relaxed hidden lg:table-cell max-w-xs">{tool.limitations}</td>
                    <td className="px-5 py-4 text-muted-foreground leading-relaxed max-w-xs">{tool.best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>
            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-4">
              The right testing strategy
            </h2>
            <p>
              Automated and manual testing are not alternatives -- they are complements. The optimal
              strategy uses each for what it does best.
            </p>
            <p>
              <strong>Use automated tools for:</strong> Early detection of programmatic failures during
              development. CI/CD gates that prevent regressions from being shipped. Continuous monitoring
              of production pages. Initial baseline assessment of a large page inventory.
            </p>
            <p>
              <strong>Use manual testing for:</strong> Pre-release acceptance testing of new features.
              Audit of your critical user journeys (purchase funnel, authentication flow, onboarding).
              Verification that your conformance statement is accurate. Testing with real users who have
              disabilities (which adds insight no tool or expert tester can replicate).
            </p>
            <p>
              For EAA compliance specifically, a credible conformance claim requires evidence of manual
              testing. An audit report based solely on Lighthouse scores will not satisfy enforcement
              authorities or sophisticated procurement teams. WCAG 2.1 AA conformance is only achievable
              through a combination of automated and manual evaluation.
            </p>
            <p>
              The audit process we recommend: start with an automated baseline scan (which this platform
              provides) to triage the low-hanging fruit and get a directional score. Then commission a
              manual audit of your key user journeys. Automate regression checks in CI to protect the
              gains. Re-audit annually, or after significant product changes.
            </p>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 warm-section text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Start with<br />
            <span className="heading-accent">the automated layer.</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Run a free scan to get your baseline score -- then let us scope the manual audit that takes you to full AA conformance.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free scan &#8594;</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/services/audits">Manual audit details</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
