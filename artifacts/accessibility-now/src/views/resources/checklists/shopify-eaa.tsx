"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, RotateCcw, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSectionReveal } from "@/hooks/use-section-reveal";

const STORAGE_KEY = "a11ynow-shopify-eaa-checklist";

const ITEMS = [
  { id: "theme-audit", label: "Theme accessibility audit completed", detail: "Run axe/Lighthouse on homepage, collection, product, cart, and checkout. Fix contrast, focus, and keyboard traps in theme Liquid/JS." },
  { id: "keyboard-checkout", label: "Checkout usable by keyboard only", detail: "Complete a purchase with Tab/Enter only — including discount codes, shipping, and payment fields." },
  { id: "product-alt", label: "Product images have meaningful alt text", detail: "Variant images describe the product, not filenames. Decorative swatches use empty alt." },
  { id: "cart-announce", label: "Cart updates announced to screen readers", detail: "Adding/removing items updates a live region or focus moves to confirmation." },
  { id: "filters", label: "Collection filters work without drag or hover-only", detail: "Faceted search and sort controls are buttons/links with visible focus." },
  { id: "forms", label: "Newsletter and contact forms have labels", detail: "No placeholder-only fields. Errors are text, not colour alone." },
  { id: "apps", label: "Third-party apps reviewed for accessibility", detail: "Reviews widgets, chat, upsell popups, and cookie banners tested with keyboard and screen reader." },
  { id: "video", label: "Product video has captions or transcript", detail: "Autoplay off or muted with controls. Captions for spoken content." },
  { id: "statement", label: "Accessibility statement published", detail: "Linked from footer with contact email and conformance target (WCAG 2.1/2.2 AA)." },
  { id: "eaa-docs", label: "EAA conformity documentation ready", detail: "For EU sales: document WCAG testing, known exceptions, and remediation timeline." },
];

export default function ShopifyEaaChecklist() {
  const heroRef = useSectionReveal<HTMLDivElement>();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch {
      /* ignore */
    }
  }, [checked]);

  const done = ITEMS.filter((i) => checked[i.id]).length;
  const pct = Math.round((done / ITEMS.length) * 100);

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-20 pb-14 px-4">
        <div ref={heroRef} className="container mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Link href="/resources/checklists" className="hover:text-foreground">Checklists</Link>
            <span>/</span>
            <span className="text-foreground">Shopify EAA</span>
          </nav>
          <p className="section-label text-xs font-semibold text-primary uppercase tracking-widest mb-3">
            Checklists · Shopify · EAA
          </p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Shopify EAA <span className="heading-accent">pre-flight.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Ten checks every EU-facing Shopify merchant should pass before EAA enforcement. Progress saves in your browser.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-mono">
              <ShoppingCart className="w-4 h-4 text-primary" aria-hidden />
              {done}/{ITEMS.length} complete ({pct}%)
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="[box-shadow:none]"
              onClick={() => setChecked({})}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" aria-hidden />
              Reset
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-3xl space-y-3">
          {ITEMS.map((item) => {
            const isChecked = !!checked[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setChecked((c) => ({ ...c, [item.id]: !c[item.id] }))}
                className={`w-full text-left rounded-xl border p-5 flex gap-4 transition-colors ${isChecked ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20"}`}
              >
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                )}
                <div>
                  <p className="font-semibold text-sm font-sans">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.detail}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="container mx-auto max-w-3xl mt-12 p-6 rounded-2xl border bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Need a full theme audit or checkout remediation before the EAA deadline?
          </p>
          <Button asChild>
            <Link href="/contact">Get a Shopify audit →</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
