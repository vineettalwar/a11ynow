import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2">
            <span>accessibility.now</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/services" className="hover:text-primary transition-colors">Services</Link>
            <Link href="/eaa" className="hover:text-primary transition-colors">EAA</Link>
            <Link href="/work" className="hover:text-primary transition-colors">Work</Link>
            <Link href="/resources" className="hover:text-primary transition-colors">Resources</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="hidden md:flex" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
            <Button className="rounded-full px-6 font-semibold shadow-none" asChild>
              <Link href="/contact">Get a free audit</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">accessibility.now</h3>
            <p className="text-sm text-muted-foreground mb-4">
              A no-nonsense accessibility compliance agency for European enterprises.
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by <a href="https://sometech.work" target="_blank" rel="noreferrer" className="text-foreground hover:underline">sometech.work</a>
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/services/audits" className="hover:text-foreground">Audits</Link></li>
              <li><Link href="/services/remediation" className="hover:text-foreground">Remediation</Link></li>
              <li><Link href="/services/monitoring" className="hover:text-foreground">Monitoring</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/work" className="hover:text-foreground">Work</Link></li>
              <li><Link href="/about" className="hover:text-foreground">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/legal/accessibility" className="hover:text-foreground">Accessibility Statement</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
