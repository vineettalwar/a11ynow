import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { CalendarClock, ArrowLeft, Clock } from "lucide-react";

export default function BlogEaaEnforcement() {
  const heroRef = useSectionReveal<HTMLElement>();
  const bodyRef = useSectionReveal<HTMLElement>();
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
      cleanups.push(() => { btn.removeEventListener("mouseenter", enter); btn.removeEventListener("mouseleave", leave); });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      {/* Hero */}
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link href="/resources/blog" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-8 font-sans">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to blog
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-sans uppercase tracking-wider">
              Compliance
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="w-3.5 h-3.5" /> 7 min read
            </span>
            <span className="text-xs text-muted-foreground font-mono">January 2025</span>
          </div>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            The EAA enforcement<br />
            <span className="heading-accent">timeline, explained.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            June 2025 is closer than most organisations realise. Here is a precise breakdown of what
            the European Accessibility Act requires, when, and what the consequences of missing the
            deadline look like.
          </p>
        </div>
      </section>

      {/* Article body */}
      <section ref={bodyRef} className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-0">
              What is the <span className="heading-accent">EAA?</span>
            </h2>
            <p>
              The European Accessibility Act (Directive 2019/882) is a harmonisation directive that sets
              common accessibility requirements for a broad range of products and services across EU member
              states. Its goal is to eliminate the fragmented landscape of national accessibility laws that
              made it difficult for businesses to operate across borders.
            </p>
            <p>
              Before the EAA, accessibility legislation in Europe was a patchwork. Germany had the BITV,
              France the RGAA, the UK the Public Sector Bodies Accessibility Regulations. A product compliant
              in one country might not be compliant in another. The EAA creates a single standard — and a
              single enforcement framework — across the bloc.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-12">
              What products and services does it cover?
            </h2>
            <p>The EAA applies to a defined — but substantial — list of product and service categories:</p>
            <ul>
              <li>Computers and operating systems</li>
              <li>ATMs, ticketing machines, and check-in kiosks</li>
              <li>Smartphones and tablets</li>
              <li>Television and broadcasting equipment</li>
              <li>E-commerce (online stores, marketplaces)</li>
              <li>Banking and financial services</li>
              <li>Transport services (air, rail, bus, urban, waterborne)</li>
              <li>E-books and dedicated reading software</li>
              <li>Electronic communications services (VOIP, messaging)</li>
              <li>Emergency services communications</li>
            </ul>
            <p>
              Notably absent from the list: B2B enterprise software that is not customer-facing, and most
              internal tooling. However, if your organisation sells software or services to any of the
              sectors above, your product may still be in scope as an enabling technology.
            </p>

            {/* Timeline block */}
            <div className="not-prose my-10">
              <div className="rounded-2xl border overflow-hidden">
                <div className="bg-muted/50 px-6 py-4 border-b">
                  <h3 className="font-extrabold text-sm font-sans flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-primary" />
                    Complete EAA timeline
                  </h3>
                </div>
                <div className="divide-y">
                  {[
                    {
                      date: "June 2019",
                      event: "Directive 2019/882 enters into force",
                      detail: "The EAA is published in the Official Journal of the EU. The clock starts for member state transposition.",
                      status: "done",
                    },
                    {
                      date: "June 2022",
                      event: "Member state transposition deadline",
                      detail: "All 27 EU member states must incorporate the EAA into national law. Most have done so, though implementation varies.",
                      status: "done",
                    },
                    {
                      date: "28 June 2025",
                      event: "Enforcement begins for new products and services",
                      detail: "All products placed on the EU market and services provided for the first time after this date must comply. This is the primary deadline.",
                      status: "critical",
                    },
                    {
                      date: "27 June 2030",
                      event: "Grace period expires",
                      detail: "Products already on the market before June 2025 must comply by this date — unless substantially modified earlier, which resets the clock.",
                      status: "future",
                    },
                    {
                      date: "27 June 2030",
                      event: "Service contracts signed before 2025",
                      detail: "Service contracts entered into before June 2025 are exempt until June 2030, or until they are renewed.",
                      status: "future",
                    },
                  ].map((milestone) => (
                    <div key={milestone.date + milestone.event} className={`flex items-start gap-4 px-6 py-5 ${milestone.status === "critical" ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        milestone.status === "done" ? "bg-muted-foreground/40" :
                        milestone.status === "critical" ? "bg-primary" : "bg-border"
                      }`} aria-hidden="true" />
                      <div>
                        <p className="font-mono text-xs text-muted-foreground mb-0.5">{milestone.date}</p>
                        <p className={`font-bold text-sm font-sans mb-1 ${milestone.status === "critical" ? "text-primary" : ""}`}>
                          {milestone.event}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{milestone.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-12">
              The micro-enterprise exemption
            </h2>
            <p>
              The EAA includes an exemption for micro-enterprises providing services (not products). A
              micro-enterprise is defined as an organisation with fewer than 10 employees AND an annual
              turnover or balance sheet total not exceeding EUR 2 million.
            </p>
            <p>
              If you meet both criteria and provide services (not products), you are exempt from EAA
              requirements. However, you are not exempt from applicable national legislation, and the
              exemption does not provide cover if you pursue public procurement contracts, which typically
              have their own accessibility requirements.
            </p>
            <p>
              Manufacturers (hardware and software product companies) do not benefit from this exemption —
              only service providers do.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-12">
              The disproportionate burden provision
            </h2>
            <p>
              The EAA allows organisations to claim a disproportionate burden exception where making a
              product or service accessible would impose an excessive cost or organisational burden. This is
              not a blanket opt-out.
            </p>
            <p>To claim disproportionate burden, you must:</p>
            <ol>
              <li>Formally assess the burden (cost, impact, scale of the organisation)</li>
              <li>Document the assessment</li>
              <li>Notify the relevant national competent authority</li>
              <li>Make the documentation available to the public</li>
              <li>Reassess the situation regularly</li>
            </ol>
            <p>
              Authorities can — and will — challenge disproportionate burden claims. A large e-commerce
              company claiming burden because fixing an inaccessible checkout would be "too expensive" is
              unlikely to succeed.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-12">
              What enforcement looks like in practice
            </h2>
            <p>
              Enforcement is handled at national level by market surveillance authorities. The specific
              agency varies by country — in Germany it is the Federal Network Agency, in Ireland it is CCPC.
            </p>
            <p>Penalties also vary by member state, but the enforcement toolkit typically includes:</p>
            <ul>
              <li>Compulsory compliance orders with deadlines</li>
              <li>Fines proportional to organisation size and turnover</li>
              <li>Product or service market withdrawal</li>
              <li>Public disclosure of non-compliant operators</li>
            </ul>
            <p>
              Complaints can be filed by individual users or representative organisations. In several member
              states, disability organisations have already filed complaints against digital service providers
              in anticipation of the 2025 enforcement date.
            </p>
            <p>
              Beyond regulatory risk, non-compliant organisations also face reputational exposure and
              exclusion from public procurement. Many EU public-sector buyers already require EAA compliance
              as a condition of contract.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mb-4 mt-12">
              What you should do now
            </h2>
            <p>
              The most common reason organisations are unprepared is underestimating how long accessibility
              remediation takes. A typical enterprise web application requires 3--6 months of audit, planning,
              and remediation work before it can credibly claim WCAG 2.1 AA conformance. That timeline
              compresses uncomfortably when you factor in development sprints, design reviews, and testing
              cycles.
            </p>
            <p>The practical steps, in order:</p>
            <ol>
              <li><strong>Scope assessment</strong> -- determine which products and services are covered and whether any exemptions apply.</li>
              <li><strong>Baseline audit</strong> -- commission a WCAG 2.1 AA audit to understand current gap to compliance.</li>
              <li><strong>Remediation planning</strong> -- prioritise critical violations (keyboard inaccessibility, missing alt text, poor contrast) for immediate attention.</li>
              <li><strong>Conformance statement</strong> -- publish an Accessibility Statement before June 2025, even if it acknowledges known issues.</li>
              <li><strong>Monitoring</strong> -- establish ongoing testing to prevent regression after compliance is achieved.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Not sure where<br />
            <span className="heading-accent">you stand?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Run a free automated scan for a directional score, or book a full EAA-scoped audit with a compliance report.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free scan &#8594;</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/contact">Book an audit</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
