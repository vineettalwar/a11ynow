"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, Info, GitBranch, BarChart3 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { useBtnGsapHover } from "@/hooks/use-btn-gsap-hover";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const alertSla = [
  {
    icon: AlertTriangle,
    severity: "Critical",
    tone: "text-red-600 bg-red-50 border-red-200",
    examples: "Keyboard trap, page unparseable by AT, contrast under 3:1 on body text",
    channel: "Email + Slack + on-call",
    sla: "Same business day",
  },
  {
    icon: AlertCircle,
    severity: "Serious",
    tone: "text-orange-600 bg-orange-50 border-orange-200",
    examples: "Missing form labels, broken focus order, ARIA misuse on interactive controls",
    channel: "Email + Slack",
    sla: "Within 24 h",
  },
  {
    icon: Info,
    severity: "Moderate / Minor",
    tone: "text-muted-foreground bg-muted/40 border-border",
    examples: "Heading skips, redundant alt text, decorative SVG without aria-hidden",
    channel: "Weekly digest",
    sla: "Weekly",
  },
];

const dashboardMetrics = [
  { label: "Conformance score", sample: "94 / 100", note: "Weighted by WCAG severity, journey traffic, and recency." },
  { label: "Open violations", sample: "0 critical · 3 serious · 17 minor", note: "Deduplicated across pages and components." },
  { label: "Regression delta", sample: "+2 since last scan", note: "Diff against the prior baseline, with the offending pages flagged." },
  { label: "Coverage", sample: "URLs scanned this cycle", note: "Public pages crawled. Auth-gated journeys checked manually each quarter." },
  { label: "Time to first fix", sample: "Tracked rolling 90 days", note: "From regression alert to merged PR (when paired with Remediation)." },
  { label: "AT spot-checks", sample: "NVDA · JAWS · VO · TalkBack", note: "Quarterly manual passes, tagged per assistive tech." },
];

const ciSnippet = `# .github/workflows/a11y.yml
# Starter workflow we configure during onboarding.
# 100% public actions - no proprietary lock-in.
name: Accessibility checks
on: [pull_request]

jobs:
  axe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npx serve -l 3000 dist &
      - run: npx wait-on http://localhost:3000

      - name: Run axe-core (WCAG 2.2 AA)
        uses: dequelabs/axe-core-action@v3
        with:
          urls: http://localhost:3000
          rules: wcag22aa
          fail-on: serious

      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: axe-results
          path: axe-results.json`;

const processSteps = [
  { number: "01", title: "Baseline", body: "We audit once to set the verified WCAG benchmark. Becomes the diff target for every future scan." },
  { number: "02", title: "Monthly scans", body: "axe-core + Pa11y across all in-scope URLs, including authenticated journeys via headless browser." },
  { number: "03", title: "PR gating", body: "Optional GitHub / GitLab Action blocks merges that introduce serious or critical regressions." },
  { number: "04", title: "Quarterly review", body: "Trend walk-through with a senior engineer, scope updates, planning for upcoming releases." },
];

const faqs: FaqItem[] = [
  { question: "Is it just automated scans?", answer: "Automated is the backbone. We add quarterly manual spot-checks on high-risk components, regression alerting, and on-demand consult hours. Fully manual monthly testing is an add-on." },
  { question: "Will the CI gate slow our team down?", answer: "No - the gate runs in parallel to your other PR checks (typically 60–90 s) and only blocks on serious or critical regressions, configurable per repo. We tune sensitivity with you in week one." },
  { question: "What if a regression sneaks through?", answer: "Same-day fix or refund. Critical regressions detected post-deploy are remediated by us at no extra cost - it's the point of the retainer." },
];

export default function Monitoring() {
  const heroRef = useSectionReveal<HTMLElement>();
  const ciRef = useSectionReveal<HTMLElement>();
  const slaRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const dashRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const processRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const faqRef = useSectionReveal<HTMLElement>();
  const ctaRef = useSectionReveal<HTMLElement>();
  const pageRef = useRef<HTMLDivElement>(null);

  useBtnGsapHover(pageRef, 0.18);

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4 font-sans">Monitoring</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Stay compliant<br />
            <span className="heading-accent">as you ship.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Automated scans + PR-level gating + quarterly manual spot-checks. Critical regressions caught the same day, not the next audit.
          </p>
        </div>
      </section>

      <section ref={ciRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">CI integration</p>
          <h2 className="text-display-md font-extrabold mb-3">
            Drop one file in <span className="heading-accent">.github/workflows.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-2xl mb-10 reveal-body">
            We configure this workflow in your repo during onboarding. It runs axe-core on every PR against WCAG 2.2 AA, blocks serious regressions, and uploads the report as a build artifact. All real, public actions - nothing proprietary.
          </p>
          <div className="rounded-2xl border border-border overflow-hidden bg-foreground">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <GitBranch className="w-4 h-4 text-primary" />
                <span className="text-xs text-white font-bold font-sans">.github/workflows/a11y.yml</span>
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-sans">GitHub Actions</span>
            </div>
            <pre
              className="p-6 text-xs leading-relaxed text-white/90 overflow-x-auto"
              style={{ fontFamily: "var(--app-font-mono)" }}
            >
{ciSnippet}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground mt-5 max-w-2xl" style={{ fontFamily: "var(--app-font-mono)" }}>
            The same pattern translates to GitLab CI, Bitbucket Pipelines, or Jenkins on request.
          </p>
        </div>
      </section>

      <section ref={slaRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Alert SLA</p>
          <h2 className="text-display-md font-extrabold mb-3">
            Severity in. <span className="heading-accent">Response out.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            Every alert is classified at source. Critical issues hit on-call within the business day. Minor noise stays out of your inbox.
          </p>
          <div className="space-y-3">
            {alertSla.map(({ icon: Icon, severity, tone, examples, channel, sla }) => (
              <div key={severity} className={["reveal-child grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-5 rounded-2xl border", tone].join(" ")}>
                <div className="md:col-span-3 flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <p className="font-extrabold text-sm font-sans">{severity}</p>
                </div>
                <p className="md:col-span-5 text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "var(--app-font-mono)" }}>
                  {examples}
                </p>
                <p className="md:col-span-2 text-xs text-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
                  {channel}
                </p>
                <p className="md:col-span-2 text-xs font-bold text-foreground font-sans md:text-right">{sla}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={dashRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Monthly report</p>
          <h2 className="text-display-md font-extrabold mb-3">
            What your team <span className="heading-accent">actually gets.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            A signed PDF + raw data export every month. Sharable with legal and procurement, archivable for your conformance file.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardMetrics.map((m) => (
              <div key={m.label} className="reveal-child flex flex-col p-6 rounded-2xl border bg-background">
                <div className="flex items-center gap-2.5 mb-3">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-sans">{m.label}</p>
                </div>
                <p className="font-extrabold text-lg font-sans mb-2.5">{m.sample}</p>
                <p className="text-muted-foreground text-xs leading-relaxed" style={{ fontFamily: "var(--app-font-mono)" }}>
                  {m.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={processRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">How it works</p>
          <h2 className="text-display-md font-extrabold mb-10">
            From baseline to <span className="heading-accent">ongoing.</span>
          </h2>
          <div className="flex flex-col gap-0">
            {processSteps.map(({ number, title, body }, i) => (
              <div key={number} className="reveal-child flex gap-8 relative">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                    <span className="text-primary font-extrabold text-sm font-mono">{number}</span>
                  </div>
                  {i < processSteps.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2 mb-2 min-h-[2.5rem]" />
                  )}
                </div>
                <div className="pb-10 pt-2">
                  <h3 className="font-bold text-base font-sans mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={faqRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-display-md font-extrabold mb-10">
            Common <span className="heading-accent">questions.</span>
          </h2>
          <FaqAccordion items={faqs} />
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 warm-section text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Protect your<br />
            <span className="heading-accent">compliance investment.</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            One regression can undo months of work. A retainer keeps you covered - automatically, end to end.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact?service=monitoring">Start a retainer</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
