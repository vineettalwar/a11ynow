"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const caseStudies = [
  {
    industry: "Fintech",
    tag: "Audit + Remediation",
    metric: "6 weeks",
    metricLabel: "to EAA-ready",
    challenge:
      "A European neo-bank needed to meet EAA requirements before a major funding round, with hundreds of accessibility violations across their core web application.",
    outcome:
      "Embedded with their frontend team, remediating blocking issues and establishing accessible component patterns.",
    result: "Critical violations cleared. Internal team trained on accessible React patterns.",
  },
  {
    industry: "Healthcare",
    tag: "Audit",
    metric: "100%",
    metricLabel: "screen reader success",
    challenge:
      "A telehealth platform was inaccessible to screen reader users, preventing visually impaired patients from booking appointments independently.",
    outcome:
      "Complete overhaul of the booking flow keyboard navigation and ARIA state management.",
    result: "Passed third-party manual audit. Independent booking success for AT users.",
  },
  {
    industry: "Retail",
    tag: "Remediation",
    metric: "Ahead of schedule",
    metricLabel: "EAA readiness",
    challenge:
      "An enterprise e-commerce brand with a complex mega-menu and filtering system that trapped keyboard focus and lacked semantic structure.",
    outcome:
      "Redesigned the navigation architecture and filter interactions to be fully keyboard-operable.",
    result: "Compliance achieved ahead of the enforcement window.",
  },
  {
    industry: "Government",
    tag: "Audit + Remediation",
    metric: "Lower support load",
    metricLabel: "on digital forms",
    challenge:
      "A municipal services portal required strict EN 301 549 compliance, dealing with legacy PDF forms and complex data tables.",
    outcome:
      "Converted legacy PDFs to accessible web forms and implemented semantic table structures with proper headers.",
    result: "Full regulatory compliance with fewer form-completion support requests.",
  },
];

export default function Work() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            Representative outcomes
          </p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Outcomes and<br />
            <span className="heading-accent">how we work.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
            These are anonymised examples of the kinds of results we deliver. Details vary by stack,
            team size, and starting point — we scope every engagement individually.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {caseStudies.map((study) => (
              <Card key={study.industry} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-8 flex flex-col gap-4 h-full">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">
                      {study.industry}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">{study.tag}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold font-sans">{study.metric}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{study.metricLabel}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{study.challenge}</p>
                  <p className="text-sm leading-relaxed">{study.outcome}</p>
                  <p className="text-xs font-semibold text-foreground border-t border-border pt-4">{study.result}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 warm-section text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Ready to scope<br />
            <span className="heading-accent">your project?</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Start with a free automated scan, or book a scoping call for a manual audit or remediation support.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="h-12 px-8 font-semibold">
              <Link href="/">Run free scan</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8">
              <Link href="/contact">Book a scope call</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
