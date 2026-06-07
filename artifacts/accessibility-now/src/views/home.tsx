"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, Search, Code, ShieldCheck, Eye, Keyboard, TabletSmartphone } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import gsap from "gsap";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { useBtnGsapHover } from "@/hooks/use-btn-gsap-hover";
import { A11yFixIcon } from "@/lib/product-icons";
function HeroScanForm() {
  const [url, setUrl] = useState("");
  const [wholeSite, setWholeSite] = useState(false);
  const [multiViewport, setMultiViewport] = useState(true);
  const [strictProfile, setStrictProfile] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    const params = new URLSearchParams();
    params.set("url", trimmed);
    params.set("rescan", String(Date.now()));
    if (wholeSite) params.set("wholeSite", "1");
    if (strictProfile) params.set("profile", "strict");
    if (multiViewport) params.set("multiViewport", "1");
    router.push(`/audit-result?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="hero-form space-y-4 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="hero-url" className="sr-only">Your website URL</label>
        <Input
          id="hero-url"
          type="url"
          placeholder="https://your-website.com"
          className="h-14 rounded-xl px-5 text-sm flex-1"
          style={{ background: "#EFEFEB", border: "1px solid #E4E4E2", boxShadow: "none", fontFamily: "var(--app-font-mono)" }}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <Button type="submit" className="btn-gsap h-14 px-8 text-sm font-semibold shrink-0" disabled={!url.trim()}>
          {wholeSite ? "Scan site →" : "Scan page →"}
        </Button>
      </div>

      <fieldset className="rounded-xl border border-border/80 bg-white/50 p-4 text-left space-y-3">
        <legend className="text-xs font-semibold font-sans px-1 text-muted-foreground uppercase tracking-wide">
          Scan options
        </legend>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={wholeSite} onCheckedChange={(v) => setWholeSite(v === true)} className="mt-0.5" />
          <span>
            <span className="font-semibold font-sans text-sm">Scan entire site</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Discovers up to 10 pages from sitemap or homepage links. Uncheck for a single page only.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={multiViewport} onCheckedChange={(v) => setMultiViewport(v === true)} className="mt-0.5" />
          <span>
            <span className="font-semibold font-sans text-sm">Mobile + desktop</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Runs checks at mobile and desktop breakpoints for higher reliability.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={strictProfile} onCheckedChange={(v) => setStrictProfile(v === true)} className="mt-0.5" />
          <span>
            <span className="font-semibold font-sans text-sm">Stricter profile (BITV / BFSG)</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Adds AAA-oriented axe rules plus supplemental BITV 2.0 checks beyond axe-core alone.
            </span>
          </span>
        </label>
      </fieldset>

    </form>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const urgencyRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const statsRef = useSectionReveal<HTMLElement>();
  const servicesRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const toolsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const processRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const ctaRef = useSectionReveal<HTMLElement>();

  useBtnGsapHover(pageRef);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const ctx = gsap.context(() => {
      const words = hero.querySelectorAll<HTMLElement>(".hero-word");
      const badge = hero.querySelector<HTMLElement>(".hero-badge");
      const subtitle = hero.querySelector<HTMLElement>(".hero-subtitle");
      const form = hero.querySelector<HTMLElement>(".hero-form");
      const disclaimer = hero.querySelector<HTMLElement>(".hero-disclaimer");
      const urgency = urgencyRef.current;

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        const allEls = [urgency, badge, ...Array.from(words), subtitle, form, disclaimer].filter(Boolean);
        gsap.set(allEls, { y: 0 });
        gsap.from(allEls, { opacity: 0, duration: 0.4, ease: "none" });
        return;
      }

      gsap.set([words, badge, subtitle, form, disclaimer], { opacity: 0, y: 0 });
      gsap.set(words, { y: 60, opacity: 0 });
      if (urgency) gsap.set(urgency, { y: -40, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (urgency) {
        tl.to(urgency, { y: 0, opacity: 1, duration: 0.5 });
      }
      if (badge) {
        tl.to(badge, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2");
      }
      tl.to(words, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 }, "-=0.2");
      if (subtitle) {
        tl.to(subtitle, { opacity: 1, y: 0, duration: 0.55 }, "-=0.3");
      }
      if (form) {
        tl.to(form, { opacity: 1, y: 0, duration: 0.5 }, "-=0.25");
      }
      if (disclaimer) {
        tl.to(disclaimer, { opacity: 1, y: 0, duration: 0.45 }, "-=0.2");
      }
    }, hero);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={pageRef} className="flex flex-col w-full">

      {/* Urgency strip */}
      <div ref={urgencyRef} className="bg-foreground text-background py-2.5 px-4 text-center text-xs font-medium tracking-wide">
        <p style={{ fontFamily: "var(--app-font-mono)" }}>
          EAA enforcement began 28 June 2025.{" "}
          <Link href="/eaa" className="underline underline-offset-4 hover:text-primary transition-colors">
            Non-compliant products face fines up to €100,000 →
          </Link>
        </p>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="hero-gradient pt-24 pb-32 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="hero-badge inline-flex items-center rounded-full border border-border bg-white/60 px-4 py-1.5 mb-8">
            <span className="text-xs font-semibold font-sans text-muted-foreground tracking-wide uppercase">EAA compliance audits</span>
          </div>
          <h1 className="text-display font-extrabold tracking-tight mb-4 text-foreground">
            <span className="hero-word inline-block">Can</span>{" "}
            <span className="hero-word heading-accent inline-block">everyone</span>
            <br className="hidden md:block" />
            <span className="hero-word inline-block">use</span>{" "}
            <span className="hero-word inline-block">your</span>{" "}
            <span className="hero-word inline-block">website?</span>
          </h1>

          <p className="hero-subtitle text-base text-muted-foreground mb-8 max-w-xl mx-auto" style={{ fontFamily: "var(--app-font-mono)" }}>
            Free BFSG scan. One page or whole site. No signup.
          </p>

          <HeroScanForm />
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="border-y bg-white py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">1 in 6</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>Europeans live with a disability</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">94.8%</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>of homepages fail WCAG (WebAIM '25)</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">€100k</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>max fine per violation (Germany)</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">June 2025</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>EAA enforcement started</p>
            </div>
          </div>
        </div>
      </section>

      {/* A11y Fix promo */}
      <section className="py-10 px-4 border-y border-border">
        <div className="container mx-auto max-w-5xl">
          <Card className="rounded-2xl">
            <CardContent className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 md:p-8">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <A11yFixIcon className="w-6 h-6 text-primary" aria-hidden />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold font-sans mb-2">A11y Fix — guided BFSG compliance</h2>
                  <p className="text-sm text-muted-foreground max-w-xl" style={{ fontFamily: "var(--app-font-mono)" }}>
                    Scan your site, group issues by POUR, and get a fix plan your team can act on.
                  </p>
                </div>
              </div>
              <Button asChild className="btn-gsap h-12 px-8 font-semibold shrink-0">
                <Link href="/solutions/a11y-fix">Try A11y Fix →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What we do differently */}
      <section ref={servicesRef} className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-14">
            <h2 className="text-display-md font-extrabold text-foreground mb-4">
              Manual testing<br />
              <span className="heading-accent">where automation stops.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
              Automated checks cover part of WCAG. We cover the rest with NVDA, VoiceOver, keyboard-only runs, and the edge cases CI does not catch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="w-5 h-5 text-primary" />,
                title: "Accessibility Audits",
                body: "WCAG 2.1/2.2 AA manual testing on desktop, mobile, and assistive tech. Findings come with repro steps and severity.",
                href: "/services/audits",
                cta: "Audit details",
              },
              {
                icon: <Code className="w-5 h-5 text-primary" />,
                title: "Code Remediation",
                body: "PRs and tickets with diffs, not a spreadsheet and silence. We pair with your team until fixes merge.",
                href: "/services/remediation",
                cta: "How we fix",
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-primary" />,
                title: "Continuous Monitoring",
                body: "Scheduled re-scans and regression alerts so issues surface in QA, not in a complaint months later.",
                href: "/services/monitoring",
                cta: "Monitoring plans",
              },
            ].map(({ icon, title, body, href, cta }) => (
              <div
                key={title}
                className="reveal-child rounded-2xl border p-8 bg-background group service-card"
                style={{ transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  {icon}
                </div>
                <h3 className="text-lg font-bold mb-3 font-sans">{title}</h3>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed" style={{ fontFamily: "var(--app-font-mono)" }}>{body}</p>
                <Link href={href} className="text-primary font-semibold text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all font-sans">
                  {cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools teaser */}
      <section ref={toolsRef} className="py-24 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4 font-sans">Free developer tools</p>
              <h2 className="text-display-md font-extrabold text-foreground mb-5">
                See your site<br />
                <span className="heading-accent">how your users do.</span>
              </h2>
              <p className="text-muted-foreground mb-8 reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
                Eight tools in the browser, colour vision, low vision, reading order, keyboard flow, focus order on a live capture. Nothing to install.
              </p>
              <Button asChild className="btn-gsap h-12 px-7 font-semibold">
                <Link href="/tools">Open the tools →</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: <Eye className="w-4 h-4" />, title: "Colour Blindness", desc: "Deuteranopia, Protanopia, Tritanopia, Achromatopsia" },
                { icon: <Search className="w-4 h-4" />, title: "Screen Reader", desc: "Heading structure, landmark order, ARIA" },
                { icon: <Keyboard className="w-4 h-4" />, title: "Keyboard Tester", desc: "Tab order, focus traps, visible focus" },
                { icon: <TabletSmartphone className="w-4 h-4" />, title: "Focus Order", desc: "Numbered Tab markers on a live screenshot" },
              ].map(({ icon, title, desc }) => (
                <Link
                  key={title}
                  href="/tools"
                  className="reveal-child rounded-2xl border bg-card p-4 sm:p-5 cursor-pointer block"
                  style={{ transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                    {icon}
                  </div>
                  <p className="text-sm font-bold font-sans mb-1.5 tracking-tight">{title}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process - dark */}
      <section ref={processRef} className="py-24 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold text-white mb-6">
            How an audit<br />
            <span style={{ color: "#FF4D1C", fontStyle: "italic", fontFamily: "var(--app-font-serif)" }}>from start to finish.</span>
          </h2>
          <p className="text-gray-400 mb-12 reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
            Four weeks. Kick-off to signed conformance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {[
              { n: "01", title: "Scope & baseline", body: "We map critical journeys, run automated scans." },
              { n: "02", title: "Manual testing", body: "NVDA, VoiceOver, keyboard-only. Every component state." },
              { n: "03", title: "Fix delivery", body: "PRs to your repo, Jira tickets ranked by WCAG impact." },
              { n: "04", title: "Conformance statement", body: "Signed WCAG 2.2 AA report for your accessibility statement." },
            ].map(({ n, title, body }) => (
              <div key={n} className="reveal-child flex gap-5">
                <div className="text-xs font-bold text-primary pt-0.5 shrink-0 w-6 font-sans">{n}</div>
                <div>
                  <h4 className="font-bold text-sm text-white mb-1 font-sans">{title}</h4>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--app-font-mono)" }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section ref={ctaRef} className="py-28 px-4 text-center warm-section">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Enforcement is live.<br />
            <span className="heading-accent">Book a 30-minute scope call.</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
            Book a free 30-minute scope call. We will map risk and effort in plain language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="btn-gsap h-14 px-10 text-sm font-bold">
              <Link href="/contact">Book a scope call →</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-14 px-10 text-sm font-semibold rounded-xl [box-shadow:none]">
              <Link href="/services">See all services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
