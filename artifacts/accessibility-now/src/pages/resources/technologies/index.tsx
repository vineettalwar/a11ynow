import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const ITEMS = [
  { href: "/resources/technologies/wordpress", title: "WordPress", description: "Themes, page builders, plugins, and the FSE block editor.", category: "CMS", logo: "WP" },
  { href: "/resources/technologies/typo3", title: "TYPO3", description: "Enterprise CMS dominant across DACH, used by public sector and universities.", category: "CMS", logo: "T3" },
  { href: "/resources/technologies/drupal", title: "Drupal", description: "Used by europa.eu and the EU public sector. Olivero, Layout Builder, Webform.", category: "CMS", logo: "D" },
  { href: "/resources/technologies/shopify", title: "Shopify", description: "Themes, apps, checkout extensibility, and the EAA merchant obligation.", category: "E-commerce", logo: "S" },
  { href: "/resources/technologies/react", title: "React", description: "Component primitives, focus management, and testing for accessible React apps.", category: "Framework", logo: "Re" },
  { href: "/resources/technologies/nextjs", title: "Next.js", description: "App router, server components, and accessible patterns for the most popular React framework.", category: "Framework", logo: "Nx" },
];

export default function TechnologiesIndex() {
  const heroRef = useSectionReveal<HTMLDivElement>();
  const gridRef = useSectionReveal<HTMLDivElement>({ staggerSelector: ".reveal-child" });

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-20 pb-14 px-4">
        <div ref={heroRef} className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">Resources · Technologies</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Accessibility by <span className="heading-accent">platform.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Where each technology helps, where it hurts, and the specific patterns we use to deliver accessible experiences on it.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div ref={gridRef} className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ITEMS.map(({ href, title, description, category, logo }) => (
              <Link key={href} href={href} className="block group reveal-child">
                <Card className="border shadow-none group-hover:shadow-sm transition-shadow h-full">
                  <CardContent className="p-7">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="font-mono font-bold text-primary text-sm">{logo}</span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-muted">{category}</span>
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
