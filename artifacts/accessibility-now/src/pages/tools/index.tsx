import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Mic, Keyboard, Palette, Glasses, Smartphone, ClipboardList, ArrowRight, TabletSmartphone } from "lucide-react";

const tools = [
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
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            How everyone<br />
            <span className="heading-accent">sees your website.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Eight interactive tools for developers and designers. All run in-browser - no account needed, no data sent.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map(({ href, icon: Icon, title, description }) => (
              <Link
                key={href}
                href={href}
                className="block group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="border border-border/80 shadow-none group-hover:shadow-md group-hover:border-primary/20 transition-[box-shadow,border-color] duration-200 h-full rounded-xl">
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 ring-1 ring-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/[0.14] transition-colors">
                      <Icon className="w-5 h-5 text-primary" aria-hidden />
                    </div>
                    <h2 className="text-lg font-bold font-sans tracking-tight mb-2">{title}</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">{description}</p>
                    <span className="text-primary text-sm font-semibold font-sans flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Open tool <ArrowRight className="w-4 h-4 shrink-0" aria-hidden />
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
