"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Code, ShieldCheck, Check, Minus, Cpu, FileCode, BadgeCheck } from "lucide-react";
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

const COMPARE_ROWS: { label: string; vals: (string | boolean)[] }[] = [
  { label: "Output", vals: ["Findings report", "Merged PRs", "Monthly report + alerts"] },
  { label: "Time to value", vals: ["1–2 weeks", "First sprint, ~2 weeks", "Day 1"] },
  { label: "Investment", vals: ["from €3,500", "from €4,800 / sprint", "from €890 / month"] },
  { label: "WCAG 2.2 AA covered", vals: [true, true, true] },
  { label: "Real screen-reader testing", vals: [true, true, "Quarterly"] },
  { label: "Code-level fixes shipped", vals: [false, true, false] },
  { label: "CI / PR gating", vals: [false, "Optional", true] },
  { label: "VPAT / ACR statement", vals: [true, "On request", "Annual"] },
  { label: "Best for", vals: ["Legal sign-off", "Audit backlog", "Post-launch teams"] },
];

const differentiators = [
  {
    icon: Cpu,
    title: "Engineering-led, not overlay-led",
    body: "No overlay products, we test like users and patch source. Regulators and plaintiffs treat overlays as insufficient for real WCAG conformance.",
  },
  {
    icon: FileCode,
    title: "Code, not screenshots",
    body: "Every report ships with the exact selector, the failing condition, and a working fix. Your developers merge, not interpret.",
  },
  {
    icon: BadgeCheck,
    title: "WCAG-certified engineers",
    body: "IAAP CPACC / WAS testers who have shipped for EAA, ADA, AODA, and Section 508 in production.",
  },
];

export default function Services() {
  const heroRef = useSectionReveal<HTMLElement>();
  const journeyRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const compareRef = useSectionReveal<HTMLElement>();
  const diffRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4 font-sans">Services</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Audit. Fix.<br />
            <span className="heading-accent">Stay compliant.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Three engagements. The same senior engineering team start to finish. No subcontractors, no overlays, no hand-offs.
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

      <section ref={compareRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Compare engagements</p>
          <h2 className="text-display-md font-extrabold mb-3">
            Pick the one that <span className="heading-accent">matches your gap.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            Most clients start with an Audit, escalate to Remediation if the backlog is large, then move to Monitoring once shipped.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th scope="col" className="text-left py-5 px-6 font-bold font-sans text-muted-foreground w-[28%]">&nbsp;</th>
                  {[
                    { label: "Audit", href: "/services/audits", highlight: false },
                    { label: "Remediation", href: "/services/remediation", highlight: true },
                    { label: "Monitoring", href: "/services/monitoring", highlight: false },
                  ].map((t) => (
                    <th key={t.label} scope="col" className="py-5 px-4 text-center font-bold font-sans">
                      <Link
                        href={t.href}
                        className={["inline-flex items-center gap-1 hover:underline", t.highlight ? "text-primary" : "text-foreground"].join(" ")}
                      >
                        {t.label} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <td className="py-3.5 px-6 text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)", fontSize: "0.8rem" }}>{row.label}</td>
                    {row.vals.map((v, j) => (
                      <td key={j} className="py-3.5 px-4 text-center text-xs">
                        {v === true ? (
                          <Check className="w-4 h-4 text-primary mx-auto" strokeWidth={2.5} aria-label="Yes" />
                        ) : v === false ? (
                          <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" aria-label="No" />
                        ) : (
                          <span className="font-sans">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section ref={diffRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Why us</p>
          <h2 className="text-display-md font-extrabold mb-12">
            What "engineering-led" <span className="heading-accent">actually means.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {differentiators.map(({ icon: Icon, title, body }) => (
              <div key={title} className="reveal-child p-7 rounded-2xl border bg-background">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-extrabold text-base font-sans mb-2.5">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
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
            Run a free scan to see your baseline. We scope from there - no sales pitch, just a route forward.
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
