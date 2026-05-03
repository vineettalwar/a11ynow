import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import gsap from "gsap";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/eaa", label: "EAA" },
  { href: "/tools", label: "Tools" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const ctaButtonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 60) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const btn = ctaButtonRef.current;
    if (!btn) return;
    const enter = () => gsap.to(btn, { scale: 1.04, duration: 0.18, ease: "power2.out" });
    const leave = () => gsap.to(btn, { scale: 1, duration: 0.18, ease: "power2.out" });
    btn.addEventListener("mouseenter", enter);
    btn.addEventListener("mouseleave", leave);
    return () => {
      btn.removeEventListener("mouseenter", enter);
      btn.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header
        ref={headerRef}
        className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50"
        style={{ transition: "background 0.3s ease, box-shadow 0.3s ease" }}
      >
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
              <Link href="/contact" ref={ctaButtonRef as React.Ref<HTMLAnchorElement>}>Get an audit →</Link>
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
            <h4 className="font-semibold text-sm mb-4 font-sans">Tools</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/tools/contrast-checker" className="hover:text-foreground transition-colors">Contrast Checker</Link></li>
              <li><Link href="/tools/colour-blindness" className="hover:text-foreground transition-colors">Colour Blindness Sim</Link></li>
              <li><Link href="/tools/screen-reader-preview" className="hover:text-foreground transition-colors">Screen Reader Preview</Link></li>
              <li><Link href="/tools/keyboard-tester" className="hover:text-foreground transition-colors">Keyboard Tester</Link></li>
              <li><Link href="/tools/low-vision" className="hover:text-foreground transition-colors">Low Vision Sim</Link></li>
              <li><Link href="/tools/mobile-checklist" className="hover:text-foreground transition-colors">Mobile Checklist</Link></li>
              <li><Link href="/tools/wcag-checklist" className="hover:text-foreground transition-colors">WCAG 2.1 Checklist</Link></li>
              <li><Link href="/tools/focus-order" className="hover:text-foreground transition-colors">Focus Order Visualizer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">Legal</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
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
