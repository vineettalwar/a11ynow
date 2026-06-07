"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckSquare, FileText, ShieldCheck, Layers, BookMarked, ArrowRight } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const SECTIONS = [
  {
    href: "/resources/guides",
    icon: BookOpen,
    title: "Guides",
    description: "Engineering-grade walkthroughs of WCAG, ARIA, keyboard accessibility, and screen readers.",
    items: ["WCAG 2.2", "ARIA", "Keyboard accessibility", "Screen readers"],
  },
  {
    href: "/resources/checklists",
    icon: CheckSquare,
    title: "Checklists",
    description: "Interactive checklists you can run, track, and export - covering EAA, WCAG, and mobile.",
    items: ["EAA Checklist", "WCAG 2.1 AA", "Mobile Accessibility", "Shopify Pre-flight"],
  },
  {
    href: "/resources/glossary",
    icon: BookMarked,
    title: "Glossary",
    description: "Plain-English definitions for the acronyms, regulations, and jargon you will hear.",
    items: ["WCAG", "EAA", "VPAT", "EN 301 549"],
  },
  {
    href: "/resources/compliance",
    icon: ShieldCheck,
    title: "Compliance",
    description: "Accessibility laws and standards that apply to your business, region by region.",
    items: ["EAA", "ADA", "Section 508", "AODA", "EN 301 549"],
  },
  {
    href: "/resources/technologies",
    icon: Layers,
    title: "Technologies",
    description: "Where each platform helps and where it hurts - from WordPress to Next.js.",
    items: ["WordPress", "TYPO3", "Drupal", "Shopify", "React", "Next.js"],
  },
  {
    href: "/resources/blog",
    icon: FileText,
    title: "Engineering blog",
    description: "Technical deep-dives into accessible component patterns and EAA enforcement.",
    items: ["EAA enforcement", "WCAG e-commerce", "Automated vs manual"],
  },
];

export default function Resources() {
  const heroRef = useSectionReveal<HTMLDivElement>();
  const gridRef = useSectionReveal<HTMLDivElement>({ staggerSelector: ".reveal-child" });

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div ref={heroRef} className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">Resources</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Guides, checklists,<br />
            <span className="heading-accent">references.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Everything we wish someone had handed us when we started doing accessibility work - written by engineers, for engineers.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div ref={gridRef} className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECTIONS.map(({ href, icon: Icon, title, description, items }) => (
              <Link key={href} href={href} className="block group reveal-child">
                <Card className="border shadow-none group-hover:shadow-sm transition-shadow h-full">
                  <CardContent className="p-7">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-base font-bold font-sans mb-2">{title}</h2>
                    <p className="text-muted-foreground text-xs mb-4 leading-relaxed">{description}</p>
                    <ul className="space-y-1 mb-5">
                      {items.map((it) => (
                        <li key={it} className="text-xs font-mono text-muted-foreground">· {it}</li>
                      ))}
                    </ul>
                    <span className="text-primary text-sm font-medium font-sans flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Browse <ArrowRight className="w-4 h-4" />
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
