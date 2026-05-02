import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Search, Code, ShieldCheck, Eye, Keyboard, Smartphone } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
});

export default function Home() {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) setLocation(`/audit-result?url=${encodeURIComponent(url)}`);
  };

  return (
    <div className="flex flex-col w-full">

      {/* Urgency strip */}
      <div className="bg-foreground text-background py-2.5 px-4 text-center text-xs font-medium tracking-wide">
        <p style={{ fontFamily: "var(--app-font-mono)" }}>
          EAA enforcement began 28 June 2025.{" "}
          <Link href="/eaa" className="underline underline-offset-4 hover:text-primary transition-colors">
            Non-compliant products face fines up to €100,000 →
          </Link>
        </p>
      </div>

      {/* Hero */}
      <section className="hero-gradient pt-24 pb-32 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div {...fadeUp(0)}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-semibold font-sans text-muted-foreground tracking-wide uppercase">EAA compliance audits</span>
            </div>
            <h1 className="text-display font-extrabold tracking-tight mb-4 text-foreground">
              Can <span className="heading-accent">everyone</span><br className="hidden md:block" /> use your website?
            </h1>
          </motion.div>

          <motion.p {...fadeUp(0.1)} className="text-base text-muted-foreground mb-10 max-w-xl mx-auto" style={{ fontFamily: "var(--app-font-mono)" }}>
            Run a free WCAG 2.2 scan in 30 seconds — no account, no forms, just results.<br />
            Then talk to us when you need the manual audit that actually holds up in court.
          </motion.p>

          <motion.form {...fadeUp(0.18)} onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
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
            <Button type="submit" className="h-14 px-8 text-sm font-semibold shrink-0">
              Scan my site →
            </Button>
          </motion.form>

          <motion.p {...fadeUp(0.3)} className="mt-4 text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
            Powered by axe-core · WCAG 2.1 AA + 2.2 AA · No sign-up required
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-white py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { stat: "1 in 6", label: "Europeans lives with a disability" },
              { stat: "96.3%", label: "of homepages have WCAG failures" },
              { stat: "€100k", label: "maximum fine per violation" },
              { stat: "June 2025", label: "EAA enforcement started" },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <p className="text-3xl font-extrabold font-sans text-foreground mb-1">{stat}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we do differently */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-14">
            <h2 className="text-display-md font-extrabold text-foreground mb-4">
              Not another scanner.<br />
              <span className="heading-accent">An engineering team.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl" style={{ fontFamily: "var(--app-font-mono)" }}>
              Automated tools catch ~30% of WCAG issues. We find the rest — through NVDA, VoiceOver, keyboard-only
              navigation, and 10+ years of screen reader quirks your CI pipeline will never see.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="w-5 h-5 text-primary" />,
                title: "Accessibility Audits",
                body: "Full WCAG 2.1/2.2 AA manual testing across desktop, mobile, and assistive technology. We document every failure with a reproducible test case and severity rating.",
                href: "/services/audits",
                cta: "Audit details",
              },
              {
                icon: <Code className="w-5 h-5 text-primary" />,
                title: "Code Remediation",
                body: "We don't hand you a spreadsheet and disappear. We submit PRs, write Jira tickets with exact diffs, and pair with your developers until the fixes are merged.",
                href: "/services/remediation",
                cta: "How we fix",
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-primary" />,
                title: "Continuous Monitoring",
                body: "Weekly re-scans and regression alerts mean regressions get caught before your release, not by a regulator six months later.",
                href: "/services/monitoring",
                cta: "Monitoring plans",
              },
            ].map(({ icon, title, body, href, cta }) => (
              <div key={title} className="rounded-2xl border p-8 hover:shadow-sm transition-shadow bg-background group">
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
      <section className="py-24 px-4" style={{ background: "#F7F5F0" }}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4 font-sans">Free developer tools</p>
              <h2 className="text-display-md font-extrabold text-foreground mb-5">
                See your site<br />
                <span className="heading-accent">how your users do.</span>
              </h2>
              <p className="text-muted-foreground mb-8" style={{ fontFamily: "var(--app-font-mono)" }}>
                Six browser-based simulators. No install. Enter any URL and immediately see your
                product through deuteranopia, tunnel vision, a screen reader's reading order, or
                a keyboard-only user's tab flow.
              </p>
              <Button asChild className="h-12 px-7 font-semibold">
                <Link href="/tools">Open the tools →</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Eye className="w-4 h-4" />, title: "Colour Blindness", desc: "Deuteranopia, Protanopia, Tritanopia, Achromatopsia" },
                { icon: <Eye className="w-4 h-4" />, title: "Low Vision", desc: "Blur, tunnel vision, central field loss" },
                { icon: <Search className="w-4 h-4" />, title: "Screen Reader", desc: "Heading structure, landmark order, ARIA issues" },
                { icon: <Keyboard className="w-4 h-4" />, title: "Keyboard Tester", desc: "Tab order, focus traps, visible focus rings" },
                { icon: <ShieldCheck className="w-4 h-4" />, title: "Contrast Checker", desc: "WCAG AA/AAA with EyeDropper colour picker" },
                { icon: <Smartphone className="w-4 h-4" />, title: "Mobile Checklist", desc: "iOS & Android with VoiceOver/TalkBack items" },
              ].map(({ icon, title, desc }) => (
                <Link key={title} href="/tools" className="rounded-xl border p-4 bg-white hover:shadow-sm transition-shadow group cursor-pointer block">
                  <div className="text-primary mb-2">{icon}</div>
                  <p className="text-sm font-bold font-sans mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process — dark */}
      <section className="py-24 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-display-md font-extrabold text-white mb-6">
                How an audit<br />
                <span style={{ color: "#FF4D1C", fontStyle: "italic" }}>actually works.</span>
              </h2>
              <p className="text-gray-400 mb-10" style={{ fontFamily: "var(--app-font-mono)" }}>
                Four weeks from kick-off to signed statement of conformance. You stay in Jira — we work in your stack.
              </p>
              <div className="space-y-8">
                {[
                  { n: "01", title: "Scope & Baseline", body: "We map your critical user journeys (checkout, sign-up, account) and run automated scans to baseline the volume of issues." },
                  { n: "02", title: "Manual Testing", body: "NVDA on Windows, VoiceOver on iOS and macOS, keyboard-only navigation. We test every component state, not just the happy path." },
                  { n: "03", title: "Fix Delivery", body: "Exact code diffs, pull requests against your repo, and Jira tickets prioritised by WCAG impact level. Your developers merge; we verify." },
                  { n: "04", title: "Statement of Conformance", body: "A signed WCAG 2.2 AA conformance report you can publish in your accessibility statement and share with regulators." },
                ].map(({ n, title, body }) => (
                  <div key={n} className="flex gap-5">
                    <div className="text-xs font-bold text-primary pt-0.5 shrink-0 w-6 font-sans">{n}</div>
                    <div>
                      <h4 className="font-bold text-sm text-white mb-1 font-sans">{title}</h4>
                      <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--app-font-mono)" }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] rounded-2xl p-8 border border-white/10 sticky top-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-5 font-sans">EAA — who it covers</p>
              <p className="text-gray-400 mb-6 text-sm" style={{ fontFamily: "var(--app-font-mono)" }}>
                If you sell or operate a digital service in the EU — regardless of where you are incorporated — the EAA applies to you.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "E-commerce & retail (checkout, product pages)",
                  "Banking & financial services (online banking, apps)",
                  "Transportation & ticketing (booking flows)",
                  "Streaming & on-demand media (players, captions)",
                  "Telecoms (account portals, support)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-300 text-sm" style={{ fontFamily: "var(--app-font-mono)" }}>
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/5 hover:text-white rounded-xl [box-shadow:none]">
                <Link href="/eaa">Full EAA compliance guide →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-4 text-center hero-gradient">
        <div className="container mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-6 font-sans">Get started</p>
          <h2 className="text-display-md font-extrabold mb-5">
            Enforcement is live.<br />
            <span className="heading-accent">Let's get you compliant.</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto" style={{ fontFamily: "var(--app-font-mono)" }}>
            A 30-minute scope call with one of our engineers costs nothing. We'll tell you exactly what you're exposed to and what it takes to fix it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="h-14 px-10 text-sm font-bold">
              <Link href="/contact">Book a scope call →</Link>
            </Button>
            <Button asChild variant="outline" className="h-14 px-10 text-sm font-semibold rounded-xl [box-shadow:none]">
              <Link href="/services">See all services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
