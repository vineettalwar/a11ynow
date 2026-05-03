import { Link } from "wouter";
import { useSectionReveal } from "@/hooks/use-section-reveal";
import { Check, AlertTriangle } from "lucide-react";

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div className="mt-12 first:mt-0">
      <h2 className="text-xl font-extrabold font-sans not-prose mb-4">
        {title}{accent && <> <span className="heading-accent">{accent}</span></>}
      </h2>
      {children}
    </div>
  );
}

const KNOWN_ISSUES = [
  {
    component: "Focus Order Visualizer — screenshot overlay",
    criterion: "1.4.11 Non-text Contrast (AA)",
    status: "Partial",
    note: "SVG marker overlays on the screenshot may have insufficient contrast against some page backgrounds. A fix is in progress.",
  },
  {
    component: "Batch scan results table",
    criterion: "1.4.10 Reflow (AA)",
    status: "Partial",
    note: "The results table scrolls horizontally on narrow viewports. A responsive layout refactor is planned.",
  },
  {
    component: "Third-party PDF download",
    criterion: "1.1.1 Non-text Content (A)",
    status: "Partial",
    note: "Generated PDF reports do not yet include tagged PDF structure required for full screen reader accessibility.",
  },
];

export default function AccessibilityStatement() {
  const heroRef = useSectionReveal<HTMLElement>();
  const bodyRef = useSectionReveal<HTMLElement>();

  return (
    <div className="flex flex-col w-full">
      <section ref={heroRef} className="hero-gradient pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-4">Legal</p>
          <h1 className="text-display font-extrabold tracking-tight mb-4">
            Accessibility<br />
            <span className="heading-accent">Statement.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-mono">Last reviewed: 1 May 2025</p>
        </div>
      </section>

      <section ref={bodyRef} className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>

            <Section title="Our" accent="commitment.">
              <p>
                accessibility.now (operated by sometech.work) is committed to making this website accessible
                to all users, including those using assistive technologies. We practise what we preach:
                accessibility is a core engineering requirement at every stage of our development process,
                not a post-launch retrofit.
              </p>
              <p>
                This statement covers the website accessible at{" "}
                <strong>accessibility.now</strong> and its associated tools and resource pages.
              </p>
            </Section>

            <Section title="Conformance" accent="status.">
              <p>
                The Web Content Accessibility Guidelines (WCAG) define requirements for making digital
                content accessible to people with disabilities. WCAG 2.1 Level AA is the target for EAA
                compliance and EN 301 549 conformance.
              </p>

              <div className="not-prose flex items-start gap-4 p-5 rounded-xl border border-green-200 bg-green-50 my-6">
                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm font-sans text-green-800 mb-1">Target conformance level</p>
                  <p className="text-xs text-green-700">
                    WCAG 2.1 Level AA — substantially conforms, with the exceptions listed below. We are
                    actively working towards full conformance. This statement will be updated when known issues
                    are resolved.
                  </p>
                </div>
              </div>

              <p>
                "Substantially conforms" means that most content meets the standard, but some pages or
                components have known exceptions that are currently being addressed. See the known issues
                section below for detail.
              </p>
            </Section>

            <Section title="Technical" accent="specifications.">
              <p>This website is built using the following technologies, all of which are relied upon for accessibility:</p>
              <ul>
                <li><strong>HTML5</strong> with semantic landmark regions (<code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code>, <code>aside</code>)</li>
                <li><strong>WAI-ARIA</strong> roles, states, and properties for dynamic content and custom interactive components</li>
                <li><strong>CSS</strong> for visual styling — no information is conveyed by colour alone</li>
                <li><strong>JavaScript / React</strong> with progressive-enhancement principles where possible</li>
              </ul>
              <p>
                The website has been tested with the following user agents and assistive technology combinations:
              </p>
              <ul>
                <li>NVDA 2024.1 with Firefox 125 (Windows)</li>
                <li>JAWS 2024 with Chrome 124 (Windows)</li>
                <li>VoiceOver 17.x with Safari 17.x (macOS)</li>
                <li>VoiceOver with iOS 17 / Safari (mobile)</li>
                <li>TalkBack with Chrome (Android)</li>
                <li>Keyboard-only navigation (Windows and macOS)</li>
                <li>Windows High Contrast mode</li>
              </ul>
            </Section>

            <Section title="Known" accent="issues.">
              <p>
                The following known accessibility issues exist on the website as of the date of this statement.
                Each is assigned a resolution target.
              </p>

              <div className="not-prose overflow-x-auto rounded-xl border my-6">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-4 py-3 font-bold font-sans uppercase tracking-wider text-muted-foreground">Component</th>
                      <th className="text-left px-4 py-3 font-bold font-sans uppercase tracking-wider text-muted-foreground hidden md:table-cell">WCAG Criterion</th>
                      <th className="text-left px-4 py-3 font-bold font-sans uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 font-bold font-sans uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KNOWN_ISSUES.map((issue, i) => (
                      <tr key={issue.component} className={`border-b last:border-b-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3 font-medium" style={{ fontFamily: "var(--app-font-mono)" }}>{issue.component}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{issue.criterion}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold font-sans">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground leading-relaxed hidden lg:table-cell max-w-xs">{issue.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Assessment" accent="approach.">
              <p>
                accessibility.now assesses accessibility through the following methods:
              </p>
              <ul>
                <li><strong>Automated testing</strong> integrated into our CI/CD pipeline (axe-core via Playwright)</li>
                <li><strong>Developer self-assessment</strong> during feature development using browser DevTools and screen readers</li>
                <li><strong>Periodic manual audits</strong> of key user journeys by accessibility specialists</li>
                <li><strong>User feedback</strong> via the feedback mechanism below</li>
              </ul>
              <p>
                We perform a full accessibility review of the platform quarterly, and after any significant
                release. This statement is updated following each review.
              </p>
            </Section>

            <Section title="Feedback and" accent="contact.">
              <p>
                We welcome feedback on the accessibility of this website. If you encounter a barrier that
                prevents you from using any part of the site, or if you believe any content does not meet
                the accessibility standard described above, please contact us:
              </p>
              <ul>
                <li>
                  Email:{" "}
                  <a href="mailto:accessibility@accessibility.now" className="text-primary hover:underline">
                    accessibility@accessibility.now
                  </a>
                </li>
                <li>
                  Contact form:{" "}
                  <Link href="/contact" className="text-primary hover:underline">accessibility.now/contact</Link>
                </li>
              </ul>
              <p>
                We aim to acknowledge all accessibility feedback within 2 business days and to provide a
                substantive response within 10 business days. Where we cannot resolve an issue immediately,
                we will provide an estimated timeline and, where possible, an alternative means of accessing
                the content.
              </p>
            </Section>

            <Section title="Enforcement" accent="procedure.">
              <p>
                If you are not satisfied with our response to an accessibility complaint, you may escalate to
                the relevant national enforcement authority responsible for EAA (and, where applicable, WCAG
                directive) compliance in your country:
              </p>
              <ul>
                <li><strong>Republic of Ireland</strong>: Commission for Communications Regulation (ComReg) / National Disability Authority (NDA)</li>
                <li><strong>United Kingdom</strong>: Equality and Human Rights Commission (EHRC)</li>
                <li><strong>Germany</strong>: Relevant Schlichtungsstelle for accessibility matters</li>
                <li><strong>France</strong>: Autorité de Regulation de la Communication Audiovisuelle et Numerique (ARCOM)</li>
              </ul>
              <p>
                For other EU member states, the relevant national competent authority designated under
                Directive 2019/882 handles EAA enforcement.
              </p>
            </Section>

          </div>
        </div>
      </section>
    </div>
  );
}
