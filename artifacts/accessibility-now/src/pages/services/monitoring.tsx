import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "Monthly re-scans",
    body: "Automated sweeps across your critical user journeys to catch regressions and new violations.",
  },
  {
    title: "Regression alerts",
    body: "Immediate notification when new deployments break existing accessibility features.",
  },
  {
    title: "Compliance dashboard",
    body: "Real-time tracking of your accessibility posture — perfect for stakeholder and legal reporting.",
  },
  {
    title: "On-demand consultation",
    body: "Direct access to our senior accessibility engineers for architecture reviews and technical advice.",
  },
];

export default function Monitoring() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Stay compliant<br />
            <span className="heading-accent">as you ship.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Accessibility is a continuous process. We ensure your application remains compliant
            with every new feature — automated re-scans, regression alerts, and a compliance dashboard.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            Retainer <span className="heading-accent">benefits.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map(({ title, body }) => (
              <div key={title} className="flex items-start gap-4 p-5 rounded-xl border bg-background">
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

      <section className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Protect your<br />
            <span className="heading-accent">compliance investment.</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            One regression can undo months of work. A monitoring retainer keeps you continuously covered.
          </p>
          <Button asChild className="h-12 px-8 text-sm font-bold">
            <Link href="/contact">Start a retainer</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
