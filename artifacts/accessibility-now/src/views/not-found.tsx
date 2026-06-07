"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4 flex-1">
        <div className="container mx-auto max-w-xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-5 font-sans">
            404
          </p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Page not<br />
            <span className="heading-accent">found.</span>
          </h1>
          <p className="text-muted-foreground text-base mb-10 leading-relaxed">
            That URL does not exist. Try our free accessibility scanner, browse tools, or get in touch for an audit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="gap-2">
              <Link href="/tools/website-scanner">
                <Search className="w-4 h-4" aria-hidden />
                Run a free scan
              </Link>
            </Button>
            <Button variant="outline" asChild className="[box-shadow:none] gap-2">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" aria-hidden />
                Back home
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
