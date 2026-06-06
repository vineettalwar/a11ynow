import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, BookOpen, CheckSquare, BookMarked, ShieldCheck, Layers, FileText, Search, Code, Activity, Sparkles } from "lucide-react";
import gsap from "gsap";

type SimpleLink = { href: string; label: string };

const NAV_LINKS: SimpleLink[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/tools", label: "Tools" },
];

const SERVICES_COLUMNS: {
  href: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  items: SimpleLink[];
}[] = [
  {
    href: "/solutions/fixpilot",
    title: "FixPilot",
    description: "Guided BFSG scan + fix plan.",
    icon: Sparkles,
    items: [
      { href: "/solutions/fixpilot", label: "POUR-grouped BFSG scan" },
      { href: "/solutions/fixpilot", label: "Self-serve fix roadmap" },
      { href: "/services/remediation", label: "Escalate to engineers" },
      { href: "/services/monitoring", label: "Baseline + monitoring" },
    ],
  },
  {
    href: "/services/audits",
    title: "Audits",
    description: "Manual + automated.",
    icon: Search,
    items: [
      { href: "/services/audits", label: "WCAG 2.2 conformance audit" },
      { href: "/eaa", label: "EAA / BFSG compliance audit" },
      { href: "/services/audits", label: "Mobile app audit" },
      { href: "/resources/compliance/section-508", label: "VPAT / ACR for procurement" },
    ],
  },
  {
    href: "/services/remediation",
    title: "Remediation",
    description: "Engineers paired with yours.",
    icon: Code,
    items: [
      { href: "/services/remediation", label: "Sprint-based engineering" },
      { href: "/services/remediation", label: "Pull request delivery" },
      { href: "/services/remediation", label: "Component library fixes" },
      { href: "/services/remediation", label: "Design system advisory" },
    ],
  },
  {
    href: "/services/monitoring",
    title: "Monitoring",
    description: "Continuous compliance.",
    icon: Activity,
    items: [
      { href: "/services/monitoring", label: "Monthly automated scans" },
      { href: "/services/monitoring", label: "Regression alerts" },
      { href: "/services/monitoring", label: "Compliance dashboard" },
      { href: "/services/monitoring", label: "Annual conformance review" },
    ],
  },
];

const RESOURCES_COLUMNS: {
  href: string;
  title: string;
  description: string;
  icon: typeof BookOpen;
  items: SimpleLink[];
}[] = [
  {
    href: "/resources/guides",
    title: "Guides",
    description: "Engineering-grade walkthroughs.",
    icon: BookOpen,
    items: [
      { href: "/resources/wcag-guide", label: "WCAG 2.2" },
      { href: "/resources/guides/aria", label: "ARIA" },
      { href: "/resources/guides/keyboard-accessibility", label: "Keyboard accessibility" },
      { href: "/resources/guides/screen-readers", label: "Screen readers" },
    ],
  },
  {
    href: "/resources/checklists",
    title: "Checklists",
    description: "Interactive, exportable.",
    icon: CheckSquare,
    items: [
      { href: "/resources/eaa-checklist", label: "EAA Checklist" },
      { href: "/tools/wcag-checklist", label: "WCAG 2.1 AA" },
      { href: "/tools/mobile-checklist", label: "Mobile" },
    ],
  },
  {
    href: "/resources/glossary",
    title: "Glossary",
    description: "Acronyms decoded.",
    icon: BookMarked,
    items: [
      { href: "/resources/glossary#letter-E", label: "EAA, EN 301 549" },
      { href: "/resources/glossary#letter-W", label: "WCAG, WAI-ARIA" },
      { href: "/resources/glossary#letter-V", label: "VPAT, ACR" },
    ],
  },
  {
    href: "/resources/compliance",
    title: "Compliance",
    description: "Laws by region.",
    icon: ShieldCheck,
    items: [
      { href: "/eaa", label: "European Accessibility Act" },
      { href: "/resources/compliance/en-301-549", label: "EN 301 549" },
      { href: "/resources/compliance/ada", label: "ADA" },
      { href: "/resources/compliance/section-508", label: "Section 508" },
      { href: "/resources/compliance/aoda", label: "AODA" },
    ],
  },
  {
    href: "/resources/technologies",
    title: "Technologies",
    description: "Platform-specific.",
    icon: Layers,
    items: [
      { href: "/resources/technologies/wordpress", label: "WordPress" },
      { href: "/resources/technologies/typo3", label: "TYPO3" },
      { href: "/resources/technologies/drupal", label: "Drupal" },
      { href: "/resources/technologies/shopify", label: "Shopify" },
      { href: "/resources/technologies/react", label: "React" },
      { href: "/resources/technologies/nextjs", label: "Next.js" },
    ],
  },
  {
    href: "/resources/blog",
    title: "Blog",
    description: "Engineering deep-dives.",
    icon: FileText,
    items: [
      { href: "/resources/blog/eaa-enforcement", label: "EAA enforcement" },
      { href: "/resources/blog/wcag-ecommerce", label: "WCAG for e-commerce" },
      { href: "/resources/blog/automated-vs-manual", label: "Automated vs manual" },
    ],
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const ctaButtonRef = useRef<HTMLAnchorElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const servicesMegaRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const servicesCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [location] = useLocation();

  // Close mega menu and mobile menu on route change
  useEffect(() => {
    setResourcesOpen(false);
    setServicesOpen(false);
    setMobileOpen(false);
    setMobileResourcesOpen(false);
    setMobileServicesOpen(false);
  }, [location]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 60) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
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

  // Mega menu reveal animations
  useEffect(() => {
    const el = megaRef.current;
    if (!el || !resourcesOpen) return;
    gsap.fromTo(el, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" });
  }, [resourcesOpen]);

  useEffect(() => {
    const el = servicesMegaRef.current;
    if (!el || !servicesOpen) return;
    gsap.fromTo(el, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" });
  }, [servicesOpen]);

  const openResources = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (servicesCloseTimer.current) clearTimeout(servicesCloseTimer.current);
    setServicesOpen(false);
    setResourcesOpen(true);
  };
  const scheduleCloseResources = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setResourcesOpen(false), 120);
  };

  const openServices = () => {
    if (servicesCloseTimer.current) clearTimeout(servicesCloseTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setResourcesOpen(false);
    setServicesOpen(true);
  };
  const scheduleCloseServices = () => {
    if (servicesCloseTimer.current) clearTimeout(servicesCloseTimer.current);
    servicesCloseTimer.current = setTimeout(() => setServicesOpen(false), 120);
  };

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
            {/* Services mega menu trigger */}
            <div
              className="relative"
              onMouseEnter={openServices}
              onMouseLeave={scheduleCloseServices}
            >
              <button
                type="button"
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                onClick={() => setServicesOpen((o) => !o)}
                onFocus={openServices}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                Services
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
            </div>

            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {label}
              </Link>
            ))}

            {/* Resources mega menu trigger */}
            <div
              className="relative"
              onMouseEnter={openResources}
              onMouseLeave={scheduleCloseResources}
            >
              <button
                type="button"
                aria-expanded={resourcesOpen}
                aria-haspopup="true"
                onClick={() => setResourcesOpen((o) => !o)}
                onFocus={openResources}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                Resources
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
            </div>

            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              About
            </Link>
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

        {/* Services mega menu panel */}
        {servicesOpen && (
          <div
            ref={servicesMegaRef}
            className="hidden md:block absolute left-0 right-0 top-full bg-background border-b shadow-lg"
            onMouseEnter={openServices}
            onMouseLeave={scheduleCloseServices}
          >
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {SERVICES_COLUMNS.map(({ href, title, description, icon: Icon, items }) => (
                  <div key={title} className="min-w-0">
                    <Link
                      href={href}
                      className="flex items-center gap-2 mb-3 text-foreground hover:text-primary transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-extrabold text-sm">{title}</span>
                    </Link>
                    <p className="text-xs font-mono text-muted-foreground mb-3">{description}</p>
                    <ul className="space-y-2">
                      {items.map((it, idx) => (
                        <li key={`${it.href}-${idx}`}>
                          <Link
                            href={it.href}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors block leading-snug"
                          >
                            {it.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-7 pt-5 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-mono">
                  EAA-ready engineering. Senior team, fixed scope, sprint cadence.
                </p>
                <div className="flex items-center gap-5">
                  <Link href="/services" className="text-xs font-semibold text-primary hover:underline">
                    All services →
                  </Link>
                  <Link href="/pricing" className="text-xs font-semibold text-primary hover:underline">
                    Pricing →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop mega menu panel - full-width under header */}
        {resourcesOpen && (
          <div
            ref={megaRef}
            className="hidden md:block absolute left-0 right-0 top-full bg-background border-b shadow-lg"
            onMouseEnter={openResources}
            onMouseLeave={scheduleCloseResources}
          >
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
                {RESOURCES_COLUMNS.map(({ href, title, description, icon: Icon, items }) => (
                  <div key={title} className="min-w-0">
                    <Link
                      href={href}
                      className="flex items-center gap-2 mb-3 text-foreground hover:text-primary transition-colors group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-extrabold text-sm">{title}</span>
                    </Link>
                    <p className="text-xs font-mono text-muted-foreground mb-3">{description}</p>
                    <ul className="space-y-2">
                      {items.map((it) => (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors block leading-snug"
                          >
                            {it.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-7 pt-5 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-mono">
                  All resources · written by engineers, free to use.
                </p>
                <Link
                  href="/resources"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Browse all resources →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 py-6 flex flex-col gap-3 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-base font-medium text-foreground hover:text-primary transition-colors py-1"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}

            {/* Mobile Services accordion */}
            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between text-base font-medium text-foreground py-1"
                aria-expanded={mobileServicesOpen}
                onClick={() => setMobileServicesOpen((o) => !o)}
              >
                Services
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {mobileServicesOpen && (
                <div className="mt-3 pl-3 border-l-2 border-border space-y-4">
                  {SERVICES_COLUMNS.map(({ href, title, items }) => (
                    <div key={title}>
                      <Link
                        href={href}
                        className="block text-sm font-bold text-foreground mb-1.5"
                        onClick={() => setMobileOpen(false)}
                      >
                        {title}
                      </Link>
                      <ul className="space-y-1.5">
                        {items.map((it, idx) => (
                          <li key={`${it.href}-${idx}`}>
                            <Link
                              href={it.href}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              {it.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <Link
                    href="/services"
                    className="block text-xs font-semibold text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    All services →
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Resources accordion */}
            <div>
              <button
                type="button"
                className="w-full flex items-center justify-between text-base font-medium text-foreground py-1"
                aria-expanded={mobileResourcesOpen}
                onClick={() => setMobileResourcesOpen((o) => !o)}
              >
                Resources
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileResourcesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {mobileResourcesOpen && (
                <div className="mt-3 pl-3 border-l-2 border-border space-y-4">
                  {RESOURCES_COLUMNS.map(({ href, title, items }) => (
                    <div key={title}>
                      <Link
                        href={href}
                        className="block text-sm font-bold text-foreground mb-1.5"
                        onClick={() => setMobileOpen(false)}
                      >
                        {title}
                      </Link>
                      <ul className="space-y-1.5">
                        {items.map((it) => (
                          <li key={it.href}>
                            <Link
                              href={it.href}
                              className="text-xs text-muted-foreground hover:text-primary transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              {it.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/about"
              className="text-base font-medium text-foreground hover:text-primary transition-colors py-1"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>

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
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2">
            <h3 className="font-extrabold text-base mb-3 font-sans">accessibility.now</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed max-w-xs">
              A11y agency: WCAG audits, remediation, and monitoring, focused on teams shipping in the EU.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">Services</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/services/audits" className="hover:text-foreground transition-colors">Audits</Link></li>
              <li><Link href="/services/remediation" className="hover:text-foreground transition-colors">Remediation</Link></li>
              <li><Link href="/services/monitoring" className="hover:text-foreground transition-colors">Monitoring</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">Resources</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/resources/guides" className="hover:text-foreground transition-colors">Guides</Link></li>
              <li><Link href="/resources/checklists" className="hover:text-foreground transition-colors">Checklists</Link></li>
              <li><Link href="/resources/glossary" className="hover:text-foreground transition-colors">Glossary</Link></li>
              <li><Link href="/resources/compliance" className="hover:text-foreground transition-colors">Compliance</Link></li>
              <li><Link href="/resources/technologies" className="hover:text-foreground transition-colors">Technologies</Link></li>
              <li><Link href="/resources/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">Tools &amp; Legal</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/tools" className="hover:text-foreground transition-colors">All tools</Link></li>
              <li><Link href="/eaa" className="hover:text-foreground transition-colors">EAA Guide</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/accessibility" className="hover:text-foreground transition-colors">Accessibility Statement</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
