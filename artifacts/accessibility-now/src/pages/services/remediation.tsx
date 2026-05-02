import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Search, ShieldCheck } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const howWeWork = [
  {
    title: "Sprint-based delivery",
    body: "We integrate into your agile workflow, delivering fixes in manageable increments aligned to your release schedule.",
  },
  {
    title: "Direct Pull Requests",
    body: "Our engineers write the code and submit PRs directly to your repositories — no ticket handoffs.",
  },
  {
    title: "Annotated code",
    body: "Complex fixes are thoroughly documented so your internal team understands the solution and can maintain it.",
  },
  {
    title: "Jira-ready tickets",
    body: "For tasks better handled internally, we provide detailed acceptance criteria and technical implementation specs.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Scoping & audit review",
    body: "We review your existing audit report (or conduct one) and categorise every issue by effort, risk, and dependency. You receive a prioritised remediation backlog.",
  },
  {
    number: "02",
    title: "Sprint planning",
    body: "We align with your development cadence — weekly or fortnightly sprints. Each sprint has a defined set of issues with clear acceptance criteria.",
  },
  {
    number: "03",
    title: "Code delivery & PRs",
    body: "Our engineers write the fixes directly in your codebase and raise pull requests. Each PR is annotated with reasoning and references to WCAG criteria.",
  },
  {
    number: "04",
    title: "Testing & sign-off",
    body: "Fixed components are tested with screen readers and keyboard navigation before the PR is submitted. We verify each fix against the original audit criterion.",
  },
];

const profiles = [
  {
    title: "Teams with an audit but no bandwidth",
    body: "You have a WCAG report sitting in a backlog with 80+ issues and no internal capacity to work through it systematically alongside regular feature development.",
  },
  {
    title: "Organisations under a legal deadline",
    body: "You need a significant portion of violations resolved within a defined window — EAA compliance dates, procurement deadlines, or legal settlement timelines.",
  },
  {
    title: "Startups scaling rapidly",
    body: "Accessibility debt accrued quickly as you shipped fast. You need a partner who can work at pace without slowing your engineering team down.",
  },
  {
    title: "Enterprise teams with complex stacks",
    body: "Your application is a mix of legacy components, design system overrides, and third-party embeds. You need experienced engineers who can navigate complexity.",
  },
];

const faqs: FaqItem[] = [
  {
    question: "Do we need an audit first before starting remediation?",
    answer:
      "Ideally yes — remediation is most efficient when the full scope of issues is known upfront. If you don't have an existing audit, we can run one before scoping the remediation engagement. We can also start remediation in parallel with an ongoing audit for time-sensitive projects.",
  },
  {
    question: "How do you work with our codebase and repositories?",
    answer:
      "We work directly in your version control system (GitHub, GitLab, Bitbucket, or Azure DevOps). We'll need read/write access to the relevant repositories. All changes go through your normal PR review process — we never merge directly to main without your team's approval.",
  },
  {
    question: "What frameworks and tech stacks can you work in?",
    answer:
      "Our engineers are primarily specialists in React, Next.js, Vue, Angular, and vanilla HTML/CSS/JS. We've also worked in Svelte, Nuxt, and legacy server-rendered stacks. We'll confirm compatibility during the scoping call.",
  },
  {
    question: "Can you handle third-party components we can't modify?",
    answer:
      "Yes. Where third-party components can't be fixed at the source, we implement WAI-ARIA overlays, focus management wrappers, and other compliant workarounds. We document every workaround clearly so your team can revisit when the dependency updates.",
  },
  {
    question: "How many issues can you fix in a sprint?",
    answer:
      "This depends on issue complexity and your codebase. A typical two-week sprint resolves 15–30 moderate issues or 5–10 complex architectural fixes. We scope each sprint conservatively so we always deliver what's committed.",
  },
];

export default function Remediation() {
  const heroRef = useSectionReveal<HTMLElement>();
  const howWeWorkRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
            We don't just report.<br />
            <span className="heading-accent">We fix.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Our engineers work alongside your team to implement robust accessibility solutions — PRs,
            annotated code, and sprint-based delivery against your actual backlog.
          </p>
        </div>
      </section>

      <section ref={howWeWorkRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            How we <span className="heading-accent">work.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {howWeWork.map(({ title, body }) => (
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
              <p className="font-bold text-sm font-sans mb-1">4–12 weeks</p>
              <p className="text-muted-foreground text-xs">Dependent on issue count and complexity. We scope each engagement individually — no one-size-fits-all contracts.</p>
            </div>
            <div className="reveal-child p-6 rounded-xl border bg-background">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Deliverables</p>
              <ul className="space-y-1">
                {["Merged pull requests per sprint", "Annotated code with WCAG references", "Jira / GitHub issues for internal fixes", "Sprint progress reports", "Final re-test and sign-off report"].map((d) => (
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
                {["Existing audit report (or we run one)", "Repo access (read/write)", "A point of contact for PR reviews", "Sprint planning calendar access"].map((d) => (
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
                <p className="text-muted-foreground text-xs">Identify every violation with manual and automated WCAG testing.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
            <Link href="/services/monitoring" className="reveal-child group flex items-center gap-4 p-5 rounded-xl border bg-background hover:border-primary transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm font-sans mb-0.5">Monitoring</p>
                <p className="text-muted-foreground text-xs">Protect your compliance investment — continuous re-scans and alerts.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Need engineering support<br />
            <span className="heading-accent">for compliance?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Tell us about your stack and we'll scope a remediation engagement that fits your release cadence.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact?service=remediation">Discuss your roadmap</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
