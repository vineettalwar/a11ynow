import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, Keyboard, Volume2, Code2 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const ITEMS = [
  { href: "/resources/wcag-guide", icon: BookOpen, title: "WCAG 2.2", description: "POUR principles, levels A/AA/AAA, and the nine new criteria added in 2.2." },
  { href: "/resources/guides/aria", icon: Code2, title: "ARIA without breaking things", description: "When to use ARIA, when not to, and the patterns that actually work." },
  { href: "/resources/guides/keyboard-accessibility", icon: Keyboard, title: "Keyboard accessibility", description: "Focus management, indicators, traps, and the new WCAG 2.2 focus appearance rules." },
  { href: "/resources/guides/screen-readers", icon: Volume2, title: "Screen readers", description: "How NVDA, JAWS, VoiceOver, and TalkBack actually consume your pages." },
];

export default function GuidesIndex() {
  const heroRef = useSectionReveal<HTMLDivElement>();
  const gridRef = useSectionReveal<HTMLDivElement>({ staggerSelector: ".reveal-child" });

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-20 pb-14 px-4">
        <div ref={heroRef} className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">Resources · Guides</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Accessibility <span className="heading-accent">guides.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Engineering-grade guides written by accessibility specialists. No fluff, no overlay marketing - just the patterns and pitfalls we see every week.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div ref={gridRef} className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ITEMS.map(({ href, icon: Icon, title, description }) => (
              <Link key={href} href={href} className="block group reveal-child">
                <Card className="border shadow-none group-hover:shadow-sm transition-shadow h-full">
                  <CardContent className="p-7">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-primary" />
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
