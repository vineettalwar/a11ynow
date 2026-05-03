import { Link } from "wouter";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "@/hooks/use-section-reveal";

export type SeoSection = {
  heading: string;
  body?: string;
  bullets?: string[];
  code?: string;
};

export type SeoArticleContent = {
  breadcrumb: { href: string; label: string }[];
  kicker: string;
  title: string;
  titleAccent: string;
  intro: string;
  sections: SeoSection[];
  related?: { href: string; label: string; description?: string }[];
  ctaTitle?: string;
  ctaBody?: string;
};

function renderBody(body: string) {
  return body.split(/\n\n+/).map((para, i) => (
    <p key={i} className="text-muted-foreground leading-relaxed mb-4 text-sm md:text-base">
      {para.trim()}
    </p>
  ));
}

export function SeoArticle({ content }: { content: SeoArticleContent }) {
  const heroRef = useSectionReveal<HTMLDivElement>();
  const bodyRef = useSectionReveal<HTMLDivElement>({ staggerSelector: ".reveal-child" });

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-20 pb-14 px-4">
        <div ref={heroRef} className="container mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground reveal-child">
            {content.breadcrumb.map((c, i) => (
              <span key={c.href} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                {i === content.breadcrumb.length - 1 ? (
                  <span className="text-foreground">{c.label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-foreground transition-colors">{c.label}</Link>
                )}
              </span>
            ))}
          </nav>
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">{content.kicker}</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            {content.title}{" "}
            <span className="heading-accent">{content.titleAccent}</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">{content.intro}</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div ref={bodyRef} className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
          <article className="min-w-0">
            {content.sections.map((s, i) => (
              <div key={i} className="mb-12 reveal-child">
                <h2 className="text-2xl md:text-3xl font-extrabold mb-5 tracking-tight">{s.heading}</h2>
                {s.body && renderBody(s.body)}
                {s.bullets && (
                  <ul className="space-y-2.5 mt-3">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.code && (
                  <pre className="mt-4 p-4 rounded-xl bg-muted/40 border text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>{s.code}</code>
                  </pre>
                )}
              </div>
            ))}
          </article>

          {content.related && content.related.length > 0 && (
            <aside className="lg:sticky lg:top-20 self-start">
              <div className="border rounded-2xl p-6 bg-muted/20">
                <h3 className="font-extrabold text-sm font-sans mb-4">Related reading</h3>
                <ul className="space-y-4">
                  {content.related.map((r) => (
                    <li key={r.href}>
                      <Link href={r.href} className="block group">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{r.label}</p>
                        {r.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.description}</p>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </section>

      <section className="py-16 px-4 warm-section">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-display-md font-extrabold mb-4">
            {content.ctaTitle ?? "Want this audited"} <span className="heading-accent">properly?</span>
          </h2>
          <p className="text-muted-foreground mb-8 text-sm md:text-base max-w-xl mx-auto">
            {content.ctaBody ?? "We run real, manual WCAG 2.2 audits with assistive-tech testing and prioritised remediation guidance."}
          </p>
          <Button size="lg" className="font-semibold px-7" asChild>
            <Link href="/contact">Talk to an engineer <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
