"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckSquare, Smartphone, ListChecks, ShoppingCart } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const ITEMS = [
  { href: "/resources/eaa-checklist", icon: CheckSquare, title: "EAA Checklist", description: "Interactive checklist of the key requirements for EAA / BFSG compliance, including WCAG 2.2 additions.", count: "60+ checks" },
  { href: "/tools/wcag-checklist", icon: ListChecks, title: "WCAG 2.1 AA Checklist", description: "Every Level A and AA success criterion broken down with plain-English testing guidance.", count: "50 SCs" },
  { href: "/tools/mobile-checklist", icon: Smartphone, title: "Mobile Accessibility Checklist", description: "Touch targets, gestures, screen reader rotor, and platform-specific patterns for iOS and Android.", count: "30+ checks" },
  { href: "/resources/technologies/shopify", icon: ShoppingCart, title: "Shopify EAA Pre-flight", description: "Storefront and theme audit list for merchants approaching the EAA enforcement deadline.", count: "Coming soon" },
];

export default function ChecklistsIndex() {
  const heroRef = useSectionReveal<HTMLDivElement>();
  const gridRef = useSectionReveal<HTMLDivElement>({ staggerSelector: ".reveal-child" });

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-20 pb-14 px-4">
        <div ref={heroRef} className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">Resources · Checklists</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Accessibility <span className="heading-accent">checklists.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Interactive, scoped checklists you can run yourself or hand to a vendor. Each one tracks progress as you work and exports to PDF.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div ref={gridRef} className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ITEMS.map(({ href, icon: Icon, title, description, count }) => (
              <Link key={href} href={href} className="block group reveal-child">
                <Card className="border shadow-none group-hover:shadow-sm transition-shadow h-full">
                  <CardContent className="p-7">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-muted">{count}</span>
                    </div>
                    <h2 className="text-base font-bold font-sans mb-2">{title}</h2>
                    <p className="text-muted-foreground text-xs mb-5 leading-relaxed">{description}</p>
                    <span className="text-primary text-sm font-medium font-sans flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Open checklist <ArrowRight className="w-4 h-4" />
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
