import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Search, Code, ShieldCheck } from "lucide-react";

export default function Services() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-5xl">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6">Our Services</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We offer end-to-end accessibility solutions, from initial audits to deep codebase remediation and continuous monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-2 shadow-none hover:border-primary/50 transition-colors">
          <CardContent className="p-8">
            <Search className="w-12 h-12 text-primary mb-6" />
            <h2 className="text-2xl font-bold mb-4">Accessibility Audits</h2>
            <p className="text-muted-foreground mb-6">
              Rigorous manual and automated testing against WCAG 2.1/2.2 AA standards. We identify violations across all key user journeys.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/services/audits">View Audit Details</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-none hover:border-primary/50 transition-colors">
          <CardContent className="p-8">
            <Code className="w-12 h-12 text-primary mb-6" />
            <h2 className="text-2xl font-bold mb-4">Remediation</h2>
            <p className="text-muted-foreground mb-6">
              We fix the issues. Sprint-based delivery alongside your development team, providing PRs, annotated code, and Jira tickets.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/services/remediation">View Remediation</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-none hover:border-primary/50 transition-colors">
          <CardContent className="p-8">
            <ShieldCheck className="w-12 h-12 text-primary mb-6" />
            <h2 className="text-2xl font-bold mb-4">Monitoring</h2>
            <p className="text-muted-foreground mb-6">
              Don't regress. Monthly re-scans, integration with your CI/CD, and regression alerts to maintain compliance long-term.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/services/monitoring">View Monitoring</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
