"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";

const FAILURES = [
  {
    rank: "01",
    title: "Missing or inadequate alt text on product images",
    severity: "Critical",
    wcag: "1.1.1 Non-text Content (Level A)",
    description:
      "Product images without alt text are completely invisible to screen reader users. They either hear nothing or a meaningless filename like 'IMG_3847.jpg'. In e-commerce, the product image is often the primary way a user understands what they are about to buy.",
    what:
      "Every product image must have descriptive alt text: not just 'Red trainers' but enough context to make a purchase decision without seeing the image. Decorative images (backgrounds, dividers) should have empty alt attributes (alt=\"\") so screen readers skip them.",
    common:
      "Auto-generated alt text from filenames. Alt text that just repeats the product title without describing the product visually. Missing alt on sale badges and promotional images.",
  },
  {
    rank: "02",
    title: "Inaccessible product carousels and sliders",
    severity: "Critical",
    wcag: "2.1.1 Keyboard (Level A) + 4.1.2 Name, Role, Value (Level A)",
    description:
      "Carousels are among the most failure-prone components in e-commerce. Most third-party carousel libraries prioritise visual effects over accessibility. The result: keyboard users cannot navigate between slides, screen readers announce no meaningful information, and auto-advancing carousels prevent users from reading content before it disappears.",
    what:
      "Carousels must be fully keyboard-navigable with arrow keys. Each slide must have an accessible label. Auto-advance must pause when the carousel or any of its content receives focus or keyboard interaction. Provide prev/next buttons with clear labels ('Next slide', 'Previous slide'). Include a live region announcement when slides change.",
    common:
      "Touch-only swipe interfaces. Prev/next buttons with no accessible names. Auto-advancing carousels with no pause control. Slides announced as 'item 1', 'item 2' with no content description.",
  },
  {
    rank: "03",
    title: "Checkout form errors that cannot be understood",
    severity: "Critical",
    wcag: "3.3.1 Error Identification (Level A) + 3.3.3 Error Suggestion (Level AA)",
    description:
      "The checkout form is where inaccessibility has the most direct commercial impact. An inaccessible form is an abandoned basket. Common failures include: error messages shown only in red (invisible to colour-blind users), error messages not associated with the relevant input (screen reader users cannot connect the error to the field), and unhelpful messages like 'Invalid input'.",
    what:
      "Use aria-describedby to associate each error message element with its input. Use role=\"alert\" or aria-live=\"polite\" to announce errors to screen readers when they appear. Provide specific, actionable error messages: 'Enter a valid email address (e.g. name@example.com)', not 'Email is invalid'. Never use colour alone to indicate an error state.",
    common:
      "Red borders only to indicate error (no text message). Error messages injected into the DOM after submission without aria-live. Generic error messages. Error messages placed after the submit button rather than adjacent to the input.",
  },
  {
    rank: "04",
    title: "Insufficient colour contrast on prices, CTAs, and sale labels",
    severity: "High",
    wcag: "1.4.3 Contrast Minimum (Level AA)",
    description:
      "E-commerce design often prioritises brand aesthetics over readability. The most common offenders are: sale prices displayed in red on white (which frequently fails contrast), 'Add to cart' buttons in brand colours that don't meet the 4.5:1 ratio, and ghost/outlined buttons with text at insufficient contrast on cream or off-white backgrounds.",
    what:
      "Text and images of text must have a contrast ratio of at least 4.5:1 against their background. Large text (18pt+ or 14pt bold) requires 3:1. This includes placeholder text in form inputs, which is routinely overlooked. Use our Contrast Checker tool to verify before shipping.",
    common:
      "Light grey placeholder text on white inputs. 'Sale' badges in brand red at insufficient contrast. Outlined CTA buttons with thin strokes that fail 3:1 non-text contrast. Hover states that temporarily reduce contrast.",
  },
  {
    rank: "05",
    title: "Keyboard traps in modals (size guides, quick view, cookie banners)",
    severity: "Critical",
    wcag: "2.1.2 No Keyboard Trap (Level A)",
    description:
      "Modals that trap keyboard users indefinitely, or that don't manage focus correctly, are one of the most frustrating accessibility failures. In e-commerce, this commonly affects quick-view product overlays, size guides, cookie consent dialogs, and promotional pop-ups. A user who cannot close a modal cannot complete a purchase.",
    what:
      "When a modal opens: move focus to the modal container or its first interactive element. Trap focus within the modal while it is open (Tab and Shift+Tab should cycle only within modal content). Close the modal on Escape and return focus to the triggering element. Use role=\"dialog\" and aria-modal=\"true\" to inform screen readers.",
    common:
      "Modal opens but focus remains on the background page. Escape does not close the modal. Focus is not returned to the trigger element on close. No aria-modal attribute, causing screen readers to continue reading background content.",
  },
  {
    rank: "06",
    title: "Product filtering and sorting without announcements",
    severity: "High",
    wcag: "4.1.3 Status Messages (Level AA)",
    description:
      "When a user applies a filter ('Size: Medium', 'Colour: Blue') or sorts a product list, the page typically updates without focus moving. A sighted user sees the result count change and the product grid update. A screen reader user hears nothing. They have no way of knowing whether their action did anything.",
    what:
      "Use an aria-live=\"polite\" region to announce the result of filtering or sorting operations: 'Showing 24 products for Size: Medium'. The announcement must be in the DOM and change when the filter is applied. Don't move focus to the announcement - just make it audible in place.",
    common:
      "Filter applied with no screen reader announcement. Result count updated visually but not in a live region. Loading spinners not announced. 'No results' states not announced.",
  },
  {
    rank: "07",
    title: "Session timeouts that lose basket contents without warning",
    severity: "High",
    wcag: "2.2.1 Timing Adjustable (Level A)",
    description:
      "Many e-commerce platforms expire sessions after a period of inactivity. For users who type slowly, need breaks, or use switch controls or eye-gaze devices, even a 30-minute timeout can mean losing a fully assembled basket. The failure is compounded when the session expires without warning.",
    what:
      "Where a timed session is required, warn users at least 20 seconds before expiry that the session will expire and offer a way to extend it. Persist basket contents beyond the session where possible. If you cannot adjust the timeout, clearly explain the timeout duration before a user begins the process.",
    common:
      "Silent session expiry. No warning before timeout. Basket contents lost on expiry. No mechanism to extend the session.",
  },
  {
    rank: "08",
    title: "Missing skip links and poor focus order",
    severity: "High",
    wcag: "2.4.1 Bypass Blocks (Level A) + 2.4.3 Focus Order (Level A)",
    description:
      "On a product listing page, a keyboard user must Tab through the entire navigation, category filters, and promotional banners before reaching the first product. Without a skip link, this can mean pressing Tab 40+ times to reach the main content. On large product listing pages with complex filter panels, the Tab order frequently doesn't match the visual layout.",
    what:
      "Add a 'Skip to main content' link as the first focusable element on every page. It can be visually hidden until focused. Ensure that Tab order matches the visual reading order. Never use positive tabindex values to reorder focus artificially.",
    common:
      "No skip link. Tab order jumps back to top after interacting with a filter. Modals inserted at the end of the DOM but visually appearing mid-page. Sticky headers that duplicate navigation links, doubling the Tab count.",
  },
];

export default function BlogWcagEcommerce() {
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
      <section ref={heroRef} className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link href="/resources/blog" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-8 font-sans">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to blog
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-sans uppercase tracking-wider">
              E-commerce
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="w-3.5 h-3.5" /> 9 min read
            </span>
            <span className="text-xs text-muted-foreground font-mono">February 2025</span>
          </div>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            The 8 most common WCAG<br />
            <span className="heading-accent">failures in e-commerce.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Based on hundreds of audits across European e-commerce platforms, these are the violations we
            encounter most reliably -- and the ones most likely to trigger EAA enforcement action.
          </p>
          <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border/40">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold font-sans text-primary shrink-0" aria-hidden="true">
              SP
            </div>
            <div>
              <p className="text-sm font-bold font-sans leading-tight">Sarai Patel</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>Senior Frontend Engineer · 10 min read</p>
            </div>
          </div>
        </div>
      </section>

      <section ref={bodyRef} className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-sm max-w-none mb-12" style={{ fontFamily: "var(--app-font-mono)" }}>
            <p>
              E-commerce is consistently one of the most accessibility-challenged digital categories. This
              is partly structural: the commercial pressure to prioritise conversion metrics over compliance
              creates a culture where accessibility is deferred. It is also partly technical: e-commerce
              platforms integrate a large number of third-party components (carousels, chat widgets, payment
              forms, size guides) that are independently inaccessible.
            </p>
            <p>
              The EAA explicitly covers e-commerce services. Enforcement authorities have already indicated
              that consumer-facing online shops will be a priority category for inspections from June 2025.
              The following failures are, in our experience, the most prevalent -- and the most likely to
              attract complaints and enforcement action.
            </p>
          </div>

          <div className="space-y-8">
            {FAILURES.map((failure) => (
              <div
                key={failure.rank}
                className="rounded-2xl border p-7 bg-background hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-5">
                  <span className="font-mono text-3xl font-extrabold text-muted-foreground/30 leading-none shrink-0 mt-1">{failure.rank}</span>
                  <div className="flex-1">
                    <div className="flex items-start gap-3 flex-wrap mb-3">
                      <h3 className="font-extrabold text-base font-sans leading-snug">{failure.title}</h3>
                      <span className={[
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-sans shrink-0",
                        failure.severity === "Critical"
                          ? "bg-red-50 text-red-600"
                          : "bg-orange-50 text-orange-600",
                      ].join(" ")}>
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {failure.severity}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-primary mb-4">{failure.wcag}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{failure.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-xl p-4">
                        <p className="text-xs font-bold font-sans uppercase tracking-wider text-foreground mb-2">The fix</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{failure.what}</p>
                      </div>
                      <div className="bg-red-50/50 rounded-xl p-4">
                        <p className="text-xs font-bold font-sans uppercase tracking-wider text-red-700 mb-2">Common mistakes</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{failure.common}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="prose prose-sm max-w-none mt-12" style={{ fontFamily: "var(--app-font-mono)" }}>
            <h2 className="text-xl font-extrabold font-sans not-prose mb-4">What to do next</h2>
            <p>
              None of these failures require a complete platform rebuild to fix. Most can be addressed
              progressively: the most critical violations (keyboard traps, missing alt text, inaccessible
              form errors) are typically fixable within a single sprint. Contrast failures and carousel
              issues often require design and engineering collaboration but are not architecturally complex.
            </p>
            <p>
              The most effective approach is to run an automated scan first (to surface the low-hanging
              fruit quickly), then commission a manual audit focused specifically on your purchase funnel
              (product page &#8594; add to cart &#8594; checkout &#8594; confirmation). These five to ten
              pages represent the highest-risk surface area for both users and enforcement.
            </p>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Audit your<br />
            <span className="heading-accent">checkout funnel.</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Start with a free automated scan of your product pages, then book a manual audit scoped to your purchase funnel.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="btn-gsap h-12 px-8 text-sm font-semibold">
              <Link href="/">Run free scan &#8594;</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-12 px-8 text-sm [box-shadow:none]">
              <Link href="/contact">Book a manual audit</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
