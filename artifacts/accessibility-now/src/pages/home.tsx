import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Search, Code, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [url, setUrl] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      setLocation(`/audit-result?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Calm EAA info strip */}
      <div className="bg-foreground text-background py-2.5 px-4 text-center text-xs font-medium tracking-wide">
        <p style={{ fontFamily: "var(--app-font-mono)" }}>
          EAA enforcement is live across Europe.{" "}
          <Link href="/eaa" className="underline underline-offset-4 hover:text-primary transition-colors">
            Is your product compliant? →
          </Link>
        </p>
      </div>

      {/* Hero — warm gradient background */}
      <section className="hero-gradient pt-24 pb-32 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-display font-extrabold tracking-tight mb-6 text-foreground">
              Can{" "}
              <span className="heading-accent">everyone</span>
              {" "}use<br className="hidden md:block" />
              your website?
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-base text-muted-foreground mb-10 max-w-xl mx-auto"
          >
            We audit digital products for WCAG and EAA compliance. Precise findings,
            clear remediation, built for European enterprises.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <label htmlFor="hero-url" className="sr-only">Your website URL</label>
            <Input
              id="hero-url"
              type="url"
              placeholder="https://your-website.com"
              className="h-14 rounded-xl px-5 text-sm flex-1"
              style={{
                background: "#EFEFEB",
                border: "1px solid #E4E4E2",
                boxShadow: "none",
                fontFamily: "var(--app-font-mono)",
              }}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="h-14 px-8 text-sm font-semibold shrink-0"
            >
              Audit my site →
            </Button>
          </motion.form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-xs text-muted-foreground"
            style={{ fontFamily: "var(--app-font-mono)" }}
          >
            Free automated scan. No sign-up required.
          </motion.p>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-10 border-y bg-white/60">
        <div className="container mx-auto px-4">
          <p className="text-xs font-semibold text-center text-muted-foreground mb-6 uppercase tracking-widest">
            Trusted by engineering teams across sectors
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-14 text-muted-foreground font-medium text-sm">
            <span>Finance</span>
            <span>Healthcare</span>
            <span>Retail</span>
            <span>Government</span>
            <span>Transport</span>
            <span>Education</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-16">
            <h2 className="text-display-md font-extrabold text-foreground mb-4">
              Three lines of work.<br />
              <span className="heading-accent">One accountable team.</span>
            </h2>
            <p className="text-muted-foreground max-w-xl">
              We scope it, audit it, fix it. Strategy and execution stay with the same team, from brief to sign-off.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-3 font-sans">Accessibility Audits</h3>
                <p className="text-muted-foreground mb-6">
                  Automated scanning paired with rigorous manual WCAG 2.1/2.2 AA testing using screen readers and keyboard navigation.
                </p>
                <Link href="/services/audits" className="text-primary font-medium text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all font-sans">
                  View audit details <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Code className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-3 font-sans">Remediation</h3>
                <p className="text-muted-foreground mb-6">
                  Sprint-based fix delivery. We work alongside your developers to submit PRs, annotate code, and write Jira tickets.
                </p>
                <Link href="/services/remediation" className="text-primary font-medium text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all font-sans">
                  View development <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border shadow-none hover:shadow-sm transition-shadow">
              <CardContent className="p-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-3 font-sans">Monitoring</h3>
                <p className="text-muted-foreground mb-6">
                  Monthly re-scans and regression alerts to ensure your code stays compliant as you ship new features.
                </p>
                <Link href="/services/monitoring" className="text-primary font-medium text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all font-sans">
                  View monitoring <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-display-md font-extrabold text-white mb-6">
                The <span style={{ color: "#FF4D1C", fontStyle: "italic" }}>process.</span>
              </h2>
              <p className="text-gray-400 mb-10">
                We integrate directly with your product lifecycle. No fluffy reports — code-level solutions delivered against your backlog.
              </p>
              <div className="space-y-8">
                {[
                  { n: "01", title: "Scan & Scope", body: "We map your critical user journeys and run baseline automated tests." },
                  { n: "02", title: "Manual Audit", body: "Our engineers test your flows using NVDA, VoiceOver, and keyboard-only navigation." },
                  { n: "03", title: "Remediate", body: "We deliver exact code fixes, PRs, and documentation for your team to merge." },
                ].map(({ n, title, body }) => (
                  <div key={n} className="flex gap-5">
                    <div className="text-xs font-bold text-primary pt-1 shrink-0 w-6 font-sans">{n}</div>
                    <div>
                      <h4 className="font-bold text-base text-white mb-1 font-sans">{title}</h4>
                      <p className="text-gray-400">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] rounded-2xl p-8 md:p-10 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-3 font-sans">EAA — who it covers</h3>
              <p className="text-gray-400 mb-6">
                The European Accessibility Act applies to any digital service sold or used within the EU, regardless of where you are headquartered.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["E-commerce & retail", "Banking & financial services", "Transportation & ticketing", "Media & streaming", "Telecoms"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/5 hover:text-white rounded-xl [box-shadow:none]">
                <Link href="/eaa">Read the EAA guide →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-4 text-center hero-gradient">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-display-md font-extrabold mb-5">
            Ready to derisk<br />
            <span className="heading-accent">your product?</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Talk to our engineers about your technical architecture and compliance roadmap.
          </p>
          <Button asChild className="h-14 px-10 text-sm font-bold">
            <Link href="/contact">Book a scope call</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
