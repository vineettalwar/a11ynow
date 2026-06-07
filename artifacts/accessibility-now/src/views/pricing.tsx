"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/faq-accordion";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { Check, Zap, Search, ShieldCheck, ArrowRight, Minus } from "lucide-react";

const TIERS = [
  {
    id: "snapshot",
    icon: Zap,
    name: "Snapshot Audit",
    tagline: "Free automated scan",
    price: "Free",
    priceNote: "No account required",
    description:
      "Run an instant WCAG 2.1 automated scan on any public URL. Get a scored report in seconds - the fastest way to understand your baseline.",
    features: [
      "Automated WCAG 2.1 scan",
      "Accessibility score 0–100",
      "Violation count by severity",
      "Downloadable PDF report",
      "Batch scan up to 10 pages",
      "No registration needed",
    ],
    cta: { label: "Run a free scan →", href: "/" },
    highlighted: false,
    badge: null,
  },
  {
    id: "manual",
    icon: Search,
    name: "Full Manual Audit",
    tagline: "One-off engagement",
    price: "from €3,500",
    priceNote: "per engagement",
    description:
      "Rigorous manual testing across your key user journeys by a WCAG-certified specialist. Covers automated gaps - focus order, colour contrast in context, cognitive load, screen-reader compatibility.",
    features: [
      "Up to 25 representative pages",
      "Manual + automated testing",
      "WCAG 2.1 / 2.2 AA coverage",
      "Prioritised developer-ready report",
      "Severity-ranked remediation backlog",
      "30-min results walkthrough call",
      "VPAT / ACR statement draft",
      "12-month audit certificate",
    ],
    cta: { label: "Book a scoping call →", href: "/contact" },
    highlighted: true,
    badge: "Most popular",
  },
  {
    id: "monitoring",
    icon: ShieldCheck,
    name: "Ongoing Monitoring",
    tagline: "Retainer",
    price: "from €890",
    priceNote: "per month",
    description:
      "Stay compliant as you ship. Monthly re-scans, CI/CD pipeline integration, and instant regression alerts mean you catch issues before your users - or regulators - do.",
    features: [
      "Monthly automated re-scans",
      "CI/CD integration & PR checks",
      "Regression alerts via email",
      "Quarterly manual spot-checks",
      "Monthly compliance report",
      "Dedicated Slack channel",
      "Annual full re-audit included",
    ],
    cta: { label: "Discuss a retainer →", href: "/contact" },
    highlighted: false,
    badge: null,
  },
];

const COMPARISON: { label: string; values: (boolean | string)[] }[] = [
  { label: "Automated WCAG scan", values: [true, true, true] },
  { label: "Manual expert testing", values: [false, true, "Quarterly"] },
  { label: "Pages covered", values: ["Unlimited", "Up to 25", "Key pages"] },
  { label: "Turnaround", values: ["Instant", "2–3 weeks", "Ongoing"] },
  { label: "PDF report", values: [true, true, true] },
  { label: "Severity-ranked remediation plan", values: [false, true, false] },
  { label: "VPAT / ACR statement", values: [false, true, false] },
  { label: "12-month audit certificate", values: [false, true, false] },
  { label: "CI/CD integration", values: [false, false, true] },
  { label: "Regression alerting", values: [false, false, true] },
  { label: "Monthly compliance report", values: [false, false, true] },
  { label: "Dedicated Slack channel", values: [false, false, true] },
  { label: "Annual full re-audit", values: [false, false, true] },
  { label: "Account required", values: ["No", "No", "Yes"] },
];

const FAQS = [
  {
    question: "What does 'from €3,500' mean?",
    answer:
      "Starting figure for up to 10 pages of a typical marketing or SaaS site. Price scales with page count, complexity (SPAs, native mobile), turnaround, and VPAT requirements. We give a fixed quote before any work starts.",
  },
  {
    question: "How is the Monitoring retainer structured?",
    answer:
      "3-month minimum then rolls monthly. Covers automated re-scans, CI/CD integration, regression alerts, and a quarterly manual spot-check. Annual full re-audit included. 30 days' notice to cancel after the minimum term.",
  },
  {
    question: "Do you help with EAA compliance specifically?",
    answer:
      "Yes - it's a core specialism. Audits are scoped to EAA obligations for your product category and we produce the conformance statement procurement needs. Discounts available for non-profits and public sector.",
  },
];

export default function Pricing() {
  const heroRef = useSectionReveal<HTMLElement>();
  const cardsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const comparisonRef = useSectionReveal<HTMLElement>();
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
      cleanups.push(() => {
        btn.removeEventListener("mouseenter", enter);
        btn.removeEventListener("mouseleave", leave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-4">
            Transparent pricing
          </p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Clear costs,<br />
            <span className="heading-accent">no surprises.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Three tiers to match where you are - a free automated scan to start, a full
            manual audit when you need depth, and a monitoring retainer to stay compliant
            as you ship.
          </p>
        </div>
      </section>

      <section ref={cardsRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {TIERS.map(({ id, icon: Icon, name, tagline, price, priceNote, description, features, cta, highlighted, badge }) => (
              <div
                key={id}
                className={[
                  "reveal-child relative flex flex-col rounded-2xl border p-8 transition-shadow",
                  highlighted
                    ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.18),0_8px_32px_-4px_hsl(var(--primary)/0.14)] bg-background"
                    : "border-border bg-background hover:border-primary/40",
                ].join(" ")}
              >
                {badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--color-primary, #FF4D1C)" }}
                  >
                    {badge}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-6">
                  <div className={["w-10 h-10 rounded-xl flex items-center justify-center shrink-0", highlighted ? "bg-primary/15" : "bg-muted"].join(" ")}>
                    <Icon className={["w-5 h-5", highlighted ? "text-primary" : "text-muted-foreground"].join(" ")} />
                  </div>
                  <div>
                    <p className="font-extrabold text-base font-sans leading-tight">{name}</p>
                    <p className="text-xs text-muted-foreground">{tagline}</p>
                  </div>
                </div>
                <div className="mb-5">
                  <p className="text-3xl font-extrabold font-sans tracking-tight">{price}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{priceNote}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-7">{description}</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={["w-4 h-4 mt-0.5 shrink-0", highlighted ? "text-primary" : "text-muted-foreground"].join(" ")} strokeWidth={2.5} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={highlighted ? "default" : "outline"}
                  className={["btn-gsap w-full font-semibold", highlighted ? "" : "[box-shadow:none]"].join(" ")}
                >
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-8 py-6">
            <div>
              <p className="font-bold text-sm font-sans mb-1">Need something larger?</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Enterprise multi-site packages, procurement framework support, and fully managed EAA compliance programmes are available. Let's scope it together.
              </p>
            </div>
            <Button asChild variant="outline" className="btn-gsap shrink-0 [box-shadow:none]">
              <Link href="/contact">Talk to us <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section ref={comparisonRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Compare plans
          </p>
          <h2 className="text-display-md font-extrabold mb-10">
            All three tiers, <span className="heading-accent">side by side.</span>
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-white">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left py-5 px-6 font-bold font-sans text-muted-foreground w-[40%]">
                    Feature
                  </th>
                  {TIERS.map((t) => (
                    <th
                      key={t.id}
                      scope="col"
                      className={["py-5 px-4 text-center font-bold font-sans", t.highlighted ? "text-primary" : "text-foreground"].join(" ")}
                    >
                      <div>{t.name}</div>
                      <div className="text-xs font-normal text-muted-foreground mt-0.5">{t.price}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <td className="py-3.5 px-6 text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)", fontSize: "0.8rem" }}>
                      {row.label}
                    </td>
                    {row.values.map((val, j) => (
                      <td key={j} className="py-3.5 px-4 text-center">
                        {val === true ? (
                          <Check className="w-4 h-4 text-primary mx-auto" strokeWidth={2.5} aria-label="Included" />
                        ) : val === false ? (
                          <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" aria-label="Not included" />
                        ) : (
                          <span className="text-xs font-sans text-muted-foreground">{val}</span>
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

      <section ref={faqRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-display-md font-extrabold mb-10">
            Pricing <span className="heading-accent">questions.</span>
          </h2>
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Start in<br />
            <span className="heading-accent">30 seconds.</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Run a free automated scan - no account, no commitment. See your baseline score instantly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free scan →</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/contact">Book a call</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
