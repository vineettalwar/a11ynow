"use client";

import { useSectionReveal } from "@/hooks/use-section-reveal";

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

export default function PrivacyPolicy() {
  const heroRef = useSectionReveal<HTMLElement>();
  const bodyRef = useSectionReveal<HTMLElement>();

  return (
    <div className="flex flex-col w-full">
      <section ref={heroRef} className="hero-gradient pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-4">Legal</p>
          <h1 className="text-display font-extrabold tracking-tight mb-4">
            Privacy<br />
            <span className="heading-accent">Policy.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-mono">Last updated: 1 May 2025</p>
        </div>
      </section>

      <section ref={bodyRef} className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>

            <Section title="1." accent="Who we are.">
              <p>
                This website (<strong>accessibility.now</strong>) is operated by a11y, a digital
                accessibility (A11y) agency. References to "we", "us", or "our" in this policy refer to
                accessibility.now.
              </p>
              <p>
                We are the data controller for the personal data collected through this website. Our contact
                address for data protection matters is:{" "}
                <a href="mailto:privacy@accessibility.now" className="text-primary hover:underline">
                  privacy@accessibility.now
                </a>.
              </p>
              <p>
                This policy applies to data collected through our website, automated scanning tools, and
                contact forms. It does not apply to third-party websites linked from our content.
              </p>
            </Section>

            <Section title="2." accent="The data we collect.">
              <p>
                We collect and process personal data only where we have a lawful basis to do so under the
                General Data Protection Regulation (GDPR) and applicable national law.
              </p>
              <p><strong>Data you provide directly:</strong></p>
              <ul>
                <li><strong>Identity data</strong> - first name, last name, job title, company name.</li>
                <li><strong>Contact data</strong> - email address, phone number.</li>
                <li><strong>Communications</strong> - content of messages sent via our contact form or by email.</li>
                <li><strong>Service data</strong> - URLs you submit for automated accessibility scanning.</li>
              </ul>
              <p><strong>Data collected automatically:</strong></p>
              <ul>
                <li><strong>Technical data</strong> - IP address, browser type and version, operating system, device type, referring URL, pages visited, time on page.</li>
                <li><strong>Usage data</strong> - how you interact with our tools and which features you use.</li>
              </ul>
              <p>
                We do not collect special category data (health data, biometric data, racial or ethnic origin,
                political opinions, religious beliefs, etc.) unless you explicitly provide it in a message to us.
              </p>
            </Section>

            <Section title="3." accent="How we use your data.">
              <p>We use personal data for the following purposes, each with the corresponding legal basis:</p>
              <ul>
                <li>
                  <strong>To provide the accessibility scanning service</strong> - processing URLs you submit
                  to run automated WCAG audits. Basis: contract performance / legitimate interest.
                </li>
                <li>
                  <strong>To respond to enquiries</strong> - processing contact form submissions and email to
                  answer your questions. Basis: legitimate interest.
                </li>
                <li>
                  <strong>To send service-related communications</strong> - audit result notifications,
                  monitoring alerts. Basis: contract performance.
                </li>
                <li>
                  <strong>To send marketing communications</strong> - compliance updates, new features,
                  articles (only where you have opted in). Basis: consent.
                </li>
                <li>
                  <strong>To improve the service</strong> - analysing usage patterns to understand how to
                  make the platform more useful. Basis: legitimate interest.
                </li>
                <li>
                  <strong>To comply with legal obligations</strong> - retaining records as required by law.
                  Basis: legal obligation.
                </li>
              </ul>
            </Section>

            <Section title="4." accent="Who we share your data with.">
              <p>
                We do not sell, rent, or trade your personal data. We share data only with trusted service
                providers who process it on our behalf, under data processing agreements that comply with GDPR:
              </p>
              <ul>
                <li><strong>Cloud infrastructure providers</strong> - for hosting and database services.</li>
                <li><strong>Email service providers</strong> - for transactional and marketing emails.</li>
                <li><strong>Analytics providers</strong> - for anonymised usage analytics.</li>
                <li><strong>Payment processors</strong> - for billing (where applicable).</li>
              </ul>
              <p>
                We may disclose personal data to competent authorities where required by law, or to protect
                the rights, property, or safety of accessibility.now, our clients, or others.
              </p>
            </Section>

            <Section title="5." accent="International transfers.">
              <p>
                Our primary infrastructure is hosted within the European Economic Area (EEA). Where we use
                service providers based outside the EEA, we ensure that appropriate safeguards are in place
                (Standard Contractual Clauses or adequacy decisions) to protect the transfer of your personal
                data in accordance with GDPR.
              </p>
            </Section>

            <Section title="6." accent="Data retention.">
              <p>We retain personal data only as long as necessary for the purposes for which it was collected:</p>
              <ul>
                <li><strong>Audit results</strong> - retained for 12 months from the scan date, then deleted.</li>
                <li><strong>Contact enquiries</strong> - retained for 2 years from last contact.</li>
                <li><strong>Client records</strong> - retained for 6 years to meet legal obligations (contract and financial records).</li>
                <li><strong>Marketing data</strong> - retained until you withdraw consent or unsubscribe.</li>
                <li><strong>Technical logs</strong> - retained for 90 days, then automatically purged.</li>
              </ul>
            </Section>

            <Section title="7." accent="Your rights.">
              <p>Under GDPR, you have the following rights regarding your personal data:</p>
              <ul>
                <li><strong>Right of access</strong> - to request a copy of the personal data we hold about you.</li>
                <li><strong>Right to rectification</strong> - to have inaccurate data corrected.</li>
                <li><strong>Right to erasure</strong> - to request deletion of your data ("the right to be forgotten") where no lawful basis for retention exists.</li>
                <li><strong>Right to restrict processing</strong> - to request that we limit how we use your data in certain circumstances.</li>
                <li><strong>Right to data portability</strong> - to receive your data in a structured, machine-readable format.</li>
                <li><strong>Right to object</strong> - to object to processing based on legitimate interests or for direct marketing purposes.</li>
                <li><strong>Rights related to automated decision-making</strong> - to not be subject to solely automated decisions that have a significant effect on you.</li>
              </ul>
              <p>
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@accessibility.now" className="text-primary hover:underline">
                  privacy@accessibility.now
                </a>
                . We will respond within one month of receiving your request. We may need to verify your
                identity before processing the request.
              </p>
              <p>
                If you are not satisfied with our response, you have the right to lodge a complaint with your
                local data protection authority. In Ireland: the Data Protection Commission (dataprotection.ie).
                In Germany: the relevant Landesbeauftragter. In France: the CNIL (cnil.fr).
              </p>
            </Section>

            <Section title="8." accent="Cookies and tracking.">
              <p>
                We use cookies and similar technologies to operate the website and improve the user experience.
                Categories of cookies we use:
              </p>
              <ul>
                <li>
                  <strong>Strictly necessary cookies</strong> - essential for the website to function. These
                  cannot be disabled. They include session management, security tokens, and accessibility
                  preference storage.
                </li>
                <li>
                  <strong>Analytics cookies</strong> - to understand how visitors use the site (page views,
                  interaction patterns). We use privacy-respecting, cookieless analytics where possible.
                  Where cookies are used, consent is requested before setting them.
                </li>
                <li>
                  <strong>Functional cookies</strong> - to remember your preferences (e.g. EAA checklist
                  progress saved in localStorage). These do not contain personal data.
                </li>
              </ul>
              <p>
                We do not use advertising or tracking cookies. We do not share data with advertising networks.
              </p>
            </Section>

            <Section title="9." accent="Security.">
              <p>
                We implement appropriate technical and organisational measures to protect your personal data
                against unauthorised access, accidental loss, destruction, or damage. These include:
              </p>
              <ul>
                <li>Encryption in transit (TLS) and at rest for all stored data.</li>
                <li>Access controls limiting who within the organisation can access personal data.</li>
                <li>Regular security reviews and dependency audits.</li>
                <li>Incident response procedures for data breach notification.</li>
              </ul>
              <p>
                No method of transmission or storage is completely secure. If you believe your data has been
                compromised, contact us immediately at{" "}
                <a href="mailto:privacy@accessibility.now" className="text-primary hover:underline">
                  privacy@accessibility.now
                </a>.
              </p>
            </Section>

            <Section title="10." accent="Changes to this policy.">
              <p>
                We may update this policy periodically to reflect changes in our practices or applicable law.
                Material changes will be notified by updating the "Last updated" date at the top of this page,
                and where appropriate, by direct notification to registered users.
              </p>
              <p>
                We encourage you to review this policy periodically. Your continued use of the website after
                changes are posted constitutes acceptance of the updated policy.
              </p>
            </Section>

            <Section title="11." accent="Contact.">
              <p>For any questions or concerns about this privacy policy or how we handle your personal data:</p>
              <ul>
                <li>Email: <a href="mailto:privacy@accessibility.now" className="text-primary hover:underline">privacy@accessibility.now</a></li>
                <li>General contact: <a href="mailto:hello@accessibility.now" className="text-primary hover:underline">hello@accessibility.now</a></li>
              </ul>
            </Section>

          </div>
        </div>
      </section>
    </div>
  );
}
