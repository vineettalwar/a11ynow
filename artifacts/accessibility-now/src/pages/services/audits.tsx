import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Audits() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-6">Accessibility Audits</h1>
        <p className="text-xl text-muted-foreground">
          Identify every WCAG 2.1/2.2 AA violation. Automated scanning combined with rigorous manual testing by accessibility engineers.
        </p>
      </div>

      <div className="bg-white border rounded-3xl p-8 md:p-12 mb-12">
        <h2 className="text-3xl font-bold mb-8">What's included</h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Comprehensive violations report</h3>
              <p className="text-muted-foreground">Detailed breakdown of every issue mapped directly to WCAG success criteria.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Severity tagging</h3>
              <p className="text-muted-foreground">Issues are prioritized by impact (Critical, Serious, Moderate, Minor) to guide remediation.</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Screen reader testing</h3>
              <p className="text-muted-foreground">Manual testing across major screen reader combinations (NVDA/Firefox, JAWS/Chrome, VoiceOver/Safari).</p>
            </div>
          </li>
          <li className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Keyboard navigation testing</h3>
              <p className="text-muted-foreground">Ensuring all interactive elements are reachable and operable via keyboard only.</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold mb-6">Ready to uncover your accessibility gaps?</h2>
        <Button asChild className="h-14 rounded-full px-10 text-lg font-bold">
          <Link href="/contact">Get your audit</Link>
        </Button>
      </div>
    </div>
  );
}
