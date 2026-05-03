import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const howWeWork = [
  { title: "Sprint-based delivery", body: "We slot into your release cadence. Fixes ship in chunks you can review." },
  { title: "Direct pull requests", body: "Our engineers write the code and open PRs against your repo. No ticket handoffs." },
  { title: "Annotated for your team", body: "Complex fixes are documented so your devs can maintain them later." },
  { title: "Jira-ready spec sheets", body: "For work better done in-house, you get tickets with acceptance criteria." },
];

const processSteps = [
  { number: "01", title: "Audit review", body: "We triage your existing report by effort, risk, and dependency. Out: a prioritised backlog." },
  { number: "02", title: "Sprint planning", body: "Weekly or fortnightly sprints aligned to your cadence. Each sprint has a fixed scope." },
  { number: "03", title: "Code & PRs", body: "Fixes go straight into your codebase. Each PR cites the WCAG criterion it resolves." },
  { number: "04", title: "Test & sign-off", body: "Screen-reader and keyboard-tested before the PR lands. Verified against the original report." },
];

const faqs: FaqItem[] = [
  { question: "Do we need an audit first?", answer: "Ideally yes - it's how we scope. If you don't have one we'll run an audit first or in parallel for time-sensitive work." },
  { question: "Which stacks do you work in?", answer: "React, Next.js, Vue, Angular, plain HTML/CSS/JS. We've also worked in Svelte, Nuxt, and legacy server-rendered apps." },
  { question: "How many fixes per sprint?", answer: "A two-week sprint typically resolves 15–30 moderate issues or 5–10 architectural fixes. We scope conservatively and deliver what's committed." },
];

export default function Remediation() {
  const heroRef = useSectionReveal<HTMLElement>();
  const howWeWorkRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            We don't just report.<br />
            <span className="heading-accent">We fix.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Our engineers ship the fixes. PRs into your repo, on your sprint cadence.
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
            Need engineering support<br />
            <span className="heading-accent">for compliance?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Tell us your stack. We'll scope a remediation engagement that fits your release cadence.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact?service=remediation">Discuss your roadmap</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
