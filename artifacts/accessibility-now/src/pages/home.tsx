import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2, Search, Code, ShieldCheck, Eye, Keyboard, Smartphone, ClipboardList, TabletSmartphone, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
    /** Viewport capture from scan (session only; not a repo file). */
    pageScreenshot?: string;
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

function HeroScanForm() {
  const [url, setUrl] = useState("");
  const [wholeSite, setWholeSite] = useState(false);
  const [multiViewport, setMultiViewport] = useState(true);
  const [strictProfile, setStrictProfile] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [urlStates, setUrlStates] = useState<UrlScanState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!wholeSite) {
      const params = new URLSearchParams();
      params.set("url", trimmed);
      params.set("rescan", String(Date.now()));
      if (strictProfile) params.set("profile", "strict");
      if (multiViewport) params.set("multiViewport", "1");
      setLocation(`/audit-result?${params.toString()}`);
      return;
    }

    setError(null);
    setScanning(true);
    setUrlStates([{ url: trimmed, status: "queued" }]);

    try {
      const res = await fetch(`${MULTI_SCAN_BASE}/api/audit/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          wholeSite: true,
          profile: strictProfile ? "strict" : "default",
          multiViewport,
        }),
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

      const states: UrlScanState[] = [{ url: trimmed, status: "queued" }];

      const ensureIndex = (index: number, pageUrl?: string) => {
        while (states.length <= index) {
          states.push({ url: pageUrl ?? `Page ${states.length + 1}`, status: "queued" });
        }
        if (pageUrl) states[index] = { ...states[index]!, url: pageUrl };
      };

      const patchIndex = (index: number, patch: Partial<UrlScanState>, pageUrl?: string) => {
        if (index < 0) return;
        ensureIndex(index, pageUrl);
        states[index] = { ...states[index]!, ...patch };
        setUrlStates([...states]);
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
              patchIndex(data.index, { status: "scanning" }, data.url);
            } else if (data.type === "page" && data.index != null) {
              patchIndex(data.index, {
                status: data.status === "success" ? "done" : "error",
                score: data.score,
                level: data.level,
                auditId: data.auditId,
                error: data.error,
              }, data.url);
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

      const payload = JSON.stringify(batchResult);
      try {
        sessionStorage.setItem(BATCH_STORAGE_KEY, payload);
      } catch {
        // Large JPEG data URLs can exceed sessionStorage quota; keep scores, drop previews only.
        const slim: BatchAuditResponse = {
          ...batchResult,
          pages: batchResult.pages.map((p) => {
            const copy = { ...p };
            delete copy.pageScreenshot;
            return copy;
          }),
        };
        sessionStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(slim));
      }
      setLocation("/batch-result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch scan failed. Please try again.");
      setScanning(false);
      setUrlStates([]);
    }
  }

  if (scanning && urlStates.length > 0) {
    const doneCount = urlStates.filter((s) => s.status === "done" || s.status === "error").length;
    const total = Math.max(urlStates.length, 1);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/70 border border-border rounded-2xl p-5 space-y-2.5">
          <p className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wide mb-3">
            {wholeSite ? "Discovering and scanning site" : "Scanning"} — {doneCount} of {total} complete
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
    <form onSubmit={handleSubmit} className="hero-form space-y-4 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
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
        <Button type="submit" className="btn-gsap h-14 px-8 text-sm font-semibold shrink-0" disabled={!url.trim()}>
          {wholeSite ? "Scan site →" : "Scan page →"}
        </Button>
      </div>

      <fieldset className="rounded-xl border border-border/80 bg-white/50 p-4 text-left space-y-3">
        <legend className="text-xs font-semibold font-sans px-1 text-muted-foreground uppercase tracking-wide">
          Scan options
        </legend>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={wholeSite} onCheckedChange={(v) => setWholeSite(v === true)} className="mt-0.5" />
          <span>
            <span className="font-semibold font-sans text-sm">Scan entire site</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Discovers up to 10 pages from sitemap or homepage links. Uncheck for a single page only.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={multiViewport} onCheckedChange={(v) => setMultiViewport(v === true)} className="mt-0.5" />
          <span>
            <span className="font-semibold font-sans text-sm">Mobile + desktop</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Runs checks at mobile and desktop breakpoints for higher reliability.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox checked={strictProfile} onCheckedChange={(v) => setStrictProfile(v === true)} className="mt-0.5" />
          <span>
            <span className="font-semibold font-sans text-sm">Stricter profile (BITV / BFSG)</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Adds AAA-oriented axe rules plus supplemental BITV 2.0 checks beyond axe-core alone.
            </span>
          </span>
        </label>
      </fieldset>

      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </form>
  );
}

export default function Home() {
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
            Free BITV 2.0 / BFSG scan against EN 301 549 — Playwright + axe-core + supplemental checks.<br />
            One page or whole site. No signup.
          </p>

          <HeroScanForm />
          <p className="hero-disclaimer mt-4 text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
            Cloudflare Browser Rendering ready · BITV 2.0 / BFSG mapping · axe-core + supplemental checks · scrolls before analysis
          </p>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="border-y bg-white py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">1 in 6</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>Europeans live with a disability</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">94.8%</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>of homepages fail WCAG (WebAIM '25)</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">€100k</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>max fine per violation (Germany)</p>
            </div>
            <div className="reveal-child">
              <p className="text-3xl font-extrabold font-sans text-foreground mb-1">June 2025</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>EAA enforcement started</p>
            </div>
          </div>
        </div>
      </section>

      {/* FixPilot promo */}
      <section className="py-10 px-4 bg-primary/5 border-y border-primary/10">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-primary/20 bg-white p-6 md:p-8">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1 font-sans">New · FixPilot</p>
                <h2 className="text-lg font-extrabold font-sans mb-2">Guided BFSG compliance — free</h2>
                <p className="text-sm text-muted-foreground max-w-xl" style={{ fontFamily: "var(--app-font-mono)" }}>
                  Scan your site, see every issue under Perceivable, Operable, Understandable, and Robust. Quick wins for your team, engineers when you need them.
                </p>
              </div>
            </div>
            <Button asChild className="btn-gsap h-12 px-8 font-semibold shrink-0">
              <Link href="/solutions/fixpilot">Try FixPilot →</Link>
            </Button>
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
              Automated checks cover part of WCAG. We cover the rest with NVDA, VoiceOver, keyboard-only runs, and the edge cases CI does not catch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Search className="w-5 h-5 text-primary" />,
                title: "Accessibility Audits",
                body: "WCAG 2.1/2.2 AA manual testing on desktop, mobile, and assistive tech. Findings come with repro steps and severity.",
                href: "/services/audits",
                cta: "Audit details",
              },
              {
                icon: <Code className="w-5 h-5 text-primary" />,
                title: "Code Remediation",
                body: "PRs and tickets with diffs, not a spreadsheet and silence. We pair with your team until fixes merge.",
                href: "/services/remediation",
                cta: "How we fix",
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-primary" />,
                title: "Continuous Monitoring",
                body: "Scheduled re-scans and regression alerts so issues surface in QA, not in a complaint months later.",
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
                Eight tools in the browser, colour vision, low vision, reading order, keyboard flow, focus order on a live capture. Nothing to install.
              </p>
              <Button asChild className="btn-gsap h-12 px-7 font-semibold">
                <Link href="/tools">Open the tools →</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: <Eye className="w-4 h-4" />, title: "Colour Blindness", desc: "Deuteranopia, Protanopia, Tritanopia, Achromatopsia" },
                { icon: <Search className="w-4 h-4" />, title: "Screen Reader", desc: "Heading structure, landmark order, ARIA" },
                { icon: <Keyboard className="w-4 h-4" />, title: "Keyboard Tester", desc: "Tab order, focus traps, visible focus" },
                { icon: <TabletSmartphone className="w-4 h-4" />, title: "Focus Order", desc: "Numbered Tab markers on a live screenshot" },
              ].map(({ icon, title, desc }) => (
                <Link
                  key={title}
                  href="/tools"
                  className="reveal-child tool-card rounded-2xl border p-4 sm:p-5 cursor-pointer block backdrop-blur-[2px]"
                  style={{ transition: "box-shadow 0.2s ease, transform 0.2s ease" }}
                >
                  <div className="w-9 h-9 rounded-xl bg-linear-to-br from-primary/12 to-amber-400/8 ring-1 ring-primary/10 flex items-center justify-center text-primary mb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    {icon}
                  </div>
                  <p className="text-sm font-bold font-sans mb-1.5 tracking-tight">{title}</p>
                  <p className="text-[11px] leading-snug text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process - dark */}
      <section ref={processRef} className="py-24 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-display-md font-extrabold text-white mb-6">
            How an audit<br />
            <span style={{ color: "#FF4D1C", fontStyle: "italic", fontFamily: "var(--app-font-serif)" }}>actually works.</span>
          </h2>
          <p className="text-gray-400 mb-12 reveal-body" style={{ fontFamily: "var(--app-font-mono)" }}>
            Four weeks. Kick-off to signed conformance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {[
              { n: "01", title: "Scope & baseline", body: "We map critical journeys, run automated scans." },
              { n: "02", title: "Manual testing", body: "NVDA, VoiceOver, keyboard-only. Every component state." },
              { n: "03", title: "Fix delivery", body: "PRs to your repo, Jira tickets ranked by WCAG impact." },
              { n: "04", title: "Conformance statement", body: "Signed WCAG 2.2 AA report for your accessibility statement." },
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
            Book a free 30-minute scope call. We will map risk and effort in plain language.
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
