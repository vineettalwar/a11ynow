import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const included = [
  { title: "WCAG 2.1 / 2.2 AA report", body: "Every issue mapped to a success criterion, ranked Critical to Minor." },
  { title: "Real screen-reader testing", body: "NVDA + Firefox, JAWS + Chrome, VoiceOver + Safari." },
  { title: "Keyboard-only walk-through", body: "Every interactive element reached and operated without a mouse." },
  { title: "VPAT / ACR for procurement", body: "Conformance statement and a draft accessibility statement included." },
];

const processSteps = [
  { number: "01", title: "Scoping call", body: "We agree the pages and conformance level. You get a fixed quote before anything starts." },
  { number: "02", title: "Automated baseline", body: "Axe-core sweep across in-scope URLs. Sets the machine-detectable floor." },
  { number: "03", title: "Manual expert testing", body: "Senior engineers test every journey with screen readers and keyboard." },
  { number: "04", title: "Report delivery", body: "PDF for stakeholders, spreadsheet for developers, free re-test inside 60 days." },
];

const faqs: FaqItem[] = [
  { question: "How long does an audit take?", answer: "10–30 pages: 5–10 business days from kick-off. Larger apps: 2–4 weeks. We commit to a date after the scoping call." },
  { question: "Which WCAG level?", answer: "WCAG 2.1 AA by default (the EAA / ADA / Section 508 threshold). 2.2 AA or AAA on request." },
  { question: "What if you find issues after delivery?", answer: "Free re-test of remediated items within 60 days. If the volume is large, our Remediation service ships the fixes for you." },
];

export default function Audits() {
  const heroRef = useSectionReveal<HTMLElement>();
  const includedRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
            Find every<br />
            <span className="heading-accent">violation.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Manual WCAG 2.2 AA testing by accessibility engineers, backed by automated scans.
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
            Ready to uncover your<br />
            <span className="heading-accent">accessibility gaps?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Free automated scan now. Manual audit when you need legal sign-off.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/contact?service=audit">Get your audit</Link>
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
