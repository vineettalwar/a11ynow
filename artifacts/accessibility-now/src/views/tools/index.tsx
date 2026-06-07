"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Mic, Keyboard, Palette, Glasses, Smartphone, ClipboardList, ArrowRight, TabletSmartphone, Radar, Image, Heading, Link2 } from "lucide-react";

const tools = [
  {
    href: "/tools/website-scanner",
    icon: Radar,
    title: "Website accessibility scanner",
    description: "WCAG-tagged axe scan in headless Chromium with optional strict BFSG profile.",
  },
  {
    href: "/tools/contrast-checker",
    icon: Palette,
    title: "Colour Contrast Checker",
    description: "Real-time WCAG contrast ratios with AA/AAA pass/fail and fix suggestions.",
  },
  {
    href: "/tools/colour-blindness",
    icon: Eye,
    title: "Colour Blindness Simulator",
    description: "Preview your site under four common colour vision deficiencies.",
  },
  {
    href: "/tools/screen-reader-preview",
    icon: Mic,
    title: "Screen Reader Preview",
    description: "See the reading order NVDA, JAWS, and VoiceOver would announce.",
  },
  {
    href: "/tools/keyboard-tester",
    icon: Keyboard,
    title: "Keyboard Navigation Tester",
    description: "Step through tab order, skip links, and focus visibility on any URL.",
  },
  {
    href: "/tools/low-vision",
    icon: Glasses,
    title: "Low Vision Simulator",
    description: "Simulate low vision, tunnel vision, and central field loss.",
  },
  {
    href: "/tools/mobile-checklist",
    icon: Smartphone,
    title: "Mobile Accessibility Checklist",
    description: "iOS and Android checklist for touch targets, labels, and gestures.",
  },
  {
    href: "/tools/wcag-checklist",
    icon: ClipboardList,
    title: "WCAG 2.1 AA Checklist",
    description: "Work through all 50 WCAG 2.1 AA criteria with saved progress.",
  },
  {
    href: "/tools/focus-order",
    icon: TabletSmartphone,
    title: "Focus Order Visualizer",
    description: "Overlay numbered Tab-order markers on a live page screenshot.",
  },
  {
    href: "/tools/alt-text-checker",
    icon: Image,
    title: "Alt Text Checker",
    description: "Find images missing alt text, including lazy-loaded SPA content.",
  },
  {
    href: "/tools/heading-structure",
    icon: Heading,
    title: "Heading Structure Checker",
    description: "List H1–H6 in document order and flag empty headings.",
  },
  {
    href: "/tools/link-text-checker",
    icon: Link2,
    title: "Link Text Checker",
    description: "Find links with no accessible name or generic text like 'click here'.",
  },
];

export default function ToolsIndex() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-5 font-sans">
            In-browser suite · No sign-up
          </p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            How everyone<br />
            <span className="heading-accent">sees your website.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl leading-relaxed">
            Twelve browser tools for WCAG checks. Server-backed scans use headless Chromium.
          </p>
        </div>
      </section>

      <section className="tools-catalog-section py-24 px-4 border-t border-border/40">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 md:mb-14">
            <div>
              <h2 className="text-display-md font-extrabold tracking-tight text-foreground font-sans">
                The toolkit
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mt-2" style={{ fontFamily: "var(--app-font-mono)" }}>
                Free browser tools for WCAG checks.
              </p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0 font-sans tabular-nums tracking-wide">
              12 tools
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 md:gap-8">
            {tools.map(({ href, icon: Icon, title, description }) => (
              <Link
                key={href}
                href={href}
                className="block group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="tool-index-card h-full rounded-2xl border shadow-none">
                  <CardContent className="p-8 md:p-9 flex flex-col h-full">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6" aria-hidden>
                      <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="text-lg md:text-[1.0625rem] font-bold font-sans tracking-tight mb-3 leading-snug">
                      {title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-8" style={{ fontFamily: "var(--app-font-mono)" }}>
                      {description}
                    </p>
                    <div className="pt-5 mt-auto border-t border-border/50 flex items-center justify-between gap-3">
                      <span className="text-primary text-sm font-semibold font-sans flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-300">
                        Launch
                        <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" aria-hidden />
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 font-sans hidden sm:inline">
                        Free
                      </span>
                    </div>
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
