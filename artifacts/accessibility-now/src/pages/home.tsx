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
      {/* EAA Urgency Banner */}
      <div className="bg-foreground text-background py-3 px-4 text-center text-sm font-medium">
        <p>
          The EU deadline was June 28, 2025. Are you already non-compliant?{" "}
          <Link href="/eaa" className="underline underline-offset-4 hover:text-primary transition-colors">
            Learn more about the EAA
          </Link>
        </p>
      </div>

      {/* Hero */}
      <section className="py-24 md:py-32 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Is your website <br className="hidden md:block" />
            <span className="text-primary">EAA-ready?</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            The bridge between compliance law and functional code. We provide precise, 
            actionable accessibility audits and remediation for European enterprises.
          </motion.p>
          
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit} 
            className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto"
          >
            <Input 
              type="url" 
              placeholder="https://your-website.com" 
              className="h-14 rounded-full px-6 text-lg bg-white border-2 focus-visible:ring-primary shadow-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <Button type="submit" className="h-14 rounded-full px-8 text-lg font-semibold shadow-none w-full md:w-auto shrink-0">
              Get Compliance Snapshot
            </Button>
          </motion.form>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y bg-white/50">
        <div className="container mx-auto px-4">
          <p className="text-sm font-semibold text-center text-muted-foreground mb-8 uppercase tracking-wider">
            Trusted by engineering teams across sectors
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-muted-foreground font-medium">
            <span>Finance</span>
            <span>Healthcare</span>
            <span>Retail</span>
            <span>Government</span>
            <span>Transport</span>
            <span>Education</span>
          </div>
        </div>
      </section>

      {/* Services Strip */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Methodology</h2>
            <p className="text-lg text-muted-foreground">Engineering-led compliance.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 shadow-none hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <Search className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-xl font-bold mb-3">Accessibility Audits</h3>
                <p className="text-muted-foreground mb-6">
                  Automated scanning paired with rigorous manual WCAG 2.1/2.2 AA testing using screen readers and keyboard navigation.
                </p>
                <Link href="/services/audits" className="text-primary font-medium flex items-center gap-2 hover:underline">
                  View audit details <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-2 shadow-none hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <Code className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-xl font-bold mb-3">Remediation</h3>
                <p className="text-muted-foreground mb-6">
                  Sprint-based fix delivery. We work alongside your developers to submit PRs, annotate code, and write Jira tickets.
                </p>
                <Link href="/services/remediation" className="text-primary font-medium flex items-center gap-2 hover:underline">
                  View development <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-none hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <ShieldCheck className="w-10 h-10 text-primary mb-6" />
                <h3 className="text-xl font-bold mb-3">Monitoring</h3>
                <p className="text-muted-foreground mb-6">
                  Monthly re-scans and regression alerts to ensure your code stays compliant as you ship new features.
                </p>
                <Link href="/services/monitoring" className="text-primary font-medium flex items-center gap-2 hover:underline">
                  View monitoring <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">The process.</h2>
              <p className="text-lg text-gray-400 mb-8">
                We integrate directly with your product lifecycle. No fluffy reports, just code-level solutions.
              </p>
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">1</div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">Scan & Scope</h4>
                    <p className="text-gray-400">We map your critical user journeys and run baseline automated tests.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">2</div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">Manual Audit</h4>
                    <p className="text-gray-400">Our engineers manually test your flows using NVDA, VoiceOver, and keyboard-only navigation.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">3</div>
                  <div>
                    <h4 className="font-bold text-xl mb-2">Remediate</h4>
                    <p className="text-gray-400">We deliver exact code fixes, PRs, and documentation for your team to merge.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-3xl p-8 md:p-12 border border-gray-800">
              <h3 className="text-2xl font-bold mb-4 text-white">EAA Awareness</h3>
              <p className="text-gray-400 mb-6">
                The European Accessibility Act applies if you sell digital services in the EU. Non-compliance risks significant fines and market exclusion.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span>E-commerce & retail</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span>Banking & financial services</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span>Transportation & ticketing</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full rounded-xl bg-transparent border-gray-700 text-white hover:bg-gray-800 hover:text-white">
                <Link href="/eaa">Read the EAA requirements</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">Ready to derisk your product?</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Let's talk about your technical architecture and compliance roadmap.
          </p>
          <Button asChild className="h-14 rounded-full px-10 text-lg font-bold shadow-none">
            <Link href="/contact">Book a scope call</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
