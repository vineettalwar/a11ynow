import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Search, Code, ShieldCheck } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const selectorScenarios = [
  {
    icon: Search,
    heading: "Start with an Audit",
    cue: "If you need to know where you stand",
    body: "You're new to accessibility, facing a legal requirement, or preparing for a procurement process. An audit gives you a comprehensive view of your current WCAG compliance, ranked by severity, with clear fix guidance.",
    href: "/services/audits",
    label: "Explore Audits",
  },
  {
    icon: Code,
    heading: "Go straight to Remediation",
    cue: "If you already have an audit report",
    body: "You have a list of accessibility issues and need experienced engineers to implement the fixes — without slowing down your own team. We integrate into your sprint process and deliver pull requests.",
    href: "/services/remediation",
    label: "Explore Remediation",
  },
  {
    icon: ShieldCheck,
    heading: "Add Monitoring",
    cue: "If you're already compliant",
    body: "You've done the hard work and now need to protect it. Monthly re-scans, CI/CD integration, and regression alerts ensure you don't slip backwards as you continue to ship features.",
    href: "/services/monitoring",
    label: "Explore Monitoring",
  },
];

const crossLinks = [
  {
    icon: Search,
    title: "Accessibility Audits",
    body: "Rigorous manual and automated WCAG 2.1/2.2 AA testing. We identify violations across all key user journeys and deliver a developer-ready report.",
    href: "/services/audits",
  },
  {
    icon: Code,
    title: "Remediation",
    body: "We fix the issues. Sprint-based delivery alongside your development team, providing PRs, annotated code, and Jira-ready tickets.",
    href: "/services/remediation",
  },
  {
    icon: ShieldCheck,
    title: "Monitoring",
    body: "Don't regress. Monthly re-scans, CI/CD integration, and regression alerts to maintain compliance long-term.",
    href: "/services/monitoring",
  },
];

export default function Services() {
  const heroRef = useSectionReveal<HTMLElement>();
  const cardsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const selectorRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const crossLinksRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
            End-to-end accessibility services — from initial audits to deep codebase remediation and
            continuous monitoring. Same team, start to finish.
          </p>
        </div>
      </section>

      <section ref={cardsRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="reveal-child service-card border shadow-none" style={{ transition: "box-shadow 0.2s ease, transform 0.2s ease" }}>
              <CardContent className="p-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold mb-3 font-sans">Accessibility Audits</h2>
                <p className="text-muted-foreground mb-6">
                  Rigorous manual and automated testing against WCAG 2.1/2.2 AA standards. We identify
                  violations across all key user journeys.
                </p>
                <Button asChild variant="outline" className="w-full [box-shadow:none]">
                  <Link href="/services/audits">View Audit Details <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="reveal-child service-card border shadow-none" style={{ transition: "box-shadow 0.2s ease, transform 0.2s ease" }}>
              <CardContent className="p-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Code className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold mb-3 font-sans">Remediation</h2>
                <p className="text-muted-foreground mb-6">
                  We fix the issues. Sprint-based delivery alongside your development team, providing
                  PRs, annotated code, and Jira tickets.
                </p>
                <Button asChild variant="outline" className="w-full [box-shadow:none]">
                  <Link href="/services/remediation">View Remediation <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="reveal-child service-card border shadow-none" style={{ transition: "box-shadow 0.2s ease, transform 0.2s ease" }}>
              <CardContent className="p-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold mb-3 font-sans">Monitoring</h2>
                <p className="text-muted-foreground mb-6">
                  Don't regress. Monthly re-scans, CI/CD integration, and regression alerts to maintain
                  compliance long-term.
                </p>
                <Button asChild variant="outline" className="w-full [box-shadow:none]">
                  <Link href="/services/monitoring">View Monitoring <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section ref={selectorRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-display-md font-extrabold mb-3">
            Which service is right <span className="heading-accent">for you?</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            Most clients follow the full journey — audit, remediation, then monitoring. But you can join at any point.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectorScenarios.map(({ icon: Icon, heading, cue, body, href, label }) => (
              <div key={heading} className="reveal-child flex flex-col p-6 rounded-xl border bg-background">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">{cue}</p>
                <h3 className="font-bold text-base font-sans mb-3">{heading}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed flex-1 mb-6">{body}</p>
                <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  {label} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={crossLinksRef} className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">Explore each service</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {crossLinks.map(({ icon: Icon, title, body, href }) => (
              <Link
                key={title}
                href={href}
                className="reveal-child group flex flex-col gap-4 p-5 rounded-xl border bg-background hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-sm font-sans mb-1">{title}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{body}</p>
                </div>
              </Link>
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
            Run a free automated scan to see your baseline compliance — then we can scope the full work together.
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
