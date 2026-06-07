"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { ArrowRight, Clock } from "lucide-react";

const ARTICLES = [
  {
    href: "/resources/blog/eaa-enforcement",
    category: "Compliance",
    date: "January 2025",
    readTime: "7 min read",
    title: "The EAA enforcement timeline, explained.",
    excerpt:
      "June 2025 is closer than most organisations realise. A precise breakdown of what the European Accessibility Act requires, when, and what missing the deadline means for your organisation.",
    featured: true,
  },
  {
    href: "/resources/blog/wcag-ecommerce",
    category: "E-commerce",
    date: "February 2025",
    readTime: "9 min read",
    title: "The 8 most common WCAG failures in e-commerce.",
    excerpt:
      "Based on hundreds of audits across European e-commerce platforms - the violations we encounter most reliably and the ones most likely to trigger EAA enforcement action.",
    featured: false,
  },
  {
    href: "/resources/blog/automated-vs-manual",
    category: "Testing",
    date: "March 2025",
    readTime: "8 min read",
    title: "Automated vs manual accessibility testing.",
    excerpt:
      "Automated scanners catch around 30% of WCAG violations. Understanding what they miss - and why manual testing with screen readers is non-negotiable - changes how you plan your testing strategy.",
    featured: false,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Compliance: "bg-blue-50 text-blue-700",
  "E-commerce": "bg-orange-50 text-orange-700",
  Testing: "bg-green-50 text-green-700",
  Engineering: "bg-purple-50 text-purple-700",
};

export default function Blog() {
  const heroRef = useSectionReveal<HTMLElement>();
  const articlesRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const buttons = el.querySelectorAll<HTMLElement>(".btn-gsap");
    const cleanups: (() => void)[] = [];
    buttons.forEach((btn) => {
      const enter = () => gsap.to(btn, { scale: 1.04, duration: 0.18, ease: "power2.out" });
      const leave = () => gsap.to(btn, { scale: 1, duration: 0.18, ease: "power2.out" });
      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);
      cleanups.push(() => { btn.removeEventListener("mouseenter", enter); btn.removeEventListener("mouseleave", leave); });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  const featured = ARTICLES.find((a) => a.featured)!;
  const rest = ARTICLES.filter((a) => !a.featured);

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      {/* Hero */}
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-4">Engineering perspectives</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Accessibility<br />
            <span className="heading-accent">insights.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Compliance updates, technical deep-dives, and accessibility patterns from our engineering
            team. Written for developers, designers, and product leads navigating EAA requirements.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section ref={articlesRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          {/* Featured article */}
          <Link
            href={featured.href}
            className="reveal-child group block mb-8 rounded-2xl border bg-background hover:border-primary/40 transition-colors overflow-hidden"
          >
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider ${CATEGORY_COLORS[featured.category] ?? "bg-muted text-muted-foreground"}`}>
                  {featured.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Clock className="w-3.5 h-3.5" /> {featured.readTime}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{featured.date}</span>
                <span className="ml-auto hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-sans">
                  Featured
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold font-sans mb-4 group-hover:text-primary transition-colors leading-tight">
                {featured.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-6">{featured.excerpt}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                Read article <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Other articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rest.map((article) => (
              <Link
                key={article.href}
                href={article.href}
                className="reveal-child group flex flex-col rounded-2xl border bg-background hover:border-primary/40 transition-colors p-8"
              >
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider ${CATEGORY_COLORS[article.category] ?? "bg-muted text-muted-foreground"}`}>
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="w-3.5 h-3.5" /> {article.readTime}
                  </span>
                </div>
                <h2 className="text-base font-extrabold font-sans mb-3 group-hover:text-primary transition-colors leading-snug flex-1">
                  {article.title}
                </h2>
                <p className="text-muted-foreground text-xs leading-relaxed mb-6">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-mono">{article.date}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:gap-2.5 transition-all">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter-style CTA */}
      <section className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-display-md font-extrabold mb-4">
            Stay ahead of<br />
            <span className="heading-accent">EAA changes.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8 leading-relaxed reveal-body">
            Enforcement is evolving quickly. Subscribe to our compliance updates and get new articles direct to your inbox.
          </p>
          <Link
            href="/contact"
            className="btn-gsap inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Get compliance updates <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
