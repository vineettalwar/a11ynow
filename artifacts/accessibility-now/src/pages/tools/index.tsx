import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Mic, Keyboard, Palette, Glasses, Smartphone, ClipboardList, ArrowRight, TabletSmartphone, Radar } from "lucide-react";

const tools = [
  {
    href: "/tools/website-scanner",
    icon: Radar,
    title: "Website accessibility scanner",
    description:
      "Full WCAG-tagged axe run in headless Chromium: optional strict profile, mobile + desktop merge, console and network hints, then jump into our other tools on the same URL.",
  },
  {
    href: "/tools/contrast-checker",
    icon: Palette,
    title: "Colour Contrast Checker",
    description: "Real-time WCAG contrast ratio. AA/AAA pass/fail for text, large text, and UI components - with a one-click fix suggestion.",
  },
  {
    href: "/tools/colour-blindness",
    icon: Eye,
    title: "Colour Blindness Simulator",
    description: "See any website through four types of colour vision deficiency: Deuteranopia, Protanopia, Tritanopia, and Achromatopsia.",
  },
  {
    href: "/tools/screen-reader-preview",
    icon: Mic,
    title: "Screen Reader Preview",
    description: "See the exact reading order NVDA, JAWS, and VoiceOver announce - landmarks, headings, links, buttons, and image alt text.",
  },
  {
    href: "/tools/keyboard-tester",
    icon: Keyboard,
    title: "Keyboard Navigation Tester",
    description: "Step-by-step keyboard testing guide with a persistent checklist. Verify tab order, skip links, and focus visibility.",
  },
  {
    href: "/tools/low-vision",
    icon: Glasses,
    title: "Low Vision Simulator",
    description: "Simulate moderate and severe low vision, tunnel vision, and macular degeneration (central field loss) on any URL.",
  },
  {
    href: "/tools/mobile-checklist",
    icon: Smartphone,
    title: "Mobile Accessibility Checklist",
    description: "iOS and Android checklist covering touch targets, VoiceOver/TalkBack labels, dynamic type, and gesture alternatives.",
  },
  {
    href: "/tools/wcag-checklist",
    icon: ClipboardList,
    title: "WCAG 2.1 AA Checklist",
    description: "Work through all 50 WCAG 2.1 AA success criteria manually. Mark each Pass, Fail, or N/A - progress saved in your browser.",
  },
  {
    href: "/tools/focus-order",
    icon: TabletSmartphone,
    title: "Focus Order Visualizer",
    description: "Capture a screenshot of any page and overlay numbered markers showing the keyboard Tab order - colour-coded by element type with issue detection.",
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
            Nine interactive tools for developers and designers. All run in-browser - no account needed, no data sent.
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
                Same craft as our audits, packaged so you can ship with confidence between engagements.
              </p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0 font-sans tabular-nums tracking-wide">
              9 tools
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 md:gap-8">
            {tools.map(({ href, icon: Icon, title, description }, i) => (
              <Link
                key={href}
                href={href}
                className="block group rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="tool-index-card h-full rounded-2xl border shadow-none">
                  <CardContent className="relative z-1 p-8 md:p-9 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] bg-linear-to-br from-primary/14 via-primary/8 to-amber-400/12 ring-1 ring-primary/15 group-hover:from-primary/18 group-hover:ring-primary/25 transition-all duration-300"
                        aria-hidden
                      >
                        <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
                      </div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80 font-sans tabular-nums pt-1"
                        aria-hidden
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
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
