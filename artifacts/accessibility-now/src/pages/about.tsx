import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="mb-16">
        <h1 className="text-5xl font-bold mb-6">About Us</h1>
        <p className="text-xl text-muted-foreground">
          We are engineers solving engineering problems.
        </p>
      </div>

      <div className="prose prose-lg max-w-none prose-headings:font-bold">
        <p className="text-2xl leading-relaxed font-medium mb-12">
          Most accessibility agencies are run by compliance officers who hand you a 200-page PDF and wish you luck. We are run by senior software engineers who hand you pull requests.
        </p>

        <h2>The Agency Philosophy</h2>
        <p>
          Accessibility is fundamentally a technical challenge. It requires an understanding of the DOM, state management, semantic HTML, and how assistive technologies parse code. When non-technical auditors generate reports, the resulting tasks are often vague, unactionable, or architecturally unsound.
        </p>
        <p>
          At accessibility.now, we believe the bridge between compliance law and functional software is precise, competent code. We don't just find the problems; we architect the solutions alongside your team.
        </p>

        <h2>Powered by sometech.work</h2>
        <p>
          accessibility.now is a specialized digital accessibility agency operating under the <a href="https://sometech.work" target="_blank" rel="noreferrer">sometech.work</a> brand umbrella. We leverage the broader network's deep expertise in enterprise React and Node.js architecture to deliver robust remediation services.
        </p>
      </div>

      <div className="mt-16 pt-16 border-t border-gray-200">
        <h2 className="text-3xl font-bold mb-6">Join us in building a better web.</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Whether you need an audit or hands-on remediation, we're ready to help.
        </p>
        <Button asChild className="h-14 rounded-full px-10 text-lg font-bold">
          <Link href="/contact">Book a scope call</Link>
        </Button>
      </div>
    </div>
  );
}
