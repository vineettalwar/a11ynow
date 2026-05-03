import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Search, Code } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const benefits = [
  {
    title: "Monthly re-scans",
    body: "Automated sweeps across your critical user journeys to catch regressions and new violations.",
  },
  {
    title: "Regression alerts",
    body: "Immediate notification when new deployments break existing accessibility features.",
  },
  {
    title: "Compliance dashboard",
    body: "Real-time tracking of your accessibility posture - perfect for stakeholder and legal reporting.",
  },
  {
    title: "On-demand consultation",
    body: "Direct access to our senior accessibility engineers for architecture reviews and technical advice.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Baseline establishment",
    body: "We audit your application to establish a verified WCAG baseline. This becomes the benchmark against which all future re-scans are measured.",
  },
  {
    number: "02",
    title: "Monthly automated re-scans",
    body: "Every month, we run comprehensive scans across your critical user journeys. Results are compared against the baseline to detect regressions or newly introduced violations.",
  },
  {
    number: "03",
    title: "Alerts & triage",
    body: "When a regression is detected, you receive an immediate alert with a severity classification and a link to the affected component. Critical issues are flagged for same-day review.",
  },
  {
    number: "04",
    title: "Quarterly review sessions",
    body: "Each quarter, we hold a compliance review call to walk through trends, discuss upcoming features that may affect accessibility, and update the monitoring scope as your application evolves.",
  },
];

const profiles = [
  {
    title: "Post-remediation teams",
    body: "You've invested in fixing your accessibility debt and want to ensure new feature releases don't undo that work. Monitoring protects the ROI of remediation.",
  },
  {
    title: "Regulated industries",
    body: "Financial services, healthcare, government, and education sectors face ongoing compliance obligations. A monitoring retainer provides continuous evidence of due diligence.",
  },
  {
    title: "High-velocity development teams",
    body: "When you're shipping features weekly, regressions are almost inevitable without systematic checks. Monitoring catches issues before they reach users or auditors.",
  },
  {
    title: "Organisations with accessibility statements",
    body: "Publishing an accessibility statement creates an ongoing commitment. Monitoring ensures your statement remains accurate and that you can evidence it at any time.",
  },
];

const faqs: FaqItem[] = [
  {
    question: "What does monitoring cover - just automated scans?",
    answer:
      "Our monitoring service includes automated scanning as its backbone, but also covers quarterly manual spot-checks on high-risk components, regression alerting, and on-demand consultation hours. Fully manual monthly testing is available as an add-on.",
  },
  {
    question: "How quickly are we alerted when a regression is detected?",
    answer:
      "Critical regressions (issues that break keyboard navigation or make content completely inaccessible to screen readers) trigger same-day alerts via email and Slack. Moderate and minor regressions are included in a weekly digest.",
  },
  {
    question: "Can monitoring integrate with our CI/CD pipeline?",
    answer:
      "Yes. We can integrate automated accessibility checks into your GitHub Actions, GitLab CI, or Jenkins pipelines so every pull request is screened before it reaches production. This is available as part of the monitoring retainer.",
  },
  {
    question: "What happens if the scope of our application changes?",
    answer:
      "We review the monitoring scope quarterly. If new pages, apps, or user journeys come in scope, we update the configuration during the quarterly review call. Significant mid-quarter scope changes can also be accommodated with a brief change order.",
  },
  {
    question: "How is the compliance dashboard accessed?",
    answer:
      "You'll receive a unique login to your dedicated compliance dashboard, which can also be shared with your legal or procurement team. It shows trend data, current violation counts by severity, and a history of monthly scan results.",
  },
];

export default function Monitoring() {
  const heroRef = useSectionReveal<HTMLElement>();
  const benefitsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
            Stay compliant<br />
            <span className="heading-accent">as you ship.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Accessibility is a continuous process. We ensure your application remains compliant
            with every new feature - automated re-scans, regression alerts, and a compliance dashboard.
          </p>
        </div>
      </section>

      <section ref={benefitsRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            Retainer <span className="heading-accent">benefits.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map(({ title, body }) => (
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
            How monitoring <span className="heading-accent">works.</span>
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
              <p className="font-bold text-sm font-sans mb-1">Rolling monthly retainer</p>
              <p className="text-muted-foreground text-xs">We establish a baseline in the first month, then monitor on an ongoing basis. Scope and cadence are agreed during our initial call.</p>
            </div>
            <div className="reveal-child p-6 rounded-xl border bg-background">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Deliverables</p>
              <ul className="space-y-1">
                {["Monthly scan report", "Regression alert notifications", "Compliance dashboard access", "Quarterly review session", "On-demand consultation hours"].map((d) => (
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
                {["List of URLs and journeys to monitor", "Test account credentials", "Preferred alert channel (email / Slack)", "Access to CI/CD config (optional)"].map((d) => (
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
            <Link href="/services/audits" className="reveal-child group flex items-center gap-4 p-5 rounded-xl border bg-background hover:border-primary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm font-sans mb-0.5">Audits</p>
                <p className="text-muted-foreground text-xs">Establish your baseline - manual and automated WCAG testing.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
            <Link href="/services/remediation" className="reveal-child group flex items-center gap-4 p-5 rounded-xl border bg-background hover:border-primary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm font-sans mb-0.5">Remediation</p>
                <p className="text-muted-foreground text-xs">Fix the debt before monitoring it - sprint-based engineering support.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Protect your<br />
            <span className="heading-accent">compliance investment.</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            One regression can undo months of work. A monitoring retainer keeps you continuously covered.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact?service=monitoring">Start a retainer</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
