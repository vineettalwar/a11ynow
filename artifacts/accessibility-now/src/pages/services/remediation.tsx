import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GitPullRequest, CalendarDays, FileCode2 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const stacks = [
  { name: "React / Next.js", level: "Specialist", note: "App Router, RSC, headless UI, Radix, shadcn/ui" },
  { name: "Vue / Nuxt", level: "Specialist", note: "Composition API, Vuetify, PrimeVue" },
  { name: "Angular", level: "Specialist", note: "v15+, Angular Material, CDK a11y" },
  { name: "Svelte / SvelteKit", level: "Working", note: "Bits UI, Skeleton" },
  { name: "Plain HTML / CSS / JS", level: "Specialist", note: "Server-rendered, jQuery legacy, web components" },
  { name: "iOS Swift / SwiftUI", level: "Working", note: "UIKit accessibility, VoiceOver rotor, Dynamic Type" },
  { name: "Android Kotlin / Compose", level: "Working", note: "TalkBack, Material 3 a11y" },
  { name: "WordPress / Drupal", level: "Working", note: "Theme & block-editor patches" },
];

const sprintCadence = [
  { day: "Mon", work: "Sprint planning", body: "We confirm scope from the audit backlog. Pick highest-impact, lowest-risk first." },
  { day: "Tue – Wed", work: "Code & test", body: "Engineers implement fixes locally, test with NVDA / VoiceOver / keyboard." },
  { day: "Thu", work: "PR review", body: "Internal a11y peer review on every PR before it touches your repo." },
  { day: "Fri", work: "Hand-off", body: "PRs raised against your branch with WCAG citations. You merge on your cadence." },
];

const processSteps = [
  { number: "01", title: "Audit review", body: "We triage your existing report by effort, risk, and dependency. Out: a prioritised backlog with sprint estimates." },
  { number: "02", title: "Sprint planning", body: "Weekly or fortnightly sprints aligned to your cadence. Each sprint has a fixed scope and acceptance criteria." },
  { number: "03", title: "Code & PRs", body: "Fixes go straight into your codebase. Each PR cites the WCAG criterion it resolves and includes test notes." },
  { number: "04", title: "Test & sign-off", body: "Screen-reader and keyboard-tested before the PR lands. Verified against the original report and re-scanned." },
];

const faqs: FaqItem[] = [
  { question: "Do we need an audit first?", answer: "Ideally yes - it's how we scope. If you don't have one we'll run an audit first or in parallel for time-sensitive work. We accept third-party audits and will rescore them in our format before sprint zero." },
  { question: "How do you access our codebase?", answer: "We work directly in your VCS - GitHub, GitLab, Bitbucket, Azure DevOps. Read/write access to the relevant repos. All changes go through your normal PR review. We never push to main." },
  { question: "How many fixes per sprint?", answer: "A two-week sprint typically resolves 15–30 moderate issues or 5–10 architectural fixes. We scope conservatively and deliver what's committed - no padding, no overruns." },
];

export default function Remediation() {
  const heroRef = useSectionReveal<HTMLElement>();
  const codeRef = useSectionReveal<HTMLElement>();
  const stacksRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const cadenceRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const processRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const faqRef = useSectionReveal<HTMLElement>();
  const ctaRef = useSectionReveal<HTMLElement>();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const buttons = el.querySelectorAll<HTMLElement>(".btn-gsap");
    const cleanups: (() => void)[] = [];
    buttons.forEach((btn) => {
      const enter = () => gsap.to(btn, { scale: 1.04, duration: 0.18, ease: "power2.out" });
      const leave = () => gsap.to(btn, { scale: 1, duration: 0.18, ease: "power2.out" });
      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);
      cleanups.push(() => { btn.removeEventListener("mouseenter", enter); btn.removeEventListener("mouseleave", leave); });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4 font-sans">Remediation</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            We don't just report.<br />
            <span className="heading-accent">We fix.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Senior engineers ship the fixes as PRs into your repo, on your sprint cadence. WCAG-cited, peer-reviewed, regression-tested.
          </p>
        </div>
      </section>

      <section ref={codeRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Sample fix</p>
          <h2 className="text-display-md font-extrabold mb-3">
            What an actual <span className="heading-accent">PR looks like.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-2xl mb-10 reveal-body">
            Every PR ships with the WCAG citation, the failing condition, and a working diff your team can merge as-is. No screenshots-only reports.
          </p>

          <div className="rounded-2xl border border-border overflow-hidden bg-foreground">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-foreground">
              <div className="flex items-center gap-3">
                <GitPullRequest className="w-4 h-4 text-primary" />
                <span className="text-xs text-white font-bold font-sans">fix(a11y): name icon-only close button</span>
              </div>
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-sans">WCAG 4.1.2 · 2.4.7</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3 font-sans">- Before</p>
                <pre className="text-xs leading-relaxed text-white/80 overflow-x-auto" style={{ fontFamily: "var(--app-font-mono)" }}>
{`<button
  onClick={onClose}
  className="p-2 rounded">
  <XIcon />
</button>`}
                </pre>
                <p className="mt-4 text-[11px] text-white/50 leading-relaxed" style={{ fontFamily: "var(--app-font-mono)" }}>
                  No accessible name. No visible focus ring. Screen-reader announces "button" with no purpose.
                </p>
              </div>
              <div className="p-6 bg-primary/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 font-sans">+ After</p>
                <pre className="text-xs leading-relaxed text-white overflow-x-auto" style={{ fontFamily: "var(--app-font-mono)" }}>
{`<button
  type="button"
  onClick={onClose}
  aria-label="Close dialog"
  className="p-2 rounded
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-primary">
  <XIcon aria-hidden="true" />
</button>`}
                </pre>
                <p className="mt-4 text-[11px] text-white/70 leading-relaxed" style={{ fontFamily: "var(--app-font-mono)" }}>
                  Named for AT, icon hidden from AT, explicit type, 2px ring meets 2.4.11 / 2.4.7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section ref={stacksRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Stacks we ship in</p>
          <h2 className="text-display-md font-extrabold mb-3">
            <span className="heading-accent">Real production</span> stacks.
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            Eight years of accessibility-first React, Vue, Angular, mobile, and legacy work. We don't bluff stack fit - if it's not on this list, we'll tell you.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stacks.map((s) => (
              <div key={s.name} className="reveal-child flex items-start gap-4 p-5 rounded-xl border bg-background">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileCode2 className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="font-bold text-sm font-sans">{s.name}</p>
                    <span
                      className={[
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full font-sans shrink-0",
                        s.level === "Specialist" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {s.level}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed" style={{ fontFamily: "var(--app-font-mono)" }}>
                    {s.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={cadenceRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Sprint cadence</p>
          <h2 className="text-display-md font-extrabold mb-3">
            What a typical week<br />
            <span className="heading-accent">actually looks like.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            One example two-week sprint. Yours can run weekly, fortnightly, or against your own cadence.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {sprintCadence.map((s) => (
              <div key={s.day} className="reveal-child flex flex-col p-6 rounded-2xl border bg-background relative">
                <div className="flex items-center gap-2.5 mb-4">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground font-sans">{s.day}</span>
                </div>
                <p className="font-extrabold text-base font-sans mb-2">{s.work}</p>
                <p className="text-muted-foreground text-xs leading-relaxed flex-1">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={processRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Engagement</p>
          <h2 className="text-display-md font-extrabold mb-10">
            The <span className="heading-accent">process.</span>
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

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Got a backlog of issues<br />
            <span className="heading-accent">and no bandwidth?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Send us your audit. We'll send back a sprint plan with a fixed first-sprint scope inside 48 hours.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact?service=remediation">Discuss your roadmap</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
