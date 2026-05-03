import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const benefits = [
  { title: "Monthly re-scans", body: "Automated sweeps across your critical journeys to catch regressions." },
  { title: "Regression alerts", body: "Same-day alert when a deploy breaks an accessibility feature." },
  { title: "Compliance dashboard", body: "Live posture you can share with legal and stakeholders." },
  { title: "On-demand consults", body: "Direct line to senior engineers for architecture reviews." },
];

const processSteps = [
  { number: "01", title: "Baseline", body: "We audit once to set the verified WCAG benchmark." },
  { number: "02", title: "Monthly scans", body: "Every month, automated sweeps compared against the baseline." },
  { number: "03", title: "Alerts", body: "Critical regressions hit your inbox / Slack same-day. Lower-severity items go in a weekly digest." },
  { number: "04", title: "Quarterly review", body: "Trend walk-through, scope updates, planning for upcoming releases." },
];

const faqs: FaqItem[] = [
  { question: "Is it just automated scans?", answer: "Automated is the backbone. We add quarterly manual spot-checks on high-risk components, regression alerting, and on-demand consult hours. Fully manual monthly testing is an add-on." },
  { question: "How fast are alerts?", answer: "Critical regressions trigger same-day email + Slack. Moderate and minor go in a weekly digest." },
  { question: "Can it integrate with our CI?", answer: "Yes. GitHub Actions, GitLab CI, or Jenkins - automated checks on every PR before it ships." },
];

export default function Monitoring() {
  const heroRef = useSectionReveal<HTMLElement>();
  const benefitsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
            Stay compliant<br />
            <span className="heading-accent">as you ship.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Automated re-scans, regression alerts, and a live compliance dashboard.
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
            Protect your<br />
            <span className="heading-accent">compliance investment.</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            One regression can undo months of work. A retainer keeps you covered.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact?service=monitoring">Start a retainer</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
