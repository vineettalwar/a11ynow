export default function AccessibilityStatement() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-display font-extrabold tracking-tight mb-4">
            Accessibility<br />
            <span className="heading-accent">Statement.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-mono">Last updated: October 2023</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>
            <h2 className="text-xl font-extrabold font-sans not-prose mb-4">
              Commitment to <span className="heading-accent">accessibility.</span>
            </h2>
            <p>
              accessibility.now is committed to ensuring digital accessibility for people with disabilities. We are
              continually improving the user experience for everyone and applying relevant accessibility standards.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mt-12 mb-4">
              Conformance status.
            </h2>
            <p>
              The Web Content Accessibility Guidelines (WCAG) define requirements for designers and developers to
              improve accessibility for people with disabilities. WCAG defines three levels of conformance: Level A,
              Level AA, and Level AAA.
            </p>
            <p>
              The accessibility.now website targets full conformance with WCAG 2.1 Level AA. Where exceptions exist,
              they are documented here and scheduled for remediation.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mt-12 mb-4">
              Technical specifications.
            </h2>
            <p>
              Accessibility of this site relies on the following technologies in combination with your browser and any
              assistive technologies installed:
            </p>
            <ul>
              <li>HTML5 with semantic landmark regions</li>
              <li>WAI-ARIA roles, states, and properties</li>
              <li>CSS with no colour-only information conveyed</li>
              <li>JavaScript with progressive enhancement</li>
            </ul>

            <h2 className="text-xl font-extrabold font-sans not-prose mt-12 mb-4">
              Feedback.
            </h2>
            <p>
              We welcome your feedback on the accessibility of this site. If you encounter any barriers, please
              contact us:
            </p>
            <ul>
              <li>Email: <a href="mailto:hello@accessibility.now" className="text-primary hover:underline">hello@accessibility.now</a></li>
            </ul>
            <p>We aim to respond within 2 business days.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
