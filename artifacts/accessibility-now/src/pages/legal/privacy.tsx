export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-display font-extrabold tracking-tight mb-4">
            Privacy<br />
            <span className="heading-accent">Policy.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-mono">Last updated: October 2023</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl">
          <div className="prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>
            <h2 className="text-display-md font-extrabold font-sans not-prose mb-4">
              1. <span className="heading-accent">Introduction.</span>
            </h2>
            <p>
              accessibility.now (powered by sometech.work) respects your privacy and is committed to protecting your
              personal data. This privacy policy informs you how we look after your personal data when you visit our
              website and tells you about your privacy rights and how the law protects you.
            </p>

            <h2 className="text-xl font-extrabold font-sans not-prose mt-12 mb-4">
              2. The data we collect.
            </h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you, grouped as follows:
            </p>
            <ul>
              <li><strong>Identity Data</strong> — first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> — email address, company name.</li>
              <li><strong>Technical Data</strong> — IP address, browser type and version, time zone, operating system.</li>
            </ul>

            <h2 className="text-xl font-extrabold font-sans not-prose mt-12 mb-4">
              3. How we use your data.
            </h2>
            <p>
              We will only use your personal data when the law allows us to, typically where:
            </p>
            <ul>
              <li>We need to perform a contract we have entered into with you.</li>
              <li>It is necessary for our legitimate business interests.</li>
              <li>We need to comply with a legal obligation.</li>
            </ul>

            <p className="mt-12 text-xs text-muted-foreground italic border-t pt-6">
              Note: This is a placeholder privacy policy for demonstration purposes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
