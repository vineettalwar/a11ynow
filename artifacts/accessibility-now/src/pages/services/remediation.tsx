import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

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
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            We don't just report.<br />
            <span className="heading-accent">We fix.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Our engineers work alongside your team to implement robust accessibility solutions — PRs,
            annotated code, and sprint-based delivery against your actual backlog.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-10">
            How we <span className="heading-accent">work.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {howWeWork.map(({ title, body }) => (
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
            Need engineering support<br />
            <span className="heading-accent">for compliance?</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            Tell us about your stack and we'll scope a remediation engagement that fits your release cadence.
          </p>
          <Button asChild className="h-12 px-8 text-sm font-bold">
            <Link href="/contact">Discuss your roadmap</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
