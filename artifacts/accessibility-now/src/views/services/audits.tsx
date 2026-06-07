"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, MousePointer2, Brain, Wrench, Check } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { FaqAccordion } from "@/components/faq-accordion";
import type { FaqItem } from "@/components/faq-accordion";

const principles = [
  {
    icon: Eye,
    name: "Perceivable",
    count: "20 criteria",
    examples: [
      "1.4.3 Contrast (Min) - 4.5:1 body text",
      "1.4.10 Reflow - 320 CSS px no scroll",
      "1.4.11 Non-text contrast - 3:1 for UI",
      "1.3.1 Info and relationships - landmarks, headings",
    ],
  },
  {
    icon: MousePointer2,
    name: "Operable",
    count: "20 criteria",
    examples: [
      "2.1.1 Keyboard - all functionality reachable",
      "2.4.7 Focus visible - 2px+ outline, 3:1",
      "2.4.11 Focus not obscured (2.2)",
      "2.5.8 Target size - 24×24 CSS px (2.2)",
    ],
  },
  {
    icon: Brain,
    name: "Understandable",
    count: "13 criteria",
    examples: [
      "3.3.7 Redundant entry (2.2)",
      "3.3.8 Accessible authentication (2.2)",
      "3.2.4 Consistent identification",
      "3.3.1 Error identification",
    ],
  },
  {
    icon: Wrench,
    name: "Robust",
    count: "2 criteria",
    examples: [
      "4.1.2 Name, role, value - ARIA",
      "4.1.3 Status messages - live regions",
      "(4.1.1 Parsing was deprecated in WCAG 2.2)",
      "Plus ARIA Authoring Practices conformance",
    ],
  },
];

const techMatrix = [
  { env: "Windows 11", browser: "Firefox", at: "NVDA 2024.x", purpose: "Primary screen-reader baseline" },
  { env: "Windows 11", browser: "Chrome", at: "JAWS 2024", purpose: "Enterprise / banking baseline" },
  { env: "macOS Sonoma", browser: "Safari", at: "VoiceOver", purpose: "Apple ecosystem coverage" },
  { env: "iOS 17+", browser: "Safari", at: "VoiceOver", purpose: "Mobile screen-reader on iPhone / iPad" },
  { env: "Android 14+", browser: "Chrome", at: "TalkBack 14.x", purpose: "Mobile screen-reader on Android" },
  { env: "Any", browser: "Any", at: "Keyboard-only", purpose: "Tab order, focus traps, visible focus" },
  { env: "Any", browser: "Any", at: "200% zoom + 320px reflow", purpose: "Low-vision and small-viewport users" },
  { env: "Any", browser: "Any", at: "Forced-colors mode", purpose: "Windows High-Contrast & equivalents" },
];

const tiers = [
  {
    name: "Starter",
    pages: "Up to 5 pages",
    price: "from €3,500",
    bullets: [
      "Two key user journeys",
      "WCAG 2.2 AA full pass",
      "PDF + spreadsheet report",
      "30-min walkthrough call",
    ],
    highlight: false,
  },
  {
    name: "Standard",
    pages: "Up to 15 pages",
    price: "from €7,500",
    bullets: [
      "Five user journeys end-to-end",
      "Native screen-reader testing",
      "VPAT / ACR statement",
      "12-month conformance certificate",
      "Free 60-day re-test",
    ],
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Comprehensive",
    pages: "25+ pages or apps",
    price: "from €12,000",
    bullets: [
      "Full app or design-system audit",
      "iOS + Android native coverage",
      "Component library annotations",
      "Procurement-ready documentation",
      "Quarterly check-in for 12 months",
    ],
    highlight: false,
  },
];

const processSteps = [
  { number: "01", title: "Scoping call", body: "We agree the pages and conformance level. You get a fixed quote before anything starts." },
  { number: "02", title: "Automated baseline", body: "axe-core + Pa11y sweep across in-scope URLs. Sets the machine-detectable floor." },
  { number: "03", title: "Manual expert testing", body: "Senior IAAP-certified engineers test every journey with the full assistive-tech matrix above." },
  { number: "04", title: "Report delivery", body: "PDF for stakeholders, spreadsheet for developers, free re-test inside 60 days." },
];

const faqs: FaqItem[] = [
  { question: "How long does an audit take?", answer: "Starter: 5 business days. Standard: 8–10 business days. Comprehensive: 2–4 weeks. We commit to a date after the scoping call." },
  { question: "Which WCAG level?", answer: "WCAG 2.2 AA by default - that's the EAA / EN 301 549, ADA Title III, and Section 508 baseline. 2.2 AAA available on request, with realistic caveats about which criteria are practical to meet." },
  { question: "What if you find issues after delivery?", answer: "Free re-test of remediated items within 60 days. If the volume is large, our Remediation team ships the fixes for you. We never re-charge for verifying our own findings." },
];

export default function Audits() {
  const heroRef = useSectionReveal<HTMLElement>();
  const coverageRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const techRef = useSectionReveal<HTMLElement>();
  const tiersRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4 font-sans">Audits</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Find every<br />
            <span className="heading-accent">violation.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            All 55 WCAG 2.2 AA success criteria, tested by IAAP-certified engineers across NVDA, JAWS, VoiceOver, TalkBack, and keyboard-only. Real assistive tech, not just axe-core.
          </p>
        </div>
      </section>

      <section ref={coverageRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Coverage</p>
          <h2 className="text-display-md font-extrabold mb-3">
            All 55 WCAG 2.2 AA <span className="heading-accent">success criteria.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            Grouped by the four POUR principles - so you can see what's tested at a glance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principles.map(({ icon: Icon, name, count, examples }) => (
              <div key={name} className="reveal-child p-6 rounded-2xl border bg-background">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-extrabold text-base font-sans">{name}</h3>
                  </div>
                  <span className="text-xs font-bold text-primary font-sans">{count}</span>
                </div>
                <ul className="space-y-2">
                  {examples.map((ex) => (
                    <li
                      key={ex}
                      className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed"
                      style={{ fontFamily: "var(--app-font-mono)" }}
                    >
                      <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={techRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Tested on</p>
          <h2 className="text-display-md font-extrabold mb-3">
            The full <span className="heading-accent">assistive-tech matrix.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            We don't just run axe-core and call it done. Every audit covers these eight environments by hand.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th scope="col" className="text-left py-4 px-5 font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">OS / Device</th>
                  <th scope="col" className="text-left py-4 px-5 font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">Browser</th>
                  <th scope="col" className="text-left py-4 px-5 font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">Assistive tech</th>
                  <th scope="col" className="text-left py-4 px-5 font-bold font-sans text-muted-foreground text-xs uppercase tracking-wider">What it catches</th>
                </tr>
              </thead>
              <tbody>
                {techMatrix.map((row, i) => (
                  <tr key={`${row.env}-${row.at}`} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <td className="py-3.5 px-5 font-bold text-foreground text-xs font-sans">{row.env}</td>
                    <td className="py-3.5 px-5 text-muted-foreground text-xs" style={{ fontFamily: "var(--app-font-mono)" }}>{row.browser}</td>
                    <td className="py-3.5 px-5 text-foreground text-xs" style={{ fontFamily: "var(--app-font-mono)" }}>{row.at}</td>
                    <td className="py-3.5 px-5 text-muted-foreground text-xs">{row.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section ref={tiersRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Engagement tiers</p>
          <h2 className="text-display-md font-extrabold mb-10">
            Anchor pricing, <span className="heading-accent">no surprises.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={[
                  "reveal-child relative flex flex-col p-7 rounded-2xl border bg-background",
                  t.highlight
                    ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.18),0_8px_32px_-4px_hsl(var(--primary)/0.14)]"
                    : "border-border",
                ].join(" ")}
              >
                {t.badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--color-primary, #FF4D1C)" }}
                  >
                    {t.badge}
                  </div>
                )}
                <p className="font-extrabold text-lg font-sans mb-1">{t.name}</p>
                <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "var(--app-font-mono)" }}>{t.pages}</p>
                <p className="text-2xl font-extrabold font-sans mb-6">{t.price}</p>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm">
                      <Check className={["w-4 h-4 mt-0.5 shrink-0", t.highlight ? "text-primary" : "text-muted-foreground"].join(" ")} strokeWidth={2.5} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={t.highlight ? "default" : "outline"} className={["btn-gsap w-full font-semibold", t.highlight ? "" : "[box-shadow:none]"].join(" ")}>
                  <Link href={`/contact?service=audit&tier=${t.name.toLowerCase()}`}>Scope this tier →</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={processRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Process</p>
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
