import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Search, Code, ShieldCheck } from "lucide-react";

export default function Services() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Audit. Fix.<br />
            <span className="heading-accent">Stay compliant.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            End-to-end accessibility services — from initial audits to deep codebase remediation and
            continuous monitoring. Same team, start to finish.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border shadow-none hover:shadow-sm transition-shadow">
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

            <Card className="border shadow-none hover:shadow-sm transition-shadow">
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

            <Card className="border shadow-none hover:shadow-sm transition-shadow">
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

      <section className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Not sure where<br />
            <span className="heading-accent">to start?</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            Run a free automated scan to see your baseline compliance — then we can scope the full work together.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free audit →</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/contact">Talk to an engineer</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
