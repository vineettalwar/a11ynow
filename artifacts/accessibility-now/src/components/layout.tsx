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
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight" onClick={() => setMobileOpen(false)}>
            accessibility.now
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-primary transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:flex" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
            <Button className="hidden md:flex rounded-full px-6 font-semibold shadow-none" asChild>
              <Link href="/contact">Get a free audit</Link>
            </Button>

            <button
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
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
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="pt-4 border-t flex flex-col gap-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
              </Button>
              <Button className="w-full rounded-full font-semibold shadow-none" asChild>
                <Link href="/contact" onClick={() => setMobileOpen(false)}>Get a free audit</Link>
              </Button>
            </div>
          </div>
        )}
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
