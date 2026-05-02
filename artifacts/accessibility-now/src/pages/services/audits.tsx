import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Search, Code, ShieldCheck } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const included = [
  {
    title: "Comprehensive violations report",
    body: "Detailed breakdown of every issue mapped directly to WCAG success criteria.",
  },
  {
    title: "Severity tagging",
    body: "Issues are prioritised by impact — Critical, Serious, Moderate, Minor — to guide remediation.",
  },
  {
    title: "Screen reader testing",
    body: "Manual testing across NVDA/Firefox, JAWS/Chrome, and VoiceOver/Safari.",
  },
  {
    title: "Keyboard navigation testing",
    body: "Ensuring all interactive elements are reachable and operable via keyboard only.",
  },
  {
    title: "Colour contrast analysis",
    body: "Every text and UI component measured against WCAG 2.1 AA and AAA thresholds.",
  },
  {
    title: "ARIA and semantic HTML audit",
    body: "Review of landmark regions, heading hierarchy, live regions, and role usage.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Scoping call",
    body: "We define the pages, journeys, and WCAG conformance level in scope. You receive a clear statement of work before anything begins.",
  },
  {
    number: "02",
    title: "Automated baseline scan",
    body: "We run a comprehensive automated scan across all in-scope URLs to capture machine-detectable violations and establish a baseline.",
  },
  {
    number: "03",
    title: "Manual expert testing",
    body: "Senior accessibility engineers test every user journey with real screen readers, keyboard-only navigation, and WCAG criterion checklists.",
  },
  {
    number: "04",
    title: "Report delivery",
    body: "You receive a detailed, developer-ready report with every issue categorised by severity, mapped to WCAG criteria, and accompanied by fix guidance.",
  },
];

const profiles = [
  {
    title: "Product teams seeking WCAG sign-off",
    body: "You're launching a new product or major feature and need formal evidence of WCAG 2.1 AA conformance for legal, procurement, or board requirements.",
  },
  {
    title: "Organisations facing legal risk",
    body: "You've received an accessibility complaint, are subject to EAA/ADA obligations, or need a compliance baseline before a regulatory deadline.",
  },
  {
    title: "Agencies delivering client projects",
    body: "You're building on behalf of a client and need a third-party audit to underpin the accessibility statement you're contractually obliged to provide.",
  },
  {
    title: "Teams before a major redesign",
    body: "You want to understand your current debt before investing in a rebuild, so accessibility requirements are baked in from day one — not bolted on.",
  },
];

const faqs: FaqItem[] = [
  {
    question: "How long does a typical audit take?",
    answer:
      "Most audits of 10–30 pages are completed within 5–10 business days from the scoping call. Larger, more complex applications may take 2–4 weeks. We'll give you a precise timeline after the scoping call.",
  },
  {
    question: "Which WCAG standard do you audit against?",
    answer:
      "We audit against WCAG 2.1 Level AA by default, as this is the threshold required by most accessibility legislation (EAA, ADA, Section 508). We can extend coverage to WCAG 2.2 AA or AAA on request.",
  },
  {
    question: "What does the final report look like?",
    answer:
      "You receive a PDF summary for stakeholders and a spreadsheet of every issue with columns for WCAG criterion, severity, affected page/component, and developer-friendly fix guidance. Both formats are included as standard.",
  },
  {
    question: "Can you audit native mobile apps as well as web?",
    answer:
      "Yes. We test iOS apps against Apple's accessibility APIs and WCAG-equivalent criteria, and Android apps using TalkBack. Mobile audits are scoped separately from web audits.",
  },
  {
    question: "Do you issue an accessibility statement or conformance report?",
    answer:
      "Yes. On completion we issue a VPAT (Voluntary Product Accessibility Template) or a WCAG conformance report suitable for procurement requirements, plus a draft accessibility statement for your website.",
  },
  {
    question: "What if issues are found after the audit?",
    answer:
      "We offer a free re-test of remediated issues within 60 days of report delivery. If the volume of fixes is significant, our Remediation service can handle implementation directly.",
  },
];

export default function Audits() {
  const heroRef = useSectionReveal<HTMLElement>();
  const includedRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const processRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const profilesRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const scopeRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const faqRef = useSectionReveal<HTMLElement>();
  const crossLinksRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Find every<br />
            <span className="heading-accent">violation.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Automated scanning combined with rigorous manual WCAG 2.1/2.2 AA testing by
            accessibility engineers using real screen readers and keyboard-only navigation.
          </p>
        </div>
      </section>

      <section ref={includedRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            What's <span className="heading-accent">included.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {included.map(({ title, body }) => (
              <div key={title} className="reveal-child flex items-start gap-4 p-5 rounded-xl border bg-background">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm font-sans mb-1">{title}</h3>
                  <p className="text-muted-foreground text-xs">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={processRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            How it <span className="heading-accent">works.</span>
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

      <section ref={profilesRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            Who it's <span className="heading-accent">for.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map(({ title, body }) => (
              <div key={title} className="reveal-child p-6 rounded-xl border bg-background">
                <h3 className="font-bold text-sm font-sans mb-2">{title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={scopeRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            Typical engagement <span className="heading-accent">scope.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="reveal-child p-6 rounded-xl border bg-background">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Timeline</p>
              <p className="font-bold text-sm font-sans mb-1">5–10 business days</p>
              <p className="text-muted-foreground text-xs">From scoping call to final report delivery. Complex applications or large page counts may extend to 3–4 weeks.</p>
            </div>
            <div className="reveal-child p-6 rounded-xl border bg-background">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Deliverables</p>
              <ul className="space-y-1">
                {["PDF executive summary", "Developer issue spreadsheet", "VPAT / conformance report", "Draft accessibility statement", "Free re-test within 60 days"].map((d) => (
                  <li key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal-child p-6 rounded-xl border bg-background">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">What we need from you</p>
              <ul className="space-y-1">
                {["A list of in-scope URLs or journeys", "Test account credentials (if behind auth)", "Any existing accessibility statements", "Preferred report format (PDF / VPAT)"].map((d) => (
                  <li key={d} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
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

      <section ref={crossLinksRef} className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Related services</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/services/remediation" className="reveal-child group flex items-center gap-4 p-5 rounded-xl border bg-background hover:border-primary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm font-sans mb-0.5">Remediation</p>
                <p className="text-muted-foreground text-xs">We implement the fixes — PRs, annotated code, sprint delivery.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
            <Link href="/services/monitoring" className="reveal-child group flex items-center gap-4 p-5 rounded-xl border bg-background hover:border-primary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm font-sans mb-0.5">Monitoring</p>
                <p className="text-muted-foreground text-xs">Stay compliant after launch — monthly re-scans and regression alerts.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Ready to uncover your<br />
            <span className="heading-accent">accessibility gaps?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Start with a free automated scan, then escalate to a full manual audit for legal sign-off.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/contact">Get your audit</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/">Free site scan →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
