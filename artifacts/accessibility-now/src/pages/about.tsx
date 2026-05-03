import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const STATS = [
  { value: "500+", label: "Sites audited" },
  { value: "WCAG 2.2", label: "Ready" },
  { value: "48h", label: "Avg turnaround" },
  { value: "100%", label: "Engineer-led" },
];

const TEAM = [
  {
    initials: "JR",
    name: "James Reid",
    role: "Lead Accessibility Engineer",
    bio: "12 years React, ex-Shopify - wrote ARIA fixes for 200+ production apps.",
  },
  {
    initials: "SP",
    name: "Sarai Patel",
    role: "Senior Frontend Engineer",
    bio: "WCAG 2.2 specialist, ex-Atlassian - turns audit findings into merge-ready PRs.",
  },
  {
    initials: "MC",
    name: "Marcus Chen",
    role: "Engineering & Strategy",
    bio: "10 years Node.js & design systems - bridges engineering and product teams.",
  },
];

export default function About() {
  const heroRef = useSectionReveal<HTMLElement>();
  const statsRef = useSectionReveal<HTMLElement>();
  const brandRef = useSectionReveal<HTMLElement>();
  const teamRef = useSectionReveal<HTMLElement>();
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
      <section ref={heroRef} className="hero-gradient pt-32 pb-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6 leading-[1.05]">
            We are engineers.
            <br />
            <span className="heading-accent">We write the fix.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl reveal-body mb-10" style={{ fontFamily: "var(--app-font-mono)" }}>
            Most accessibility agencies hand you a PDF and wish you luck.
            We hand you pull requests. Every audit we run is led by senior software engineers
            who know the DOM, ARIA, and your stack.
          </p>
          <div className="flex flex-wrap gap-4 reveal-body">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
              <Link href="/contact">Book a scope call</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm font-bold rounded-full">
              <Link href="/work">View our work</Link>
            </Button>
          </div>
        </div>
      </section>

      <section ref={statsRef} className="bg-[#1A1A1A] py-16 px-6">
        <div className="container mx-auto max-w-5xl">
          <h2 className="sr-only">By the numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 reveal-body">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col gap-1">
                <span
                  className="text-5xl font-extrabold tracking-tight"
                  style={{ color: "#FF4D1C", fontFamily: "var(--app-font-sans)" }}
                >
                  {s.value}
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-widest text-white/50"
                  style={{ fontFamily: "var(--app-font-mono)" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={brandRef} className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-[#1A1A1A]/10 shadow-sm reveal-body">
            <div className="p-10 flex flex-col justify-between gap-8">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest text-[#FF4D1C] mb-4"
                  style={{ fontFamily: "var(--app-font-mono)" }}
                >
                  Powered by sometech.work
                </p>
                <p
                  className="text-lg text-[#1A1A1A] leading-relaxed"
                  style={{ fontFamily: "var(--app-font-mono)" }}
                >
                  accessibility.now operates under the sometech.work brand - a senior
                  engineering collective specialising in enterprise React and Node.js.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="btn-gsap self-start h-11 px-7 text-sm font-bold rounded-full border-[#1A1A1A]/20 hover:border-[#FF4D1C]"
              >
                <a href="https://sometech.work" target="_blank" rel="noreferrer">
                  sometech.work ↗
                </a>
              </Button>
            </div>
            <div
              className="p-10 flex flex-col justify-center items-start"
              style={{ background: "#1A1A1A" }}
            >
              <p
                className="text-3xl font-extrabold tracking-tight text-white leading-tight"
                style={{ fontFamily: "var(--app-font-sans)" }}
              >
                some<span style={{ color: "#FF4D1C" }}>tech</span>.work
              </p>
              <p
                className="mt-3 text-sm text-white/40 leading-relaxed"
                style={{ fontFamily: "var(--app-font-mono)" }}
              >
                Engineering excellence.<br />
                Applied to accessibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section ref={teamRef} className="py-20 px-6 bg-[#1A1A1A]">
        <div className="container mx-auto max-w-5xl">
          <h2
            className="text-3xl font-extrabold tracking-tight text-white mb-10 reveal-body"
            style={{ fontFamily: "var(--app-font-sans)" }}
          >
            The team.
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 reveal-body">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="flex flex-col gap-4 rounded-2xl p-6"
                style={{ background: "#242424", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                  style={{ background: "#FF4D1C", fontFamily: "var(--app-font-mono)" }}
                >
                  {member.initials}
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-base font-bold text-white leading-tight"
                    style={{ fontFamily: "var(--app-font-sans)" }}
                  >
                    {member.name}
                  </span>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#FF4D1C", fontFamily: "var(--app-font-mono)" }}
                  >
                    {member.role}
                  </span>
                </div>
                <p
                  className="text-sm text-white/50 leading-relaxed"
                  style={{ fontFamily: "var(--app-font-mono)" }}
                >
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-6 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <p
            className="text-2xl font-extrabold mb-8 reveal-body"
            style={{ fontFamily: "var(--app-font-sans)" }}
          >
            Ready to make your product accessible?
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact">Get an audit →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
