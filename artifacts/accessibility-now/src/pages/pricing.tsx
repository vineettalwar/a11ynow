import { useEffect, useRef } from "react";
import { Link } from "wouter";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/faq-accordion";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { Check, Zap, Search, ShieldCheck, ArrowRight } from "lucide-react";

const TIERS = [
  {
    id: "snapshot",
    icon: Zap,
    name: "Snapshot Audit",
    tagline: "Free automated scan",
    price: "Free",
    priceNote: "No account required",
    description:
      "Run an instant WCAG 2.1 automated scan on any public URL. Get a scored report in seconds — the fastest way to understand your baseline.",
    features: [
      "Automated WCAG 2.1 scan",
      "Accessibility score 0–100",
      "Violation count by severity",
      "Downloadable PDF report",
      "Batch scan up to 10 pages",
      "No registration needed",
    ],
    cta: { label: "Run a free scan →", href: "/" },
    highlighted: false,
    badge: null,
  },
  {
    id: "manual",
    icon: Search,
    name: "Full Manual Audit",
    tagline: "One-off engagement",
    price: "from €3,500",
    priceNote: "per engagement",
    description:
      "Rigorous manual testing across your key user journeys by a WCAG-certified specialist. Covers automated gaps — focus order, colour contrast in context, cognitive load, screen-reader compatibility.",
    features: [
      "Up to 25 representative pages",
      "Manual + automated testing",
      "WCAG 2.1 / 2.2 AA coverage",
      "Prioritised developer-ready report",
      "Severity-ranked remediation backlog",
      "30-min results walkthrough call",
      "VPAT / ACR statement draft",
      "12-month audit certificate",
    ],
    cta: { label: "Book a scoping call →", href: "/contact" },
    highlighted: true,
    badge: "Most popular",
  },
  {
    id: "monitoring",
    icon: ShieldCheck,
    name: "Ongoing Monitoring",
    tagline: "Retainer",
    price: "from €890",
    priceNote: "per month",
    description:
      "Stay compliant as you ship. Monthly re-scans, CI/CD pipeline integration, and instant regression alerts mean you catch issues before your users — or regulators — do.",
    features: [
      "Monthly automated re-scans",
      "CI/CD integration & PR checks",
      "Regression alerts via email",
      "Quarterly manual spot-checks",
      "EAA compliance dashboard",
      "Dedicated Slack channel",
      "Annual full re-audit included",
    ],
    cta: { label: "Discuss a retainer →", href: "/contact" },
    highlighted: false,
    badge: null,
  },
];

const FAQS = [
  {
    question: "What if my site has hundreds of pages?",
    answer:
      "The Manual Audit covers up to 25 representative pages — chosen to reflect the broadest range of UI patterns and user journeys. We work with you to select the right pages. For larger sites, we can scope a phased audit across multiple engagements, or focus the first round on your highest-traffic paths.",
  },
  {
    question: "Do you offer discounts for non-profits or public-sector organisations?",
    answer:
      "Yes. We offer a 20% reduction for registered charities and NGOs, and we work on framework agreements with public-sector bodies. Get in touch and mention your organisation type when booking.",
  },
  {
    question: "What does 'from \u20ac3,500' mean -- what drives the final price?",
    answer:
      "The starting figure covers a focused audit of up to 10 pages for a typical marketing or SaaS site. Price increases with page count, technology complexity (e.g. complex SPAs, native mobile apps), turnaround urgency, and whether you need a VPAT / ACR statement for procurement. We provide a fixed quote before any work begins.",
  },
  {
    question: "How is the Monitoring retainer structured?",
    answer:
      "Monthly retainers run on a 3-month minimum, then roll monthly. The fee covers automated re-scans, CI/CD integration, regression alerting, and a quarterly manual spot-check. The annual full re-audit is bundled at no extra cost. You can cancel with 30 days' written notice after the minimum term.",
  },
  {
    question: "Do you help with EAA compliance specifically?",
    answer:
      "Absolutely — EAA compliance is one of our core specialisms. The European Accessibility Act requires many digital products and services to meet EN 301 549 / WCAG 2.1 AA by June 2025. Our audits are scoped to cover the EAA obligations relevant to your product category, and we can produce the conformance statement required for procurement.",
  },
  {
    question: "Can I start with the free scan and upgrade later?",
    answer:
      "Yes. The Snapshot Audit is a great first step — it gives you a directional score and highlights the most common automated violations. When you're ready for a full manual assessment, we take the automated results as a starting point, so you're not paying twice for the same work.",
  },
];

export default function Pricing() {
  const heroRef = useSectionReveal<HTMLElement>();
  const cardsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const faqRef = useSectionReveal<HTMLElement>();
  const ctaRef = useSectionReveal<HTMLElement>();
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
      cleanups.push(() => {
        btn.removeEventListener("mouseenter", enter);
        btn.removeEventListener("mouseleave", leave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      {/* Hero */}
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-4">
            Transparent pricing
          </p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Clear costs,<br />
            <span className="heading-accent">no surprises.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Three tiers to match where you are — a free automated scan to start, a full
            manual audit when you need depth, and a monitoring retainer to stay compliant
            as you ship.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section ref={cardsRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {TIERS.map(({ id, icon: Icon, name, tagline, price, priceNote, description, features, cta, highlighted, badge }) => (
              <div
                key={id}
                className={[
                  "reveal-child relative flex flex-col rounded-2xl border p-8 transition-shadow",
                  highlighted
                    ? "border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.18),0_8px_32px_-4px_hsl(var(--primary)/0.14)] bg-background"
                    : "border-border bg-background hover:border-primary/40",
                ].join(" ")}
              >
                {badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "var(--color-primary, #FF4D1C)" }}
                  >
                    {badge}
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={[
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      highlighted ? "bg-primary/15" : "bg-muted",
                    ].join(" ")}
                  >
                    <Icon className={["w-5 h-5", highlighted ? "text-primary" : "text-muted-foreground"].join(" ")} />
                  </div>
                  <div>
                    <p className="font-extrabold text-base font-sans leading-tight">{name}</p>
                    <p className="text-xs text-muted-foreground">{tagline}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-3xl font-extrabold font-sans tracking-tight">
                    {price}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{priceNote}</p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-7">{description}</p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={["w-4 h-4 mt-0.5 shrink-0", highlighted ? "text-primary" : "text-muted-foreground"].join(" ")}
                        strokeWidth={2.5}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={highlighted ? "default" : "outline"}
                  className={["btn-gsap w-full font-semibold", highlighted ? "" : "[box-shadow:none]"].join(" ")}
                >
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Enterprise callout */}
          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-8 py-6">
            <div>
              <p className="font-bold text-sm font-sans mb-1">Need something larger?</p>
              <p className="text-xs text-muted-foreground max-w-md">
                Enterprise multi-site packages, procurement framework support, and fully managed EAA compliance programmes are available. Let's scope it together.
              </p>
            </div>
            <Button asChild variant="outline" className="btn-gsap shrink-0 [box-shadow:none]">
              <Link href="/contact">Talk to us <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-3xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Common questions
          </p>
          <h2 className="text-display-md font-extrabold mb-3">
            Pricing <span className="heading-accent">FAQs</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-10 reveal-body">
            Can't find what you're looking for? Drop us a line and we'll answer within one business day.
          </p>
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Not sure which<br />
            <span className="heading-accent">tier fits?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Start with a free automated scan — it takes 30 seconds and gives you a
            directional score. Then book a call if you need expert eyes on the result.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free scan →</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/contact">Book a call</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
