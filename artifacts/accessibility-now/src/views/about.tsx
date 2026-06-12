"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { useBtnGsapHover } from "@/hooks/use-btn-gsap-hover";

const STATS = [
  { value: "Senior", label: "Engineers on every project" },
  { value: "EAA", label: "Core specialism" },
  { value: "PR-first", label: "Remediation in your repo" },
  { value: "IAAP", label: "CPACC / WAS certified" },
];

const PRINCIPLES = [
  {
    initials: "01",
    name: "Same team, audit to deploy.",
    role: "No hand-offs",
    bio: "Whoever scopes your audit writes the remediation PRs. No subcontractor relay, no context lost between phases.",
  },
  {
    initials: "02",
    name: "Senior on every project.",
    role: "100%, not 'led by'",
    bio: "Findings and fixes come from engineers with 8+ years in production accessibility, not a junior draft with a senior skim.",
  },
  {
    initials: "03",
    name: "IAAP-certified, code-fluent.",
    role: "CPACC / WAS",
    bio: "CPACC and WAS on the team, plus day-to-day work in your repo. Credentials meet shipping code.",
  },
];

export default function About() {
  const heroRef = useSectionReveal<HTMLElement>();
  const statsRef = useSectionReveal<HTMLElement>();
  const brandRef = useSectionReveal<HTMLElement>();
  const teamRef = useSectionReveal<HTMLElement>();
  const ctaRef = useSectionReveal<HTMLElement>();
  const pageRef = useRef<HTMLDivElement>(null);

  useBtnGsapHover(pageRef, 0.18);

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
                  A11y agency
                </p>
                <p
                  className="text-lg text-[#1A1A1A] leading-relaxed"
                  style={{ fontFamily: "var(--app-font-mono)" }}
                >
                  accessibility.now is a digital accessibility agency — a product of{" "}
                  <a
                    href="https://sometech.work"
                    className="text-[#FF4D1C] hover:underline font-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    SomeTech.work
                  </a>
                  . Same senior team from first scope call through audit, remediation, and monitoring.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="btn-gsap self-start h-11 px-7 text-sm font-bold rounded-full border-[#1A1A1A]/20 hover:border-[#FF4D1C]"
              >
                <Link href="/contact">Contact us →</Link>
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
                accessibility<span style={{ color: "#FF4D1C" }}>.now</span>
              </p>
              <p
                className="mt-3 text-sm text-white/40 leading-relaxed"
                style={{ fontFamily: "var(--app-font-mono)" }}
              >
                Senior engineers.<br />
                Shipping accessible products.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section ref={teamRef} className="py-20 px-6 bg-[#1A1A1A]">
        <div className="container mx-auto max-w-5xl">
          <h2
            className="text-3xl font-extrabold tracking-tight text-white mb-3 reveal-body"
            style={{ fontFamily: "var(--app-font-sans)" }}
          >
            How we work.
          </h2>
          <p
            className="text-sm text-white/50 mb-10 max-w-xl reveal-body"
            style={{ fontFamily: "var(--app-font-mono)" }}
          >
            Who works on your project and how we ship.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 reveal-body">
            {PRINCIPLES.map((p) => (
              <div
                key={p.name}
                className="flex flex-col gap-4 rounded-2xl p-6"
                style={{ background: "#242424", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                  style={{ background: "#FF4D1C", fontFamily: "var(--app-font-mono)" }}
                >
                  {p.initials}
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-base font-bold text-white leading-tight"
                    style={{ fontFamily: "var(--app-font-sans)" }}
                  >
                    {p.name}
                  </span>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#FF4D1C", fontFamily: "var(--app-font-mono)" }}
                  >
                    {p.role}
                  </span>
                </div>
                <p
                  className="text-sm text-white/50 leading-relaxed"
                  style={{ fontFamily: "var(--app-font-mono)" }}
                >
                  {p.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-6 warm-section text-center">
        <div className="container mx-auto max-w-2xl">
          <p
            className="text-2xl font-extrabold mb-8 reveal-body"
            style={{ fontFamily: "var(--app-font-sans)" }}
          >
            Need an audit or a second pair of eyes?
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact">Get an audit →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
