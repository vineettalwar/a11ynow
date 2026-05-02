import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const howWeWork = [
  {
    title: "Sprint-based delivery",
    body: "We integrate into your agile workflow, delivering fixes in manageable increments aligned to your release schedule.",
  },
  {
    title: "Direct Pull Requests",
    body: "Our engineers write the code and submit PRs directly to your repositories — no ticket handoffs.",
  },
  {
    title: "Annotated code",
    body: "Complex fixes are thoroughly documented so your internal team understands the solution and can maintain it.",
  },
  {
    title: "Jira-ready tickets",
    body: "For tasks better handled internally, we provide detailed acceptance criteria and technical implementation specs.",
  },
];

export default function Remediation() {
  const heroRef = useSectionReveal<HTMLElement>();
  const howWeWorkRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
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
            We don't just report.<br />
            <span className="heading-accent">We fix.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl reveal-body">
            Our engineers work alongside your team to implement robust accessibility solutions — PRs,
            annotated code, and sprint-based delivery against your actual backlog.
          </p>
        </div>
      </section>

      <section ref={howWeWorkRef} className="py-20 px-4 warm-section">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            How we <span className="heading-accent">work.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {howWeWork.map(({ title, body }) => (
              <div key={title} className="reveal-child flex items-start gap-4 p-5 rounded-xl border bg-background">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm font-sans mb-1">{title}</h3>
                  <p className="text-muted-foreground text-xs">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={ctaRef} className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Need engineering support<br />
            <span className="heading-accent">for compliance?</span>
          </h2>
          <p className="text-muted-foreground mb-10 reveal-body">
            Tell us about your stack and we'll scope a remediation engagement that fits your release cadence.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 text-sm font-bold">
            <Link href="/contact">Discuss your roadmap</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
