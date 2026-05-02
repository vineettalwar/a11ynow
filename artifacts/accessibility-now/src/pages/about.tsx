import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            We are engineers<br />
            <span className="heading-accent">solving engineering problems.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Most accessibility agencies are run by compliance officers who hand you a 200-page PDF
            and wish you luck. We are run by senior software engineers who hand you pull requests.
          </p>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-base max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>
            <h2 className="text-display-md font-extrabold font-sans not-prose mb-6">
              The <span className="heading-accent">agency philosophy.</span>
            </h2>
            <p>
              Accessibility is fundamentally a technical challenge. It requires an understanding of the
              DOM, state management, semantic HTML, and how assistive technologies parse code. When
              non-technical auditors generate reports, the resulting tasks are often vague, unactionable,
              or architecturally unsound.
            </p>
            <p>
              At accessibility.now, we believe the bridge between compliance law and functional software
              is precise, competent code. We don't just find the problems — we architect the solutions
              alongside your team.
            </p>

            <h2 className="text-display-md font-extrabold font-sans not-prose mt-16 mb-6">
              Powered by <span className="heading-accent">sometech.work.</span>
            </h2>
            <p>
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

      <section className="py-24 px-4 hero-gradient text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Join us in building<br />
            <span className="heading-accent">a better web.</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            Whether you need an audit or hands-on remediation, we're ready to help.
          </p>
          <Button asChild className="h-12 px-8 text-sm font-bold">
            <Link href="/contact">Book a scope call</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
