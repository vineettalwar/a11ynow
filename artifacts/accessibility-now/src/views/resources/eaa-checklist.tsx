"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { useBtnGsapHover } from "@/hooks/use-btn-gsap-hover";
import { Check, AlertTriangle, CalendarClock, FileText, ShieldCheck, MonitorSmartphone, Download, ListChecks } from "lucide-react";

const STORAGE_KEY = "eaa-checklist-v2";

interface ChecklistItem {
  id: string;
  text: string;
  note?: string;
  critical?: boolean;
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  items: ChecklistItem[];
}

const SECTIONS: ChecklistSection[] = [
  {
    id: "scope",
    title: "Scope Assessment",
    icon: AlertTriangle,
    description: "Determine whether the EAA applies to your organisation and which products or services are covered.",
    items: [
      {
        id: "s1",
        text: "Your organisation places products or provides services in the EU market after 28 June 2025.",
        critical: true,
      },
      {
        id: "s2",
        text: "You have identified all digital products and services covered by the EAA (websites, mobile apps, e-commerce, banking services, transport ticketing, e-books, etc.).",
        critical: true,
      },
      {
        id: "s3",
        text: "You have confirmed whether the micro-enterprise exemption applies (fewer than 10 employees AND annual turnover or balance sheet total not exceeding \u20ac2 million).",
        note: "Micro-enterprises providing services are exempt from EAA requirements but not from fundamental accessibility obligations.",
      },
      {
        id: "s4",
        text: "For each covered product/service, you have documented which version (existing vs new) triggers compliance obligations.",
        note: "Products already on the market before June 2025 have a 5-year grace period (to 2030) unless substantially modified.",
      },
      {
        id: "s5",
        text: "You have assessed whether a disproportionate burden exemption might apply and documented the justification.",
        note: "Disproportionate burden must be formally assessed and notified to the competent authority. It is not a blanket opt-out.",
      },
    ],
  },
  {
    id: "technical",
    title: "Technical Accessibility (WCAG 2.1 AA)",
    icon: MonitorSmartphone,
    description: "The EAA references EN 301 549, which in turn incorporates WCAG 2.1 AA for web and mobile. These are the core technical requirements.",
    items: [
      {
        id: "t1",
        text: "All non-text content (images, icons, charts, infographics) has a text alternative that serves the equivalent purpose.",
        critical: true,
      },
      {
        id: "t2",
        text: "Pre-recorded audio and video content includes captions and a transcript.",
        critical: true,
      },
      {
        id: "t3",
        text: "Information, structure, and relationships are conveyed through semantic HTML (headings, lists, tables, labels) not just visual styling.",
        critical: true,
      },
      {
        id: "t4",
        text: "Text and images of text have a colour contrast ratio of at least 4.5:1 (3:1 for large text 18pt+ or 14pt bold).",
        critical: true,
      },
      {
        id: "t5",
        text: "Colour is never used as the only means of conveying information, indicating action, or distinguishing elements.",
      },
      {
        id: "t6",
        text: "All functionality is available via keyboard alone. No keyboard traps exist.",
        critical: true,
      },
      {
        id: "t7",
        text: "A visible, high-contrast focus indicator is provided for all interactive elements.",
        critical: true,
      },
      {
        id: "t8",
        text: "Skip navigation links allow keyboard users to bypass repeated blocks of content.",
      },
      {
        id: "t9",
        text: "Pages have descriptive <title> elements and the lang attribute is set on <html>.",
      },
      {
        id: "t10",
        text: "Link purpose is clear from the link text alone (no 'Click here' or 'Read more' without context).",
      },
      {
        id: "t11",
        text: "Form fields have visible, programmatically associated <label> elements.",
        critical: true,
      },
      {
        id: "t12",
        text: "Input errors are automatically detected, identified in text, and suggestions for correction are provided.",
        critical: true,
      },
      {
        id: "t13",
        text: "Content reflows to a single column without horizontal scrolling at 320px-equivalent viewport width.",
      },
      {
        id: "t14",
        text: "Non-text UI components (form borders, icon buttons) have 3:1 contrast against adjacent colours.",
      },
      {
        id: "t15",
        text: "Status messages (success confirmations, loading states, error banners) are announced to screen readers without requiring focus.",
        critical: true,
      },
      {
        id: "t16",
        text: "No content flashes more than three times per second.",
      },
      {
        id: "t17",
        text: "Users can control, pause, or stop any automatically moving, blinking, or scrolling content.",
      },
      {
        id: "t18",
        text: "Custom interactive components expose correct roles, states, and properties via ARIA.",
        critical: true,
      },
      {
        id: "t19",
        text: "Touch targets on mobile have a minimum size of 44\u00d744 pixels and adequate spacing.",
      },
      {
        id: "t20",
        text: "The site has been tested with at least one screen reader (NVDA+Firefox, JAWS+Chrome, or VoiceOver+Safari).",
        critical: true,
      },
    ],
  },
  {
    id: "documentation",
    title: "Documentation & Statements",
    icon: FileText,
    description: "The EAA requires organisations to produce and publish specific documentation.",
    items: [
      {
        id: "d1",
        text: "An Accessibility Statement (conformance statement) is published, explaining current conformance level and any known exceptions.",
        critical: true,
        note: "The statement must be based on actual testing, not aspirational. Refer to WCAG 2.1 AA and EN 301 549 explicitly.",
      },
      {
        id: "d2",
        text: "The Accessibility Statement is easily findable (linked from footer, accessibility page, or as a dedicated page).",
        critical: true,
      },
      {
        id: "d3",
        text: "The statement includes a feedback mechanism (email address or contact form) for users to report accessibility barriers.",
        critical: true,
      },
      {
        id: "d4",
        text: "The statement includes escalation information for enforcement (relevant national authority contact).",
      },
      {
        id: "d5",
        text: "A VPAT (Voluntary Product Accessibility Template) or ACR (Accessibility Conformance Report) has been prepared for procurement contexts.",
        note: "Required for B2B / public-sector sales in many procurement frameworks.",
      },
      {
        id: "d6",
        text: "Internal process documentation covers how accessibility issues are reported, triaged, and resolved.",
      },
      {
        id: "d7",
        text: "Accessibility is included in your product definition of done and design review processes.",
      },
    ],
  },
  {
    id: "timeline",
    title: "Deadline & Timeline",
    icon: CalendarClock,
    description: "The EAA enforcement timeline has hard deadlines. Missing them exposes your organisation to enforcement action.",
    items: [
      {
        id: "tl1",
        text: "Your accessibility audit (or baseline assessment) is scheduled to complete before June 28, 2025.",
        critical: true,
      },
      {
        id: "tl2",
        text: "Remediation work is planned with sufficient lead time to address critical issues before the deadline.",
        critical: true,
      },
      {
        id: "tl3",
        text: "Stakeholders and leadership have been briefed on the June 2025 enforcement date and its implications.",
      },
      {
        id: "tl4",
        text: "A plan is in place for the 2030 deadline affecting products placed on market before June 2025.",
        note: "Existing products get a 5-year grace period, but substantial modifications reset the clock to the 2025 rules.",
      },
      {
        id: "tl5",
        text: "You have identified the national enforcement authority in each EU member state where you operate.",
        note: "Enforcement is handled at national level. Some countries are more active than others.",
      },
    ],
  },
  {
    id: "monitoring",
    title: "Ongoing Monitoring",
    icon: ShieldCheck,
    description: "Compliance is not a one-time event. Continuous monitoring prevents regression as your product evolves.",
    items: [
      {
        id: "m1",
        text: "Automated accessibility scans are integrated into your CI/CD pipeline (or run at least weekly).",
        critical: true,
      },
      {
        id: "m2",
        text: "A schedule for periodic manual re-testing is in place (at minimum annually, ideally quarterly).",
      },
      {
        id: "m3",
        text: "New features and components go through accessibility review before production release.",
        critical: true,
      },
      {
        id: "m4",
        text: "Your design system or component library is accessibility-reviewed at the component level.",
      },
      {
        id: "m5",
        text: "Third-party components and embeds (chat widgets, analytics overlays, payment forms) have been accessibility-tested.",
        note: "You are responsible for your whole page, including third-party content you embed.",
      },
      {
        id: "m6",
        text: "Your Accessibility Statement is reviewed and updated after significant product changes.",
        critical: true,
      },
      {
        id: "m7",
        text: "Accessibility feedback from users is routed to the product/engineering team and tracked.",
      },
    ],
  },
  {
    id: "wcag22",
    title: "WCAG 2.2 Additions",
    icon: ListChecks,
    description: "WCAG 2.2 (October 2023) introduced six new criteria at Level A and AA. EN 301 549 v3.2.1 references these, and EAA-scoped audits are increasingly expected to cover them.",
    items: [
      {
        id: "w1",
        text: "Focus indicators meet the enhanced appearance requirements: at least 2 CSS pixels of outline, with a 3:1 contrast ratio between focused and unfocused states (SC 2.4.11).",
        critical: true,
        note: "WCAG 2.2 SC 2.4.11 Focus Appearance (AA). This strengthens the existing 2.4.7 requirement - a faint dotted outline is no longer sufficient.",
      },
      {
        id: "w2",
        text: "All functionality that uses a dragging movement also has a single-pointer alternative (e.g. click-to-place, keyboard controls, or step buttons) (SC 2.5.7).",
        note: "WCAG 2.2 SC 2.5.7 Dragging Movements (AA). Affects drag-and-drop file uploads, sliders, kanban boards, and sorting interfaces.",
      },
      {
        id: "w3",
        text: "Interactive targets (buttons, links, form controls) have a minimum bounding area of 24×24 CSS pixels, or adequate spacing around smaller targets (SC 2.5.8).",
        critical: true,
        note: "WCAG 2.2 SC 2.5.8 Target Size Minimum (AA). 24×24px is the floor; 44×44px is still best practice for mobile. Targets can be smaller if spacing compensates.",
      },
      {
        id: "w4",
        text: "Help mechanisms (chat links, phone numbers, contact forms, self-help pages) appear in the same location relative to page content across all pages where they appear (SC 3.2.6).",
        note: "WCAG 2.2 SC 3.2.6 Consistent Help (A). Applies wherever a repeated help mechanism exists - typically site-wide footers, nav bars, or persistent widgets.",
      },
      {
        id: "w5",
        text: "Users are not required to re-enter information they have already provided in the same process or session, unless re-entering is essential or required for security (SC 3.3.7).",
        note: "WCAG 2.2 SC 3.3.7 Redundant Entry (A). Common in multi-step checkout, form wizards, and registration flows. Auto-fill or echoing previous answers satisfies this.",
      },
      {
        id: "w6",
        text: "Authentication steps do not rely solely on a cognitive function test (memorising a password, solving a puzzle, transcribing characters) without offering an alternative method or assistance such as copy-paste or a password manager (SC 3.3.8).",
        critical: true,
        note: "WCAG 2.2 SC 3.3.8 Accessible Authentication Minimum (AA). Copy-paste must work in password fields. Object recognition (e.g. 'click the bicycle') is a cognitive function test - it must have an alternative.",
      },
    ],
  },
];

function loadState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function EaaChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const heroRef = useSectionReveal<HTMLElement>();
  const timelineRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChecked(loadState());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {}
  }, [checked]);

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const reset = () => setChecked({});

  const allItems = SECTIONS.flatMap((s) => s.items);
  const totalCount = allItems.length;
  const completedCount = allItems.filter((item) => checked[item.id]).length;
  const criticalItems = allItems.filter((item) => item.critical);
  const criticalDone = criticalItems.filter((item) => checked[item.id]).length;
  const overallProgress = Math.round((completedCount / totalCount) * 100);

  const handlePrint = () => window.print();

  useBtnGsapHover(pageRef, 0.18);

  return (
    <div ref={pageRef} className="flex flex-col w-full">
      {/* Hero */}
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-4">EAA readiness</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            EAA Compliance<br />
            <span className="heading-accent">Checklist.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            A structured readiness assessment covering scope, technical requirements, documentation,
            deadlines, and ongoing monitoring. Your progress is saved automatically.
          </p>
        </div>
      </section>

      {/* Timeline callout */}
      <section ref={timelineRef} className="py-16 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">Key dates</p>
          <h2 className="text-display-md font-extrabold mb-10">
            The EAA <span className="heading-accent">timeline.</span>
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute top-5 left-0 right-0 h-0.5 bg-border" aria-hidden="true" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { date: "April 2019", label: "Directive adopted", body: "European Accessibility Act (Directive 2019/882) enters force.", done: true },
                { date: "June 2022", label: "Transposition deadline", body: "Member states required to transpose EAA into national law.", done: true },
                { date: "June 2025", label: "Enforcement begins", body: "EAA requirements apply to all new products and services on the EU market.", done: false, critical: true },
                { date: "June 2030", label: "Full market coverage", body: "Grace period for pre-2025 products expires. All products must comply.", done: false },
              ].map((milestone) => (
                <div key={milestone.date} className="reveal-child relative flex flex-col items-start md:items-center md:text-center">
                  <div className={[
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center mb-4 relative z-10",
                    milestone.done
                      ? "bg-muted border-border"
                      : milestone.critical
                      ? "bg-primary border-primary"
                      : "bg-background border-border",
                  ].join(" ")}>
                    {milestone.done ? (
                      <Check className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <CalendarClock className={`w-4 h-4 ${milestone.critical ? "text-white" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground mb-1">{milestone.date}</p>
                  <p className={`font-bold text-sm font-sans mb-2 ${milestone.critical ? "text-primary" : ""}`}>{milestone.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{milestone.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          {/* Sticky progress */}
          <div className="bg-background border rounded-2xl p-6 mb-10 sticky top-16 z-10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-extrabold text-sm font-sans">Overall progress</h2>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "var(--app-font-mono)" }}>
                  {completedCount} of {totalCount} items checked
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono">Critical</p>
                  <p className="text-sm font-bold font-mono text-primary">{criticalDone}/{criticalItems.length}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-lg border hover:bg-muted transition-colors"
                    title="Print / Save as PDF"
                    aria-label="Print checklist"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={reset}
                    className="px-3 py-1.5 rounded-lg border text-xs font-semibold font-sans hover:bg-muted transition-colors text-muted-foreground"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
            <Progress value={overallProgress} className="h-2.5" />
            <p className="text-right text-xs font-mono text-muted-foreground mt-2">{overallProgress}%</p>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const sectionDone = section.items.filter((i) => checked[i.id]).length;
              const sectionProgress = Math.round((sectionDone / section.items.length) * 100);

              return (
                <div key={section.id}>
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <h3 className="font-extrabold text-base font-sans">{section.title}</h3>
                        <span className="font-mono text-xs text-muted-foreground shrink-0">{sectionDone}/{section.items.length}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{section.description}</p>
                      <Progress value={sectionProgress} className="h-1 mt-3" />
                    </div>
                  </div>

                  <div className="space-y-2.5 ml-14">
                    {section.items.map((item) => {
                      const isChecked = checked[item.id] || false;
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggle(item.id)}
                          className={[
                            "w-full flex items-start gap-4 p-4 border rounded-xl text-left transition-all cursor-pointer",
                            isChecked
                              ? "border-primary/30 bg-primary/5"
                              : "border-border bg-background hover:border-primary/30 hover:bg-muted/30",
                          ].join(" ")}
                          aria-pressed={isChecked}
                        >
                          <div className={[
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                            isChecked ? "bg-primary border-primary" : "border-border",
                          ].join(" ")} aria-hidden="true">
                            {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start gap-2 flex-wrap">
                              <p className={[
                                "text-sm leading-relaxed",
                                isChecked ? "line-through text-muted-foreground" : "",
                              ].join(" ")} style={{ fontFamily: "var(--app-font-mono)" }}>
                                {item.text}
                              </p>
                              {item.critical && !isChecked && (
                                <span className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold font-sans mt-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Critical
                                </span>
                              )}
                            </div>
                            {item.note && (
                              <p className="text-xs text-muted-foreground/70 mt-1.5 leading-relaxed italic">{item.note}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Get help CTA */}
          <div className="mt-14 p-8 rounded-2xl border border-border bg-muted/30 text-center">
            <h3 className="font-extrabold text-base font-sans mb-2">Need help completing these checks?</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
              Our team can conduct a full EAA-scoped audit, produce your conformance statement, and build you a remediation roadmap.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild className="btn-gsap font-semibold">
                <Link href="/contact">Book a scoping call</Link>
              </Button>
              <Button asChild variant="outline" className="btn-gsap [box-shadow:none]">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
