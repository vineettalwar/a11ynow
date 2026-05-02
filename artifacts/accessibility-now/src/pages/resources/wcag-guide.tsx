export default function WcagGuide() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-6">WCAG 2.1/2.2 Guide</h1>
        <p className="text-xl text-muted-foreground">
          A developer-centric overview of the Web Content Accessibility Guidelines.
        </p>
      </div>

      <div className="prose prose-lg max-w-none prose-headings:font-bold">
        <h2>Understanding WCAG Levels</h2>
        <p>WCAG organizes criteria into three levels of conformance. For EAA compliance, Level AA is the target.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8 not-prose">
          <div className="border p-6 rounded-2xl bg-gray-50">
            <h3 className="font-bold text-xl mb-2">Level A</h3>
            <p className="text-sm text-muted-foreground mb-4">The bare minimum. Without these, the site is impossible to use for some users.</p>
            <ul className="text-sm space-y-2">
              <li>• Meaningful page titles</li>
              <li>• Keyboard accessibility</li>
              <li>• Alt text for basic images</li>
            </ul>
          </div>
          <div className="border-2 border-primary/30 p-6 rounded-2xl bg-white shadow-sm relative">
            <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Target</div>
            <h3 className="font-bold text-xl mb-2">Level AA</h3>
            <p className="text-sm text-muted-foreground mb-4">The legal standard. Balances strong accessibility with design flexibility.</p>
            <ul className="text-sm space-y-2">
              <li>• 4.5:1 color contrast</li>
              <li>• Visible focus states</li>
              <li>• Error suggestions</li>
            </ul>
          </div>
          <div className="border p-6 rounded-2xl bg-gray-50">
            <h3 className="font-bold text-xl mb-2">Level AAA</h3>
            <p className="text-sm text-muted-foreground mb-4">The gold standard. Strict requirements not universally applicable to all sites.</p>
            <ul className="text-sm space-y-2">
              <li>• 7:1 color contrast</li>
              <li>• Sign language interpretation</li>
              <li>• No timing constraints</li>
            </ul>
          </div>
        </div>

        <h2>The POUR Principles</h2>
        <p>Every WCAG criterion maps back to four fundamental principles. If your site fails one, users with disabilities cannot use it.</p>

        <h3>1. Perceivable</h3>
        <p>Information and user interface components must be presentable to users in ways they can perceive. It can't be invisible to all their senses.</p>
        <ul>
          <li>Provide text alternatives for non-text content.</li>
          <li>Provide captions and other alternatives for multimedia.</li>
          <li>Make it easier for users to see and hear content including separating foreground from background.</li>
        </ul>

        <h3>2. Operable</h3>
        <p>User interface components and navigation must be operable. The interface cannot require interaction that a user cannot perform.</p>
        <ul>
          <li>Make all functionality available from a keyboard.</li>
          <li>Give users enough time to read and use content.</li>
          <li>Do not design content in a way that is known to cause seizures or physical reactions.</li>
          <li>Help users navigate and find content.</li>
        </ul>

        <h3>3. Understandable</h3>
        <p>Information and the operation of the user interface must be understandable.</p>
        <ul>
          <li>Make text readable and understandable.</li>
          <li>Make web pages appear and operate in predictable ways.</li>
          <li>Help users avoid and correct mistakes.</li>
        </ul>

        <h3>4. Robust</h3>
        <p>Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies.</p>
        <ul>
          <li>Maximize compatibility with current and future user agents, including assistive technologies. (Use semantic HTML!)</li>
        </ul>
      </div>
    </div>
  );
}
