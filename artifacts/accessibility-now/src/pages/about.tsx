import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useSectionReveal } from "@/hooks/use-section-reveal";

export default function About() {
  const heroRef = useSectionReveal<HTMLElement>();
  const philosophyRef = useSectionReveal<HTMLElement>();
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
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            We are engineers<br />
            <span className="heading-accent">solving engineering problems.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Most accessibility agencies are run by compliance officers who hand you a 200-page PDF
            and wish you luck. We are run by senior software engineers who hand you pull requests.
          </p>
        </div>
      </section>

      <section ref={philosophyRef} className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-base max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>
            <h2 className="text-display-md font-extrabold font-sans not-prose mb-6">
              The <span className="heading-accent">agency philosophy.</span>
            </h2>
            <p className="reveal-body">
              Accessibility is fundamentally a technical challenge. It requires an understanding of the
              DOM, state management, semantic HTML, and how assistive technologies parse code. When
              non-technical auditors generate reports, the resulting tasks are often vague, unactionable,
              or architecturally unsound.
            </p>
            <p className="reveal-body">
              At accessibility.now, we believe the bridge between compliance law and functional software
              is precise, competent code. We don't just find the problems — we architect the solutions
              alongside your team.
            </p>

            <h2 className="text-display-md font-extrabold font-sans not-prose mt-16 mb-6">
              Powered by <span className="heading-accent">sometech.work.</span>
            </h2>
            <p className="reveal-body">
              accessibility.now is a specialized digital accessibility agency operating under the{" "}
              <a href="https://sometech.work" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                sometech.work
              </a>{" "}
              brand umbrella. We leverage the broader network's deep expertise in enterprise React and
              Node.js architecture to deliver robust remediation services.
            </p>
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Join us in building<br />
            <span className="heading-accent">a better web.</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Whether you need an audit or hands-on remediation, we're ready to help.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact">Book a scope call</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
