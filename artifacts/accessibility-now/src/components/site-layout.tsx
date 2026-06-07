"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Menu, X, ChevronDown } from "lucide-react";
import gsap from "gsap";
import { localeFromPathname, localizedPath } from "@/lib/i18n/locale";
import { getSiteMessages } from "@/lib/i18n/site-messages";
import {
  getFooterLinks,
  getNavLinks,
  getResourcesColumns,
  getServicesColumns,
} from "@/lib/i18n/site-navigation";

export function SiteLayout({ children }: { children: React.ReactNode }) {
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
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const messages = getSiteMessages(locale);
  const navLinks = getNavLinks(locale);
  const servicesColumns = getServicesColumns(locale);
  const resourcesColumns = getResourcesColumns(locale);
  const footerLinks = getFooterLinks(locale);

  const pathWithoutLocale = pathname.replace(/^\/de(?=\/|$)/, "") || "/";
  if (pathWithoutLocale.startsWith("/reports/")) {
    return <>{children}</>;
  }

  // Close mega menu and mobile menu on route change
  useEffect(() => {
    setResourcesOpen(false);
    setServicesOpen(false);
    setMobileOpen(false);
    setMobileResourcesOpen(false);
    setMobileServicesOpen(false);
  }, [pathname]);

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
            href={localizedPath("/", locale)}
            className="font-extrabold text-base tracking-tight text-foreground"
            onClick={() => setMobileOpen(false)}
          >
            accessibility.now
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium" aria-label={messages.nav.main}>
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
                {messages.nav.services}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
            </div>

            {navLinks.map(({ href, label }) => (
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
                {messages.nav.resources}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
            </div>

            <Link
              href={localizedPath("/about", locale)}
              className="text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              {messages.nav.about}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher className="hidden md:flex" />
            <Button variant="ghost" className="hidden md:flex text-sm [box-shadow:none]" asChild>
              <Link href={localizedPath("/contact", locale)}>{messages.nav.contact}</Link>
            </Button>
            <Button className="hidden md:flex h-9 px-5 text-sm font-semibold" asChild>
              <Link href={localizedPath("/contact", locale)} ref={ctaButtonRef as React.Ref<HTMLAnchorElement>}>
                {messages.nav.getAudit}
              </Link>
            </Button>

            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={mobileOpen ? messages.nav.closeMenu : messages.nav.openMenu}
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
                {servicesColumns.map(({ href, title, description, icon: Icon, items }) => (
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
                <p className="text-xs text-muted-foreground font-mono">{messages.services.tagline}</p>
                <div className="flex items-center gap-5">
                  <Link href={localizedPath("/services", locale)} className="text-xs font-semibold text-primary hover:underline">
                    {messages.nav.allServices}
                  </Link>
                  <Link href={localizedPath("/pricing", locale)} className="text-xs font-semibold text-primary hover:underline">
                    {messages.nav.pricing} →
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
                {resourcesColumns.map(({ href, title, description, icon: Icon, items }) => (
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
                <p className="text-xs text-muted-foreground font-mono">{messages.resources.tagline}</p>
                <Link
                  href={localizedPath("/resources", locale)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {messages.nav.browseResources}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background px-4 py-6 flex flex-col gap-3 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <LanguageSwitcher className="self-start mb-1" />

            {navLinks.map(({ href, label }) => (
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
                {messages.nav.services}
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {mobileServicesOpen && (
                <div className="mt-3 pl-3 border-l-2 border-border space-y-4">
                  {servicesColumns.map(({ href, title, items }) => (
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
                    href={localizedPath("/services", locale)}
                    className="block text-xs font-semibold text-primary"
                    onClick={() => setMobileOpen(false)}
                  >
                    {messages.nav.allServices}
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
                {messages.nav.resources}
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileResourcesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {mobileResourcesOpen && (
                <div className="mt-3 pl-3 border-l-2 border-border space-y-4">
                  {resourcesColumns.map(({ href, title, items }) => (
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
              href={localizedPath("/about", locale)}
              className="text-base font-medium text-foreground hover:text-primary transition-colors py-1"
              onClick={() => setMobileOpen(false)}
            >
              {messages.nav.about}
            </Link>

            <div className="pt-4 border-t flex flex-col gap-3">
              <Button variant="outline" className="w-full [box-shadow:none]" asChild>
                <Link href={localizedPath("/contact", locale)} onClick={() => setMobileOpen(false)}>
                  {messages.nav.contact}
                </Link>
              </Button>
              <Button className="w-full font-semibold" asChild>
                <Link href={localizedPath("/contact", locale)} onClick={() => setMobileOpen(false)}>
                  {messages.nav.getAudit}
                </Link>
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
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed max-w-xs">
              {messages.footer.tagline}
            </p>
            <div>
              <h4 className="font-semibold text-sm mb-2 font-sans">{messages.footer.language}</h4>
              <LanguageSwitcher variant="footer" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">{messages.footer.services}</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {footerLinks.services.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">{messages.footer.resources}</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {footerLinks.resources.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 font-sans">{messages.footer.toolsLegal}</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {footerLinks.toolsLegal.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-foreground transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
