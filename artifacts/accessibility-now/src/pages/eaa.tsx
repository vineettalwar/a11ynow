import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function EAA() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-6">European Accessibility Act (EAA)</h1>
        <p className="text-xl text-muted-foreground mb-4">
          Directive (EU) 2019/882 requires key products and services to be accessible to persons with disabilities.
        </p>
        <div className="inline-block bg-destructive/10 text-destructive px-4 py-2 rounded-full font-bold text-sm">
          Enforcement deadline: June 28, 2025 — Already passed
        </div>
      </div>

      <div className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary">
        <h2>Who it applies to</h2>
        <p>
          The EAA applies to a wide range of digital products and services sold or used within the European Union, regardless of where the company is headquartered. Key sectors include:
        </p>
        <ul>
          <li>E-commerce and retail websites</li>
          <li>Banking and financial services</li>
          <li>Transportation and ticketing services</li>
          <li>Telecommunications</li>
          <li>Streaming services and media</li>
          <li>Smartphones, operating systems, and computer hardware</li>
        </ul>

        <h2>Consequences of non-compliance</h2>
        <p>
          Unlike the GDPR, which has a central enforcement mechanism, the EAA is enforced by individual member states. However, the penalties are severe:
        </p>
        <ul>
          <li><strong>Significant fines:</strong> Member states can impose substantial financial penalties.</li>
          <li><strong>Market exclusion:</strong> Non-compliant services can be legally barred from operating in EU markets.</li>
          <li><strong>Brand damage and legal action:</strong> Increased risk of consumer lawsuits and negative public relations.</li>
        </ul>

        <h2>What WCAG 2.1 AA achieves</h2>
        <p>
          The EAA relies on the EN 301 549 standard, which fundamentally maps to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. Achieving WCAG 2.1 AA compliance is the accepted technical threshold for meeting the EAA's legal requirements for web and mobile applications.
        </p>
      </div>

      <div className="mt-16 text-center bg-gray-100 p-10 rounded-3xl">
        <h2 className="text-2xl font-bold mb-6">Are you at risk?</h2>
        <p className="text-muted-foreground mb-8">Run a quick automated scan to see your baseline compliance.</p>
        <Button asChild className="h-14 rounded-full px-10 text-lg font-bold">
          <Link href="/">Run your compliance snapshot</Link>
        </Button>
      </div>
    </div>
  );
}
