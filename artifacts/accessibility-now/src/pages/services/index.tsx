import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Code, ShieldCheck } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const journeySteps = [
  {
    icon: Search,
    step: "01",
    label: "Audit",
    description: "Find every WCAG violation. Ranked, developer-ready report.",
    href: "/services/audits",
  },
  {
    icon: Code,
    step: "02",
    label: "Remediation",
    description: "Our engineers ship the fixes as PRs against your repo.",
    href: "/services/remediation",
  },
  {
    icon: ShieldCheck,
    step: "03",
    label: "Monitoring",
    description: "Automated re-scans and CI alerts keep regressions out.",
    href: "/services/monitoring",
  },
];

export default function Services() {
  const heroRef = useSectionReveal<HTMLElement>();
  const journeyRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
            Audit. Fix.<br />
            <span className="heading-accent">Stay compliant.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Three services. Same engineering team start to finish.
          </p>
        </div>
      </section>

      <section ref={journeyRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <div className="relative flex flex-col md:flex-row items-stretch gap-0">
            {journeySteps.map(({ icon: Icon, step, label, description, href }, idx) => (
              <div key={step} className="reveal-child flex md:flex-1 flex-col md:flex-row items-stretch">
                <Link
                  href={href}
                  className="group flex-1 flex flex-col p-7 rounded-2xl border bg-background hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Step {step}</span>
                  </div>
                  <p className="font-extrabold text-xl font-sans mb-2 group-hover:text-primary transition-colors">{label}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{description}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Learn more <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>

                {idx < journeySteps.length - 1 && (
                  <div className="flex flex-col md:flex-row items-center justify-center py-4 md:py-0 px-1 md:px-4 shrink-0" aria-hidden="true">
                    <div className="hidden md:flex flex-row items-center gap-1.5">
                      <div className="h-px flex-1 bg-border min-w-[24px]" />
                      <div className="w-7 h-7 rounded-full border-2 border-primary/30 bg-background flex items-center justify-center">
                        <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="h-px flex-1 bg-border min-w-[24px]" />
                    </div>
                    <div className="flex md:hidden flex-col items-center gap-1.5">
                      <div className="w-px flex-1 bg-border min-h-[24px]" />
                      <div className="w-7 h-7 rounded-full border-2 border-primary/30 bg-background flex items-center justify-center rotate-90">
                        <ArrowRight className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="w-px flex-1 bg-border min-h-[24px]" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Not sure where<br />
            <span className="heading-accent">to start?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Run a free scan to see your baseline. We scope from there.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free scan →</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/contact">Talk to an engineer</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
