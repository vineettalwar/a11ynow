import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, Search, Code, ShieldCheck, Eye, Keyboard, Smartphone, ClipboardList, Plus, Trash2, Layers } from "lucide-react";
import gsap from "gsap";
import { ParticleCanvas } from "@/components/particle-canvas";
import { useSectionReveal } from "@/hooks/use-section-reveal";


function useGsapButtonHover(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const buttons = el.querySelectorAll<HTMLElement>(".btn-gsap");
    const cleanups: (() => void)[] = [];
    buttons.forEach((btn) => {
      const enter = () => gsap.to(btn, { scale: 1.04, duration: 0.2, ease: "power2.out" });
      const leave = () => gsap.to(btn, { scale: 1, duration: 0.2, ease: "power2.out" });
      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        btn.removeEventListener("mouseenter", enter);
        btn.removeEventListener("mouseleave", leave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);
}

const BATCH_STORAGE_KEY = "batch_audit_result";
const MULTI_SCAN_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type UrlStatus = "queued" | "scanning" | "done" | "error";

interface UrlScanState {
  url: string;
  status: UrlStatus;
  score?: number;
  level?: string;
  totalViolations?: number;
  criticalViolations?: number;
  seriousViolations?: number;
  passedChecks?: number;
  totalChecks?: number;
  violations?: unknown[];
  scannedAt?: string;
  auditId?: string;
  error?: string;
}

interface BatchAuditResponse {
  siteScore: number;
  siteLevel: string;
  scannedAt: string;
  pages: Array<{
    auditId: string;
    url: string;
    score: number;
    level: string;
    totalViolations: number;
    criticalViolations: number;
    seriousViolations: number;
    passedChecks: number;
    totalChecks: number;
    scannedAt: string;
    status: "success" | "error";
    error?: string;
  }>;
  crossPageViolations: Array<{
    id: string;
    wcagCriteria: string;
    description: string;
    impact: string;
    pageCount: number;
    totalAffectedElements: number;
    affectedUrls: string[];
  }>;
}

const statusLabel: Record<UrlStatus, string> = {
  queued: "Queued",
  scanning: "Scanning…",
  done: "Done",
  error: "Failed",
};

const statusDotClass: Record<UrlStatus, string> = {
  queued: "bg-muted-foreground/40",
  scanning: "bg-primary animate-pulse",
  done: "bg-emerald-500",
  error: "bg-destructive",
};

function MultiUrlForm() {
  const [urls, setUrls] = useState<string[]>(["", ""]);
  const [scanning, setScanning] = useState(false);
  const [urlStates, setUrlStates] = useState<UrlScanState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  function addUrl() {
    if (urls.length < 10) setUrls((u) => [...u, ""]);
  }

  function removeUrl(i: number) {
    setUrls((u) => u.filter((_, idx) => idx !== i));
  }

  function updateUrl(i: number, val: string) {
    setUrls((u) => u.map((u2, idx) => (idx === i ? val : u2)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filled = urls.map((u) => u.trim()).filter(Boolean);
    if (filled.length === 0) return;
    setError(null);
    setScanning(true);

    // Show all URLs as queued immediately
    const initial: UrlScanState[] = filled.map((url) => ({ url, status: "queued" }));
    setUrlStates(initial);

    try {
      const res = await fetch(`${MULTI_SCAN_BASE}/api/audit/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: filled }),
      });

      // Handle non-SSE error responses (e.g. 400 validation errors)
      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let batchResult: BatchAuditResponse | null = null;

      // Track progress by index (not URL) so duplicate URLs don't collide
      const states: UrlScanState[] = filled.map((url) => ({ url, status: "queued" }));

      const patchIndex = (index: number, patch: Partial<UrlScanState>) => {
        if (index >= 0 && index < states.length) {
          states[index] = { ...states[index], ...patch };
          setUrlStates([...states]);
        }
      };

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by double newlines
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = JSON.parse(line.slice(6)) as {
              type: string;
              url?: string;
              index?: number;
              status?: "success" | "error";
              score?: number;
              level?: string;
              auditId?: string;
              error?: string;
              message?: string;
            } & Partial<BatchAuditResponse>;

            if (data.type === "scanning" && data.index != null) {
              patchIndex(data.index, { status: "scanning" });
            } else if (data.type === "page" && data.index != null) {
              patchIndex(data.index, {
                status: data.status === "success" ? "done" : "error",
                score: data.score,
                level: data.level,
                auditId: data.auditId,
                error: data.error,
              });
            } else if (data.type === "complete") {
              batchResult = data as unknown as BatchAuditResponse;
              break outer;
            } else if (data.type === "error") {
              throw new Error(data.message ?? "Batch scan failed.");
            }
          }
        }
      }

      if (!batchResult) throw new Error("Batch scan did not return a result.");

      // Brief pause so users can see the final per-URL statuses before navigating
      await new Promise((r) => setTimeout(r, 700));

      sessionStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(batchResult));
      setLocation("/batch-result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch scan failed. Please try again.");
      setScanning(false);
      setUrlStates([]);
    }
  }

  if (scanning && urlStates.length > 0) {
    const doneCount = urlStates.filter((s) => s.status === "done" || s.status === "error").length;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/70 border border-border rounded-2xl p-5 space-y-2.5">
          <p className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wide mb-3">
            Scanning {urlStates.length} pages — {doneCount} of {urlStates.length} complete
          </p>
          {urlStates.map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass[s.status]}`} />
              <span
                className="flex-1 font-mono text-xs text-foreground truncate"
                title={s.url}
              >
                {s.url}
              </span>
              <div className="text-right shrink-0">
                {s.status === "done" && s.score !== undefined ? (
                  <span className="font-bold font-sans text-sm text-foreground">{s.score}</span>
                ) : (
                  <span className="text-xs font-sans text-muted-foreground">{statusLabel[s.status]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="hero-form space-y-3 max-w-2xl mx-auto">
      {urls.map((u, i) => (
        <div key={i} className="flex gap-2 items-center">
          <label htmlFor={`batch-url-${i}`} className="sr-only">URL {i + 1}</label>
          <Input
            id={`batch-url-${i}`}
            type="url"
            placeholder={i === 0 ? "https://your-website.com" : `https://your-website.com/page-${i + 1}`}
            className="h-12 rounded-xl px-5 text-sm flex-1"
            style={{ background: "#EFEFEB", border: "1px solid #E4E4E2", boxShadow: "none", fontFamily: "var(--app-font-mono)" }}
            value={u}
            onChange={(e) => updateUrl(i, e.target.value)}
          />
          {urls.length > 1 && (
            <button
              type="button"
              onClick={() => removeUrl(i)}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border border-border hover:bg-destructive/10 hover:border-destructive/30 transition-colors text-muted-foreground hover:text-destructive"
              aria-label={`Remove URL ${i + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-3 pt-1">
        {urls.length < 10 && (
          <button
            type="button"
            onClick={addUrl}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors font-sans"
          >
            <Plus className="w-3.5 h-3.5" /> Add another URL
            <span className="text-muted-foreground font-normal">({urls.length}/10)</span>
          </button>
        )}
        <Button
          type="submit"
          className="btn-gsap h-12 px-8 text-sm font-semibold ml-auto"
          disabled={!urls.some((u) => u.trim())}
        >
          <Layers className="w-4 h-4 mr-2" /> Scan all pages →
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
    </form>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [, setLocation] = useLocation();

  const heroRef = useRef<HTMLElement>(null);
  const urgencyRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const statsRef = useSectionReveal<HTMLElement>();
  const servicesRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const toolsRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const processRef = useSectionReveal<HTMLElement>({ staggerSelector: ".reveal-child" });
  const ctaRef = useSectionReveal<HTMLElement>();

  useGsapButtonHover(pageRef);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const words = hero.querySelectorAll<HTMLElement>(".hero-word");
    const badge = hero.querySelector<HTMLElement>(".hero-badge");
    const subtitle = hero.querySelector<HTMLElement>(".hero-subtitle");
    const form = hero.querySelector<HTMLElement>(".hero-form");
    const disclaimer = hero.querySelector<HTMLElement>(".hero-disclaimer");
    const urgency = urgencyRef.current;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      const allEls = [urgency, badge, ...Array.from(words), subtitle, form, disclaimer].filter(Boolean);
      gsap.set(allEls, { y: 0 });
      const tween = gsap.from(allEls, { opacity: 0, duration: 0.4, ease: "none" });
      return () => { tween.kill(); };
    }

    gsap.set([words, badge, subtitle, form, disclaimer], { opacity: 0, y: 0 });
    gsap.set(words, { y: 60, opacity: 0 });
    if (urgency) gsap.set(urgency, { y: -40, opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (urgency) {
      tl.to(urgency, { y: 0, opacity: 1, duration: 0.5 });
    }
    if (badge) {
      tl.to(badge, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2");
    }
    tl.to(words, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 }, "-=0.2");
    if (subtitle) {
      tl.to(subtitle, { opacity: 1, y: 0, duration: 0.55 }, "-=0.3");
    }
    if (form) {
      tl.to(form, { opacity: 1, y: 0, duration: 0.5 }, "-=0.25");
    }
    if (disclaimer) {
      tl.to(disclaimer, { opacity: 1, y: 0, duration: 0.45 }, "-=0.2");
    }

    return () => { tl.kill(); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) setLocation(`/audit-result?url=${encodeURIComponent(url)}`);
  };

  return (
    <div ref={pageRef} className="flex flex-col w-full">

      {/* Urgency strip */}
      <div ref={urgencyRef} className="bg-foreground text-background py-2.5 px-4 text-center text-xs font-medium tracking-wide">
        <p style={{ fontFamily: "var(--app-font-mono)" }}>
          EAA enforcement began 28 June 2025.{" "}
          <Link href="/eaa" className="underline underline-offset-4 hover:text-primary transition-colors">
            Non-compliant products face fines up to €100,000 →
          </Link>
        </p>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="hero-gradient pt-24 pb-32 px-4 relative overflow-hidden">
        <ParticleCanvas />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold font-sans text-muted-foreground tracking-wide uppercase">EAA compliance audits</span>
          </div>
          <h1 className="text-display font-extrabold tracking-tight mb-4 text-foreground">
            <span className="hero-word inline-block">Can</span>{" "}
            <span className="hero-word heading-accent inline-block">everyone</span>
            <br className="hidden md:block" />
            <span className="hero-word inline-block">use</span>{" "}
            <span className="hero-word inline-block">your</span>{" "}
            <span className="hero-word inline-block">website?</span>
          </h1>

          <p className="hero-subtitle text-base text-muted-foreground mb-8 max-w-xl mx-auto" style={{ fontFamily: "var(--app-font-mono)" }}>
            Run a free WCAG 2.2 scan in 30 seconds — no account, no forms, just results.<br />
            Then talk to us when you need the manual audit that actually holds up in court.
          </p>

          {/* Mode toggle */}
          <div className="hero-form flex justify-center mb-5">
            <div className="inline-flex rounded-xl border border-border bg-white/60 p-1 gap-1">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all ${
                  mode === "single"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Single page
              </button>
              <button
                type="button"
                onClick={() => setMode("multi")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
                  mode === "multi"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Multiple pages
              </button>
            </div>
          </div>

          {mode === "single" ? (
            <>
              <form className="hero-form flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto" onSubmit={handleSubmit}>
                <label htmlFor="hero-url" className="sr-only">Your website URL</label>
                <Input
                  id="hero-url"
                  type="url"
                  placeholder="https://your-website.com"
                  className="h-14 rounded-xl px-5 text-sm flex-1"
                  style={{ background: "#EFEFEB", border: "1px solid #E4E4E2", boxShadow: "none", fontFamily: "var(--app-font-mono)" }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <Button type="submit" className="btn-gsap h-14 px-8 text-sm font-semibold shrink-0">
                  Scan my site →
                </Button>
              </form>
              <p className="hero-disclaimer mt-4 text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
                Powered by axe-core · WCAG 2.1 AA + 2.2 AA · No sign-up required
              </p>
            </>
          ) : (
            <>
              <MultiUrlForm />
              <p className="hero-disclaimer mt-4 text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
                Up to 10 pages · Scanned in parallel · Combined site-wide report
              </p>
            </>
          )}
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="border-y bg-white py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">1 in 6</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>Europeans lives with a disability</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">96.3%</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>of homepages have WCAG failures</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">€100k</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>maximum fine per violation</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">June 2025</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>EAA enforcement started</p>
            </div>
          </div>
        </div>
      </section>

      {/* What we do differently */}
      <section ref={servicesRef} className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-14">
            <h2 className="text-display-md font-extrabold text-foreground mb-4">
              Not another scanner.<br />
              <span className="heading-accent">An engineering team.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
              Automated tools catch ~30% of WCAG issues. We find the rest — through NVDA, VoiceOver, keyboard-only
              navigation, and 10+ years of screen reader quirks your CI pipeline will never see.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="w-5 h-5 text-primary" />,
                title: "Accessibility Audits",
                body: "Full WCAG 2.1/2.2 AA manual testing across desktop, mobile, and assistive technology. We document every failure with a reproducible test case and severity rating.",
                href: "/services/audits",
                cta: "Audit details",
              },
              {
                icon: <Code className="w-5 h-5 text-primary" />,
                title: "Code Remediation",
                body: "We don't hand you a spreadsheet and disappear. We submit PRs, write Jira tickets with exact diffs, and pair with your developers until the fixes are merged.",
                href: "/services/remediation",
                cta: "How we fix",
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-primary" />,
                title: "Continuous Monitoring",
                body: "Weekly re-scans and regression alerts mean regressions get caught before your release, not by a regulator six months later.",
                href: "/services/monitoring",
                cta: "Monitoring plans",
              },
            ].map(({ icon, title, body, href, cta }) => (
              <div
                key={title}
                className="reveal-child rounded-2xl border p-8 bg-background group service-card"
                style={{ transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  {icon}
                </div>
                <h3 className="text-lg font-bold mb-3 font-sans">{title}</h3>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed" style={{ fontFamily: "var(--app-font-mono)" }}>{body}</p>
                <Link href={href} className="text-primary font-semibold text-sm flex items-center gap-1.5 hover:gap-2.5 transition-all font-sans">
                  {cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools teaser */}
      <section ref={toolsRef} className="py-24 px-4 warm-section">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4 font-sans">Free developer tools</p>
              <h2 className="text-display-md font-extrabold text-foreground mb-5">
                See your site<br />
                <span className="heading-accent">how your users do.</span>
              </h2>
              <p className="text-muted-foreground mb-8 reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
                Seven browser-based tools. No install. Simulate colour blindness, tunnel vision,
                a screen reader's reading order, keyboard-only tab flow — or work through the
                full WCAG 2.1 AA checklist manually.
              </p>
              <Button asChild className="btn-gsap h-12 px-7 font-semibold">
                <Link href="/tools">Open the tools →</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Eye className="w-4 h-4" />, title: "Colour Blindness", desc: "Deuteranopia, Protanopia, Tritanopia, Achromatopsia" },
                { icon: <Eye className="w-4 h-4" />, title: "Low Vision", desc: "Blur, tunnel vision, central field loss" },
                { icon: <Search className="w-4 h-4" />, title: "Screen Reader", desc: "Heading structure, landmark order, ARIA issues" },
                { icon: <Keyboard className="w-4 h-4" />, title: "Keyboard Tester", desc: "Tab order, focus traps, visible focus rings" },
                { icon: <ShieldCheck className="w-4 h-4" />, title: "Contrast Checker", desc: "WCAG AA/AAA with EyeDropper colour picker" },
                { icon: <Smartphone className="w-4 h-4" />, title: "Mobile Checklist", desc: "iOS & Android with VoiceOver/TalkBack items" },
                { icon: <ClipboardList className="w-4 h-4" />, title: "WCAG 2.1 AA Checklist", desc: "50 success criteria — mark Pass, Fail, or N/A" },
              ].map(({ icon, title, desc }) => (
                <Link
                  key={title}
                  href="/tools"
                  className="reveal-child tool-card rounded-xl border p-4 bg-white cursor-pointer block"
                  style={{ transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
                >
                  <div className="text-primary mb-2">{icon}</div>
                  <p className="text-sm font-bold font-sans mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process — dark */}
      <section ref={processRef} className="py-24 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-display-md font-extrabold text-white mb-6">
                How an audit<br />
                <span style={{ color: "#FF4D1C", fontStyle: "italic", fontFamily: "var(--app-font-serif)" }}>actually works.</span>
              </h2>
              <p className="text-gray-400 mb-10 reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
                Four weeks from kick-off to signed statement of conformance. You stay in Jira — we work in your stack.
              </p>
              <div className="space-y-8">
                {[
                  { n: "01", title: "Scope & Baseline", body: "We map your critical user journeys (checkout, sign-up, account) and run automated scans to baseline the volume of issues." },
                  { n: "02", title: "Manual Testing", body: "NVDA on Windows, VoiceOver on iOS and macOS, keyboard-only navigation. We test every component state, not just the happy path." },
                  { n: "03", title: "Fix Delivery", body: "Exact code diffs, pull requests against your repo, and Jira tickets prioritised by WCAG impact level. Your developers merge; we verify." },
                  { n: "04", title: "Statement of Conformance", body: "A signed WCAG 2.2 AA conformance report you can publish in your accessibility statement and share with regulators." },
                ].map(({ n, title, body }) => (
                  <div key={n} className="reveal-child flex gap-5">
                    <div className="text-xs font-bold text-primary pt-0.5 shrink-0 w-6 font-sans">{n}</div>
                    <div>
                      <h4 className="font-bold text-sm text-white mb-1 font-sans">{title}</h4>
                      <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--app-font-mono)" }}>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal-child bg-[#111] rounded-2xl p-8 border border-white/10 sticky top-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-5 font-sans">EAA — who it covers</p>
              <p className="text-gray-400 mb-6 text-sm" style={{ fontFamily: "var(--app-font-mono)" }}>
                If you sell or operate a digital service in the EU — regardless of where you are incorporated — the EAA applies to you.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "E-commerce & retail (checkout, product pages)",
                  "Banking & financial services (online banking, apps)",
                  "Transportation & ticketing (booking flows)",
                  "Streaming & on-demand media (players, captions)",
                  "Telecoms (account portals, support)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-300 text-sm" style={{ fontFamily: "var(--app-font-mono)" }}>
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="btn-gsap w-full bg-transparent border-white/20 text-white hover:bg-white/5 hover:text-white rounded-xl [box-shadow:none]">
                <Link href="/eaa">Full EAA compliance guide →</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section ref={ctaRef} className="py-28 px-4 text-center hero-gradient relative overflow-hidden">
        <ParticleCanvas />
        <div className="container mx-auto max-w-3xl relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-6 font-sans">Get started</p>
          <h2 className="text-display-md font-extrabold mb-5">
            Enforcement is live.<br />
            <span className="heading-accent">Let's get you compliant.</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
            A 30-minute scope call with one of our engineers costs nothing. We'll tell you exactly what you're exposed to and what it takes to fix it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="btn-gsap h-14 px-10 text-sm font-bold">
              <Link href="/contact">Book a scope call →</Link>
            </Button>
            <Button asChild variant="outline" className="btn-gsap h-14 px-10 text-sm font-semibold rounded-xl [box-shadow:none]">
              <Link href="/services">See all services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
