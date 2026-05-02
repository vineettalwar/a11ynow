import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/eaa", label: "EAA" },
  { href: "/work", label: "Work" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-extrabold text-base tracking-tight text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            accessibility.now
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium" aria-label="Main navigation">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:flex text-sm [box-shadow:none]" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
            <Button className="hidden md:flex h-9 px-5 text-sm font-semibold" asChild>
              <Link href="/contact">Get an audit →</Link>
            </Button>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 py-6 flex flex-col gap-4">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-base font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4 border-t flex flex-col gap-3">
              <Button variant="outline" className="w-full [box-shadow:none]" asChild>
                <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
              </Button>
              <Button className="w-full font-semibold" asChild>
                <Link href="/contact" onClick={() => setMobileOpen(false)}>Get an audit →</Link>
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-white py-14">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="font-extrabold text-base mb-3 font-sans">accessibility.now</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              A digital accessibility agency for European enterprises. WCAG audits, remediation, and monitoring.
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <a
                href="https://sometech.work"
                target="_blank"
                rel="noreferrer"
                className="text-foreground hover:text-primary transition-colors"
              >
                sometech.work
              </a>
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">Services</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/services/audits" className="hover:text-foreground transition-colors">Audits</Link></li>
              <li><Link href="/services/remediation" className="hover:text-foreground transition-colors">Remediation</Link></li>
              <li><Link href="/services/monitoring" className="hover:text-foreground transition-colors">Monitoring</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">Company</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/work" className="hover:text-foreground transition-colors">Work</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">Legal</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/accessibility" className="hover:text-foreground transition-colors">Accessibility Statement</Link></li>
              <li><Link href="/eaa" className="hover:text-foreground transition-colors">EAA Guide</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
