import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

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

export default function Audits() {
  const heroRef = useSectionReveal<HTMLElement>();
  const includedRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
