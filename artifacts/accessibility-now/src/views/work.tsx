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
      "A leading European neo-bank needed to meet EAA requirements before a major funding round, facing 847 distinct accessibility violations across their core web application.",
    outcome:
      "Embedded with their frontend team, remediating all blocking issues and establishing accessible component patterns.",
    result: "0 critical violations. Internal team trained on accessible React patterns.",
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
    result: "Passed rigorous third-party manual audit. 100% independent booking success.",
  },
  {
    industry: "Retail",
    tag: "Remediation",
    metric: "+15%",
    metricLabel: "keyboard-user conversion",
    challenge:
      "An enterprise e-commerce brand with a complex mega-menu and filtering system that trapped keyboard focus and lacked semantic structure.",
    outcome:
      "Redesigned the navigation architecture and filter interactions to be fully keyboard-operable.",
    result: "Compliance achieved 3 months ahead of schedule. 15% conversion uplift.",
  },
  {
    industry: "Government",
    tag: "Audit + Remediation",
    metric: "−40%",
    metricLabel: "form support calls",
    challenge:
      "A municipal services portal required strict EN 301 549 compliance, dealing with legacy PDF forms and complex data tables.",
    outcome:
      "Converted legacy PDFs to accessible web forms and implemented semantic table structures with proper headers.",
    result: "Full regulatory compliance. 40% reduction in support calls about form completion.",
  },
];

export default function Work() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Outcomes and<br />
            <span className="heading-accent">earned trust.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            We've helped European enterprises bridge the gap between compliance mandates and
            technical execution. Numbers are real, rounded, and anonymised under NDA.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {caseStudies.map((study, index) => (
              <Card key={index} className="border shadow-none">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="text-xs font-bold text-primary uppercase tracking-wider font-sans mb-1">
                        {study.industry}
                      </div>
                      <div className="text-xs text-muted-foreground font-sans">{study.tag}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold font-sans text-foreground leading-none">
                        {study.metric}
                      </div>
                      <div className="text-xs text-muted-foreground font-sans">{study.metricLabel}</div>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm font-sans mb-2 uppercase tracking-wide text-muted-foreground">
                    The challenge
                  </h3>
                  <p className="text-muted-foreground mb-5 text-xs">{study.challenge}</p>

                  <h3 className="font-bold text-sm font-sans mb-2 uppercase tracking-wide text-muted-foreground">
                    The outcome
                  </h3>
                  <p className="text-muted-foreground mb-5 text-xs">{study.outcome}</p>

                  <div className="bg-background rounded-xl border px-4 py-3">
                    <p className="text-xs font-medium font-sans">{study.result}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Your product<br />
            <span className="heading-accent">could be next.</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            Start with a free automated scan, or book a scope call to discuss your full compliance roadmap.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="h-12 px-8 text-sm font-semibold">
              <Link href="/contact">Book a scope call</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/">Free site scan →</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
