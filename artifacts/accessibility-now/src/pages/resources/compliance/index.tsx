import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Globe, Flag, Building2, ShieldCheck, FileText } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const ITEMS = [
  { href: "/eaa", icon: Globe, title: "European Accessibility Act", description: "EU Directive 2019/882 - applied from 28 June 2025 across all member states.", region: "EU" },
  { href: "/resources/compliance/en-301-549", icon: ShieldCheck, title: "EN 301 549", description: "The harmonised European standard for ICT accessibility, referenced by the EAA and WAD.", region: "EU" },
  { href: "/resources/compliance/ada", icon: Flag, title: "ADA", description: "Americans with Disabilities Act, applied to U.S. websites and apps by federal courts.", region: "US" },
  { href: "/resources/compliance/section-508", icon: Building2, title: "Section 508", description: "U.S. federal procurement standard. VPATs and ACRs explained.", region: "US Federal" },
  { href: "/resources/compliance/aoda", icon: FileText, title: "AODA", description: "Accessibility for Ontarians with Disabilities Act - Ontario, Canada.", region: "CA" },
  { href: "/resources/compliance/uk-equality-act", icon: Flag, title: "UK Equality Act", description: "Service provider obligations and PSBAR for UK public sector websites.", region: "UK" },
  { href: "/resources/compliance/wcag-22", icon: ShieldCheck, title: "WCAG 2.2", description: "New success criteria, focus rules, and who should target 2.2 AA.", region: "Global" },
];

export default function ComplianceIndex() {
  const heroRef = useSectionReveal<HTMLDivElement>();
  const gridRef = useSectionReveal<HTMLDivElement>({ staggerSelector: ".reveal-child" });

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-20 pb-14 px-4">
        <div ref={heroRef} className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">Resources · Compliance</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Accessibility laws and <span className="heading-accent">standards.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Plain-English explanations of the regulations and standards that apply to your business, what they require, and how to demonstrate conformance.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div ref={gridRef} className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ITEMS.map(({ href, icon: Icon, title, description, region }) => (
              <Link key={href} href={href} className="block group reveal-child">
                <Card className="border shadow-none group-hover:shadow-sm transition-shadow h-full">
                  <CardContent className="p-7">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-muted">{region}</span>
                    </div>
                    <h2 className="text-base font-bold font-sans mb-2">{title}</h2>
                    <p className="text-muted-foreground text-xs mb-5 leading-relaxed">{description}</p>
                    <span className="text-primary text-sm font-medium font-sans flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Read guide <ArrowRight className="w-4 h-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
