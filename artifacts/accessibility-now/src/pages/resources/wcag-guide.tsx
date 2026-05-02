export default function WcagGuide() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            WCAG 2.1/2.2<br />
            <span className="heading-accent">Developer Guide.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            A developer-centric overview of the Web Content Accessibility Guidelines — levels,
            POUR principles, and what EAA compliance actually requires.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold mb-8">
            Understanding <span className="heading-accent">WCAG levels.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            <div className="border p-6 rounded-xl bg-background">
              <h3 className="font-bold text-base font-sans mb-2">Level A</h3>
              <p className="text-xs text-muted-foreground mb-4">The bare minimum. Without these, the site is impossible to use for some users.</p>
              <ul className="text-xs space-y-1.5">
                <li>• Meaningful page titles</li>
                <li>• Keyboard accessibility</li>
                <li>• Alt text for basic images</li>
              </ul>
            </div>
            <div className="border-2 border-primary/40 p-6 rounded-xl bg-white relative">
              <div className="absolute -top-3 right-4 bg-primary text-white text-xs font-bold px-3 py-0.5 rounded-full font-sans">EAA target</div>
              <h3 className="font-bold text-base font-sans mb-2">Level AA</h3>
              <p className="text-xs text-muted-foreground mb-4">The legal standard. Balances strong accessibility with design flexibility.</p>
              <ul className="text-xs space-y-1.5">
                <li>• 4.5:1 colour contrast</li>
                <li>• Visible focus states</li>
                <li>• Error suggestions</li>
              </ul>
            </div>
            <div className="border p-6 rounded-xl bg-background">
              <h3 className="font-bold text-base font-sans mb-2">Level AAA</h3>
              <p className="text-xs text-muted-foreground mb-4">The gold standard. Strict requirements not universally applicable.</p>
              <ul className="text-xs space-y-1.5">
                <li>• 7:1 colour contrast</li>
                <li>• Sign language interpretation</li>
                <li>• No timing constraints</li>
              </ul>
            </div>
          </div>

          <h2 className="text-display-md font-extrabold mb-8">
            The <span className="heading-accent">POUR principles.</span>
          </h2>

          <div className="space-y-8 prose prose-sm max-w-none" style={{ fontFamily: "var(--app-font-mono)" }}>
            <div>
              <h3 className="font-bold text-sm font-sans uppercase tracking-widest text-primary mb-2 not-prose">1. Perceivable</h3>
              <p>Information and UI components must be presentable in ways users can perceive — not invisible to all their senses.</p>
              <ul>
                <li>Provide text alternatives for non-text content.</li>
                <li>Provide captions and transcripts for multimedia.</li>
                <li>Separate foreground from background so content is distinguishable.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm font-sans uppercase tracking-widest text-primary mb-2 not-prose">2. Operable</h3>
              <p>UI components and navigation must be operable — the interface cannot require interaction a user cannot perform.</p>
              <ul>
                <li>All functionality must be available from a keyboard.</li>
                <li>Give users enough time to read and use content.</li>
                <li>Help users navigate and find content.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm font-sans uppercase tracking-widest text-primary mb-2 not-prose">3. Understandable</h3>
              <p>Information and UI operation must be understandable.</p>
              <ul>
                <li>Make text readable. Set the lang attribute.</li>
                <li>Pages should operate in predictable ways.</li>
                <li>Help users avoid and correct mistakes.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-sm font-sans uppercase tracking-widest text-primary mb-2 not-prose">4. Robust</h3>
              <p>Content must be robust enough to be interpreted reliably by a wide variety of user agents, including assistive technologies.</p>
              <ul>
                <li>Maximise compatibility using semantic HTML and correct ARIA usage.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
