import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const sectors = [
  "E-commerce and retail websites",
  "Banking and financial services",
  "Transportation and ticketing",
  "Streaming and on-demand media",
  "Telecommunications services",
  "Consumer devices and operating systems",
];

const memberStates = [
  { country: "Germany", body: "Überwachungsstelle des Bundes (BFIT-Bund)", note: "Strongest enforcement framework in the EU." },
  { country: "France", body: "DINUM / Autorité de Régulation", note: "Active RGAA compliance checks already in place." },
  { country: "Netherlands", body: "Logius", note: "Cross-sector enforcement with direct market powers." },
  { country: "Sweden", body: "DIGG", note: "Merged public/private sector monitoring." },
  { country: "Ireland", body: "National Disability Authority", note: "Enforcement under the Consumer Rights Act." },
];

export default function EAA() {
  const heroRef = useSectionReveal<HTMLElement>();
  const whatRef = useSectionReveal<HTMLElement>();
  const whoRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const enforcementRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
          <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-semibold font-sans mb-6 tracking-wide uppercase">
            Directive (EU) 2019/882
          </div>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            The European<br />
            <span className="heading-accent">Accessibility Act.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mb-10 reveal-body">
            EU law requiring key digital products and services to be accessible to persons with disabilities.
            Enforcement is live. WCAG 2.1 Level AA is the accepted technical threshold.
          </p>
          <div className="flex flex-wrap gap-3 reveal-child">
            <Button asChild className="btn-gsap h-11 px-7 text-sm font-semibold">
              <Link href="/contact">Get an EAA audit</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-11 px-7 text-sm [box-shadow:none]">
              <Link href="/">Run free site scan →</Link>
            </Button>
          </div>
        </div>
      </section>

      <section ref={whatRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-6">
            What is the <span className="heading-accent">EAA?</span>
          </h2>
          <div className="prose prose-base max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>
            <p className="reveal-body">
              The European Accessibility Act (Directive 2019/882) is EU legislation that harmonises
              accessibility requirements across member states. It entered into force in June 2019
              and became enforceable from <strong>28 June 2025</strong>. Companies that were not
              compliant by that date are now actively at risk of enforcement action.
            </p>
            <p className="reveal-body">
              Unlike GDPR, which centres on data, the EAA focuses on whether people with disabilities
              can use your product on equal terms. It references the <strong>EN 301 549</strong> technical
              standard, which maps directly to <strong>WCAG 2.1 Level AA</strong> for web and mobile.
            </p>
            <p className="reveal-body">
              The practical implication: if your product operates in the EU market, your web and mobile
              applications must meet WCAG 2.1 AA across all key user journeys - purchase flows, account
              management, content consumption, and support.
            </p>
          </div>
        </div>
      </section>

      <section ref={whoRef} className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-4">
            Who it <span className="heading-accent">applies to.</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-2xl reveal-body">
            The EAA applies to companies of all sizes that provide these services within the EU - regardless
            of where the company is headquartered. Microenterprises (&lt; 10 employees, ≤ €2M turnover) are
            exempt for some services but not all.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
            {sectors.map((sector) => (
              <div key={sector} className="reveal-child flex items-start gap-3 p-4 rounded-xl border bg-white">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm font-sans font-medium">{sector}</span>
              </div>
            ))}
          </div>

          <div className="reveal-child bg-foreground text-background rounded-2xl p-8">
            <h3 className="text-lg font-bold font-sans mb-3 text-white">
              What WCAG 2.1 AA means in practice
            </h3>
            <p className="text-gray-400 mb-6">
              EN 301 549 - the harmonised standard cited by the EAA - maps almost entirely to WCAG 2.1 Level AA
              for web and mobile applications. Achieving WCAG 2.1 AA is the accepted path to legal compliance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Perceivable", body: "Text alternatives, captions, adaptable layout, colour contrast" },
                { label: "Operable", body: "Keyboard access, enough time, no seizure risk, navigable structure" },
                { label: "Understandable", body: "Readable language, predictable UI, error identification and recovery" },
              ].map(({ label, body }) => (
                <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-primary font-bold font-sans text-sm mb-1">{label}</div>
                  <p className="text-gray-400 text-xs">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={enforcementRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-4">
            Enforcement by <span className="heading-accent">member state.</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-2xl reveal-body">
            Unlike GDPR, the EAA is enforced nationally by designated market surveillance authorities.
            Penalties vary - but market exclusion and substantial fines are available in every jurisdiction.
          </p>
          <div className="space-y-3 mb-12">
            {memberStates.map(({ country, body, note }) => (
              <div key={country} className="reveal-child flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 p-5 rounded-xl border bg-background">
                <div className="shrink-0 w-28">
                  <span className="font-bold font-sans text-sm">{country}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-sans">{body}</p>
                </div>
                <div className="text-xs text-muted-foreground max-w-xs">
                  {note}
                </div>
              </div>
            ))}
          </div>

          <div className="reveal-child border-l-4 border-primary pl-6">
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground font-sans">Penalties</strong> include significant fines,
              mandatory market withdrawal, and injunctions blocking the sale of non-compliant products.
              Multiple member states allow third-party complaints - disabled users can trigger enforcement
              directly against your product.
            </p>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Find out where<br />
            <span className="heading-accent">you stand.</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Start with a free automated scan. Follow it with a full manual audit if you need
            the complete picture for legal sign-off.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free audit →</Link>
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
