import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const included = [
  {
    title: "Comprehensive violations report",
    body: "Detailed breakdown of every issue mapped directly to WCAG success criteria.",
  },
  {
    title: "Severity tagging",
    body: "Issues are prioritised by impact — Critical, Serious, Moderate, Minor — to guide remediation.",
  },
  {
    title: "Screen reader testing",
    body: "Manual testing across NVDA/Firefox, JAWS/Chrome, and VoiceOver/Safari.",
  },
  {
    title: "Keyboard navigation testing",
    body: "Ensuring all interactive elements are reachable and operable via keyboard only.",
  },
  {
    title: "Colour contrast analysis",
    body: "Every text and UI component measured against WCAG 2.1 AA and AAA thresholds.",
  },
  {
    title: "ARIA and semantic HTML audit",
    body: "Review of landmark regions, heading hierarchy, live regions, and role usage.",
  },
];

export default function Audits() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Find every<br />
            <span className="heading-accent">violation.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Automated scanning combined with rigorous manual WCAG 2.1/2.2 AA testing by
            accessibility engineers using real screen readers and keyboard-only navigation.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            What's <span className="heading-accent">included.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {included.map(({ title, body }) => (
              <div key={title} className="flex items-start gap-4 p-5 rounded-xl border bg-background">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm font-sans mb-1">{title}</h3>
                  <p className="text-muted-foreground text-xs">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Ready to uncover your<br />
            <span className="heading-accent">accessibility gaps?</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            Start with a free automated scan, then escalate to a full manual audit for legal sign-off.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="h-12 px-8 text-sm font-semibold">
              <Link href="/contact">Get your audit</Link>
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
