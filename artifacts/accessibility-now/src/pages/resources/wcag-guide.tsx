import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const POUR = [
  {
    letter: "P",
    name: "Perceivable",
    color: "text-blue-600",
    bg: "bg-blue-50",
    description:
      "Information and UI components must be presentable to users in ways they can perceive. Nothing can be invisible to all of their senses.",
    whyItMatters:
      "Around 2.2 billion people worldwide have a vision impairment. A product that relies on sight alone excludes them entirely.",
    items: [
      {
        sc: "1.1.1",
        title: "Non-text Content",
        level: "A",
        what: "Provide text alternatives for all non-text content: images, icons, charts, audio.",
        how: "Use the alt attribute on <img>. Decorative images get alt=\"\". Complex charts need a longer description in adjacent text.",
      },
      {
        sc: "1.3.1",
        title: "Info and Relationships",
        level: "A",
        what: "Structure and relationships conveyed visually must also be programmatic.",
        how: "Use semantic HTML: <h1>-<h6> for headings, <ul>/<ol> for lists, <table> with <th> for data tables, <label> for form inputs.",
      },
      {
        sc: "1.4.1",
        title: "Use of Colour",
        level: "A",
        what: "Colour must not be the only visual means of conveying information.",
        how: "Don't mark required fields in red alone - add an asterisk and a legend. Don't show chart categories by colour alone - add labels or patterns.",
      },
      {
        sc: "1.4.3",
        title: "Contrast (Minimum)",
        level: "AA",
        what: "Text must have a contrast ratio of at least 4.5:1 against its background (3:1 for large text, 18pt+ or 14pt bold).",
        how: "Use a contrast checker (like our tool at /tools/contrast-checker). Watch out for grey-on-white placeholder text, light CTA hover states, and footer text.",
      },
      {
        sc: "1.4.4",
        title: "Resize Text",
        level: "AA",
        what: "Text must be resizable up to 200% without loss of content or functionality.",
        how: "Use relative units (em, rem) for font sizes, not px. Test by using browser zoom to 200%.",
      },
      {
        sc: "1.4.10",
        title: "Reflow",
        level: "AA",
        what: "Content must reflow to a single column at 320px-equivalent width without horizontal scrolling.",
        how: "Test at 400% browser zoom (simulates 320px viewport). Avoid fixed-width containers. Use responsive flex/grid layouts.",
      },
      {
        sc: "1.4.11",
        title: "Non-text Contrast",
        level: "AA",
        what: "UI components (form borders, focus indicators, icons) must have 3:1 contrast against adjacent colours.",
        how: "Check input field borders, checkbox outlines, icon-only buttons, and custom focus rings.",
      },
    ],
  },
  {
    letter: "O",
    name: "Operable",
    color: "text-orange-600",
    bg: "bg-orange-50",
    description:
      "UI components and navigation must be operable. The interface cannot require interaction that a user cannot perform.",
    whyItMatters:
      "8.2 million people in the EU have a motor disability affecting their use of a mouse or touchscreen. Keyboard-only users depend entirely on operability.",
    items: [
      {
        sc: "2.1.1",
        title: "Keyboard",
        level: "A",
        what: "All functionality must be operable through a keyboard interface without timing requirements.",
        how: "Tab through every interactive element. Test dropdowns, modals, sliders, carousels, and date pickers. No element should be keyboard-inaccessible.",
      },
      {
        sc: "2.1.2",
        title: "No Keyboard Trap",
        level: "A",
        what: "If focus can be moved to a component, focus must be able to be moved away using keyboard only.",
        how: "Modal dialogs must trap focus while open (correct), but must release on Escape or close button. Test every overlay and flyout panel.",
      },
      {
        sc: "2.4.1",
        title: "Bypass Blocks",
        level: "A",
        what: "Provide a way to skip repeated navigation blocks.",
        how: "Add a 'Skip to main content' link as the first focusable element. It can be visually hidden until focused.",
      },
      {
        sc: "2.4.3",
        title: "Focus Order",
        level: "A",
        what: "If a page can be navigated sequentially, the focus order must preserve meaning and operability.",
        how: "Never use positive tabindex values (tabindex=1, tabindex=2 etc). These break natural DOM order. Use tabindex=0 or rely on DOM structure.",
      },
      {
        sc: "2.4.7",
        title: "Focus Visible",
        level: "AA",
        what: "Any keyboard-operable interface must have a visible focus indicator.",
        how: "Never use outline: none or outline: 0 without a replacement. Provide a visually distinct :focus-visible style. The 2.2 upgrade (2.4.11) adds minimum size requirements.",
      },
      {
        sc: "2.4.6",
        title: "Headings and Labels",
        level: "AA",
        what: "Headings and labels must be descriptive.",
        how: "Avoid headings like 'Details' or 'Info'. Labels must describe the purpose of the field - not just the data type. Never use 'Click here' as a link label.",
      },
      {
        sc: "2.5.3",
        title: "Label in Name",
        level: "A",
        what: "For UI components with a visible label, the accessible name must contain the visible label text.",
        how: "If a button says 'Search', its aria-label (if present) must also include the word 'Search'. Screen reader users who voice-activate buttons type the visible text.",
      },
    ],
  },
  {
    letter: "U",
    name: "Understandable",
    color: "text-green-600",
    bg: "bg-green-50",
    description:
      "Information and the operation of the UI must be understandable. Users must be able to understand both the content and how to use it.",
    whyItMatters:
      "Cognitive and learning disabilities affect hundreds of millions. Clear language, predictable UI, and helpful error messages are not optional extras - they are the baseline.",
    items: [
      {
        sc: "3.1.1",
        title: "Language of Page",
        level: "A",
        what: "The default human language of each page must be programmatically determinable.",
        how: "Set the lang attribute on the <html> element: <html lang=\"en\">. Screen readers use this to choose the correct pronunciation.",
      },
      {
        sc: "3.1.2",
        title: "Language of Parts",
        level: "AA",
        what: "If a passage uses a different language, it must be identified with a lang attribute.",
        how: "For a French phrase in an English page: <span lang=\"fr\">Merci beaucoup</span>.",
      },
      {
        sc: "3.2.1",
        title: "On Focus",
        level: "A",
        what: "When any component receives focus, it must not initiate a change of context.",
        how: "Don't submit a form or trigger navigation when an input is focused. Focus should never cause surprises.",
      },
      {
        sc: "3.3.1",
        title: "Error Identification",
        level: "A",
        what: "If an input error is automatically detected, the item in error and a description must be provided in text.",
        how: "Don't rely on colour alone or an icon alone. Use aria-describedby to link the error message text to the input. Announce errors to screen readers.",
      },
      {
        sc: "3.3.2",
        title: "Labels or Instructions",
        level: "A",
        what: "Labels or instructions must be provided when content requires user input.",
        how: "Every form input needs a visible <label>. Complex inputs (e.g. date formats) need additional instructions - place them before the input, not after.",
      },
      {
        sc: "3.3.3",
        title: "Error Suggestion",
        level: "AA",
        what: "If an input error is detected and suggestions for correction are known, the suggestion must be provided.",
        how: "If a user types an invalid email, say 'Enter a valid email address (e.g. name@example.com)'. If a password fails, list the exact requirements not met.",
      },
    ],
  },
  {
    letter: "R",
    name: "Robust",
    color: "text-purple-600",
    bg: "bg-purple-50",
    description:
      "Content must be robust enough to be interpreted reliably by a wide variety of user agents, including current and future assistive technologies.",
    whyItMatters:
      "Screen readers, switch controls, voice navigation, and browser zoom all interpret your HTML differently. Robust code works across all of them.",
    items: [
      {
        sc: "4.1.1",
        title: "Parsing",
        level: "A",
        what: "In content implemented using markup, elements have complete start and end tags, are nested correctly, contain no duplicate attributes, and IDs are unique.",
        how: "Run your HTML through a validator. In React, JSX enforces correct nesting. Watch out for duplicate id attributes - they break aria-labelledby and for/id associations.",
      },
      {
        sc: "4.1.2",
        title: "Name, Role, Value",
        level: "A",
        what: "All UI components must expose their name, role, and value programmatically.",
        how: "Use native HTML elements where possible (<button>, <a>, <select>) - they expose role automatically. For custom components, use ARIA: role, aria-label, aria-expanded, aria-checked, etc.",
      },
      {
        sc: "4.1.3",
        title: "Status Messages",
        level: "AA",
        what: "Status messages (success, error, loading) must be programmatically determinable so they can be announced without receiving focus.",
        how: "Use role=\"status\" for success/info messages (polite). Use role=\"alert\" for errors (assertive, interrupts the screen reader). Don't just add a CSS class to an existing element - the message text must actually change.",
      },
    ],
  },
];

const LEVEL_COLORS: Record<string, string> = {
  A: "bg-muted text-muted-foreground",
  AA: "bg-primary/10 text-primary",
  AAA: "bg-green-100 text-green-700",
};

type PourPrinciple = (typeof POUR)[number];

function PourSection({ principle, pIdx }: { principle: PourPrinciple; pIdx: number }) {
  const sectionRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  return (
    <section
      ref={sectionRef}
      className={pIdx % 2 === 0 ? "py-20 px-4 warm-section" : "py-20 px-4 bg-white"}
    >
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-start gap-5 mb-10">
          <div className={`w-14 h-14 rounded-2xl ${principle.bg} flex items-center justify-center shrink-0`}>
            <span className={`text-2xl font-extrabold font-sans ${principle.color}`}>{principle.letter}</span>
          </div>
          <div>
            <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              POUR &mdash; {pIdx + 1} of 4
            </p>
            <h2 className="text-display-md font-extrabold">{principle.name}</h2>
            <p className="text-muted-foreground text-sm max-w-2xl mt-3 leading-relaxed reveal-body">{principle.description}</p>
            <p className="text-xs text-muted-foreground/70 mt-2 max-w-2xl reveal-body">
              <span className="font-semibold">Why it matters: </span>{principle.whyItMatters}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans uppercase tracking-wider text-muted-foreground w-16">SC</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans uppercase tracking-wider text-muted-foreground">Criterion</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans uppercase tracking-wider text-muted-foreground w-16">Level</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans uppercase tracking-wider text-muted-foreground hidden lg:table-cell">What it requires</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold font-sans uppercase tracking-wider text-muted-foreground hidden xl:table-cell">How to implement</th>
              </tr>
            </thead>
            <tbody>
              {principle.items.map((item, i) => (
                <tr
                  key={item.sc}
                  className={[
                    "reveal-child border-b last:border-b-0 transition-colors hover:bg-muted/30",
                    i % 2 === 0 ? "" : "bg-muted/10",
                  ].join(" ")}
                >
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{item.sc}</td>
                  <td className="px-5 py-4 font-semibold text-xs font-sans">{item.title}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold font-sans ${LEVEL_COLORS[item.level]}`}>
                      {item.level}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed hidden lg:table-cell max-w-xs">{item.what}</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground leading-relaxed hidden xl:table-cell max-w-xs">{item.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function WcagGuide() {
  const heroRef = useSectionReveal<HTMLElement>();
  const levelsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const pourRef = useSectionReveal<HTMLElement>();
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
        <div className="container mx-auto max-w-4xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-4">Developer reference</p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            WCAG 2.1 / 2.2<br />
            <span className="heading-accent">Developer Guide.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            A developer-centric walkthrough of the POUR principles, conformance levels, and the AA
            success criteria that matter most for EAA compliance - with practical implementation notes
            for each.
          </p>
        </div>
      </section>

      {/* Conformance levels */}
      <section ref={levelsRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">Conformance levels</p>
          <h2 className="text-display-md font-extrabold mb-3">
            Level A, AA, <span className="heading-accent">and AAA.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mb-12 reveal-body">
            WCAG organises success criteria into three levels of conformance. The EAA - and most public-sector
            legislation globally - targets Level AA. Level A is the floor; Level AAA is aspirational.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="reveal-child border p-7 rounded-2xl bg-background">
              <div className="inline-flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-extrabold font-sans">A</span>
                <h3 className="font-extrabold text-lg font-sans">Level A</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                The absolute minimum. Without Level A compliance, the product is impossible - or dangerous - for
                some users. These criteria have no reasonable exceptions.
              </p>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Meaningful page titles</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Alt text on images</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Keyboard accessibility</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>No keyboard traps</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>No content that flashes &gt;3 times/sec</li>
              </ul>
            </div>

            <div className="reveal-child border-2 border-primary/40 p-7 rounded-2xl bg-white relative shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: "var(--color-primary, #FF4D1C)" }}>
                EAA target
              </div>
              <div className="inline-flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-extrabold font-sans text-primary">AA</span>
                <h3 className="font-extrabold text-lg font-sans">Level AA</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                The legal standard. Balances strong accessibility coverage with realistic design flexibility.
                Meeting Level AA means meeting Level A first - it's cumulative.
              </p>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>4.5:1 text colour contrast</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Visible focus indicators</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Error suggestions in forms</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Content reflow at 320px</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Status message announcements</li>
              </ul>
            </div>

            <div className="reveal-child border p-7 rounded-2xl bg-background">
              <div className="inline-flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-extrabold font-sans">AAA</span>
                <h3 className="font-extrabold text-lg font-sans">Level AAA</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                The gold standard. Some Level AAA criteria are not achievable for all content types.
                WCAG explicitly states it is not recommended as a blanket target for entire sites.
              </p>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>7:1 text colour contrast</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Sign language interpretation</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>No timing constraints</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Reading level - lower secondary</li>
                <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Extended audio description</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* POUR principles + criteria */}
      {POUR.map((principle, pIdx) => (
        <PourSection key={principle.letter} principle={principle} pIdx={pIdx} />
      ))}

      {/* CTA */}
      <section className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Ready to check<br />
            <span className="heading-accent">your site?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Run a free automated WCAG 2.1 scan in seconds - or book a full manual audit for complete AA coverage.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free scan &#8594;</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/services/audits">Manual audit</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
