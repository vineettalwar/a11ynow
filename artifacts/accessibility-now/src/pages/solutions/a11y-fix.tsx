import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles, Code, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { A11Y_FIX_INTENTS, type A11yFixIntent } from "@/lib/a11y-fix";
import { POUR_PRINCIPLES } from "@/data/pour-principles";

const journeySteps = [
  { step: "01", title: "Choose your path", body: "Self-serve guidance, engineer-led fixes, or ongoing monitoring." },
  { step: "02", title: "Scan your site", body: "BITV 2.0 / BFSG strict profile against EN 301 549 — same engine as our audits." },
  { step: "03", title: "See issues by POUR", body: "Four principles: Perceivable, Operable, Understandable, Robust." },
  { step: "04", title: "Act or escalate", body: "Quick wins for your team, or book engineers for the hard parts." },
];

const alsoOnSite = [
  {
    title: "Free developer tools",
    body: "Contrast checker, focus order, screen reader preview — eight tools, no install.",
    href: "/tools",
    cta: "Open tools",
  },
  {
    title: "EAA compliance checklist",
    body: "42-item interactive checklist with local progress — procurement-ready.",
    href: "/resources/eaa-checklist",
    cta: "Start checklist",
  },
  {
    title: "Manual audit & VPAT",
    body: "When automation is not enough: certified testers, signed conformance.",
    href: "/services/audits",
    cta: "Audit details",
  },
];

export default function A11yFixLanding() {
  const [intent, setIntent] = useState<A11yFixIntent>("self");
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();

  const heroRef = useSectionReveal<HTMLElement>();
  const pathsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const pourRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const journeyRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const alsoRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    const params = new URLSearchParams();
    params.set("url", trimmed);
    params.set("intent", intent);
    params.set("rescan", String(Date.now()));
    setLocation(`/a11y-fix/result?${params.toString()}`);
  }

  const intentIcons: Record<A11yFixIntent, typeof Sparkles> = {
    self: Sparkles,
    engineers: Code,
    monitor: ShieldCheck,
  };

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      <section ref={heroRef} className="hero-gradient pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4 font-sans">
            A11y Fix · Guided BFSG compliance
          </p>
          <h1 className="text-display font-extrabold tracking-tight mb-5">
            Scan. Group.<br />
            <span className="heading-accent">Fix with a plan.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto mb-10 reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
            A11y Fix scans your website against German BITV 2.0 / BFSG (EN 301 549) and organises every finding
            under the four WCAG principles — so you know what to fix first and when to call in engineers.
          </p>
        </div>
      </section>

      <section ref={pathsRef} className="py-12 px-4 bg-white border-b">
        <div className="container mx-auto max-w-3xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans text-center">
            Step 1 — Choose your path
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {A11Y_FIX_INTENTS.map(({ id, label, description }) => {
              const Icon = intentIcons[id];
              const selected = intent === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIntent(id)}
                  className={[
                    "reveal-child text-left rounded-2xl border p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-background hover:border-primary/40",
                  ].join(" ")}
                  aria-pressed={selected}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" aria-hidden />
                  </div>
                  <p className="font-bold font-sans text-sm mb-1">{label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="reveal-child space-y-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest font-sans text-center">
              Step 2 — Enter your website
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="a11y-fix-url" className="sr-only">Website URL</label>
              <Input
                id="a11y-fix-url"
                type="url"
                placeholder="https://your-website.de"
                className="h-14 rounded-xl px-5 text-sm flex-1"
                style={{ background: "#EFEFEB", border: "1px solid #E4E4E2", boxShadow: "none", fontFamily: "var(--app-font-mono)" }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <Button type="submit" className="btn-gsap h-14 px-8 text-sm font-semibold shrink-0" disabled={!url.trim()}>
                Run A11y Fix scan →
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center" style={{ fontFamily: "var(--app-font-mono)" }}>
              Strict BITV / BFSG profile · mobile + desktop · same scanner as our paid audits
            </p>
          </form>
        </div>
      </section>

      <section ref={pourRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">The four principles</p>
            <h2 className="text-display-md font-extrabold mb-3">
              Every issue mapped to <span className="heading-accent">POUR.</span>
            </h2>
            <p className="text-muted-foreground text-sm reveal-body">
              BITV 2.0 and BFSG reference WCAG 2.1 AA via EN 301 549. A11y Fix groups automated findings under
              Perceivable, Operable, Understandable, and Robust — the same structure regulators and auditors use.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POUR_PRINCIPLES.map((p) => (
              <div key={p.name} className={`reveal-child rounded-2xl border ${p.border} ${p.bg} p-6`}>
                <div className={`text-2xl font-extrabold font-sans mb-2 ${p.color}`}>{p.letter}</div>
                <h3 className="font-bold font-sans text-base mb-2">{p.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.descriptionDe}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={journeyRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10 text-center">
            How A11y Fix <span className="heading-accent">works.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {journeySteps.map(({ step, title, body }) => (
              <div key={step} className="reveal-child flex gap-4">
                <span className="text-xs font-bold text-primary pt-1 shrink-0 w-6 font-sans">{step}</span>
                <div>
                  <h3 className="font-bold font-sans text-sm mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={alsoRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3 font-sans">Beyond A11y Fix</p>
          <h2 className="text-display-md font-extrabold mb-10">
            More ways to build <span className="heading-accent">accessibility awareness.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {alsoOnSite.map(({ title, body, href, cta }) => (
              <div key={title} className="reveal-child rounded-2xl border bg-background p-7">
                <h3 className="font-bold font-sans text-base mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">{body}</p>
                <Link href={href} className="text-primary font-semibold text-sm inline-flex items-center gap-1.5 hover:gap-2.5 transition-all">
                  {cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Automation finds the gaps.<br />
            <span className="heading-accent">We close them.</span>
          </h2>
          <p className="text-muted-foreground mb-8 reveal-body">
            A11y Fix is free. When you need signed conformance, PRs in your repo, or CI regression gates — that is where our team steps in.
          </p>
          <ul className="text-left max-w-md mx-auto space-y-2 mb-10 text-sm text-muted-foreground">
            {[
              "Manual audits from €3,500 with VPAT draft",
              "Remediation sprints with merged PRs",
              "Monitoring retainers from €890 / month",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/pricing">See pricing →</Link>
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
