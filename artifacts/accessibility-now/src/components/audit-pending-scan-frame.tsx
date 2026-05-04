import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Globe } from "lucide-react";

const APP_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function pageScreenshotPreviewSrc(url: string): string {
  return `${APP_BASE}/api/page-screenshot?url=${encodeURIComponent(url)}`;
}

const HOTSPOTS: { top: string; left?: string; right?: string; tag: string }[] = [
  { top: "12%", left: "10%", tag: "Contrast" },
  { top: "34%", right: "14%", tag: "Labels" },
  { top: "48%", left: "20%", tag: "Focus order" },
  { top: "68%", right: "10%", tag: "Alt text" },
];

function safeUrlParts(raw: string): { href: string; host: string } | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    u.hash = "";
    return { href: u.href, host: u.hostname };
  } catch {
    return null;
  }
}

/**
 * HUD-style “scanner” viewport: staged page chrome, top-to-bottom beam, issue hotspots.
 */
export function AuditPendingScanFrame({ displayUrl }: { displayUrl: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const wireframeRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLImageElement>(null);

  const parsed = useMemo(() => safeUrlParts(displayUrl), [displayUrl]);
  const faviconSrc = parsed
    ? `https://icons.duckduckgo.com/ip3/${encodeURIComponent(parsed.host)}.ico`
    : null;

  const previewSrc = parsed ? pageScreenshotPreviewSrc(parsed.href) : null;
  const [thumbState, setThumbState] = useState<"none" | "loading" | "loaded" | "error">(
    previewSrc ? "loading" : "none",
  );

  useEffect(() => {
    setThumbState(previewSrc ? "loading" : "none");
  }, [previewSrc]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const vp = viewportRef.current;
    const beam = beamRef.current;
    if (!root || !vp || !beam) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const layers = root.querySelectorAll<HTMLElement>(".audit-preview-reveal");
    const hotspots = root.querySelectorAll<HTMLElement>(".audit-scan-hotspot");
    const thumb = thumbRef.current;

    if (reduced) {
      gsap.set(layers, { opacity: 1, y: 0 });
      gsap.set(beam, { top: "50%", opacity: 0.5 });
      gsap.set(hotspots, { opacity: 0.85, scale: 1 });
      if (thumb) gsap.set(thumb, { opacity: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(layers, { opacity: 0, y: 10 });
      gsap.fromTo(
        layers,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.11,
          ease: "power2.out",
          delay: 0.12,
        },
      );

      gsap.set(beam, { top: -3 });
      if (thumb) gsap.set(thumb, { opacity: 0 });

      const h = Math.max(vp.getBoundingClientRect().height, 160);
      const beamH = 3;
      const dur = 2.35;
      const flashAt = [0.12, 0.34, 0.5, 0.7];

      const tl = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });
      tl.set(hotspots, { opacity: 0.4, scale: 1 }, 0);
      tl.fromTo(beam, { top: -beamH }, { top: h - beamH, duration: dur }, 0);
      hotspots.forEach((el, i) => {
        const t = dur * (flashAt[i] ?? 0.2 + i * 0.18);
        tl.to(el, { opacity: 1, scale: 1.15, duration: 0.06 }, t);
        tl.to(
          el,
          {
            opacity: 0.45,
            scale: 1,
            duration: 0.28,
            ease: "power2.out",
          },
          t + 0.08,
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (thumbState !== "loaded") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const thumb = thumbRef.current;
    const wire = wireframeRef.current;
    if (!thumb || !wire) return;

    if (reduced) {
      gsap.set(thumb, { opacity: 1 });
      gsap.set(wire, { opacity: 0 });
      return;
    }

    gsap.to(thumb, { opacity: 1, duration: 0.85, ease: "power2.out" });
    gsap.to(wire, { opacity: 0, duration: 0.65, ease: "power2.inOut", delay: 0.05 });
  }, [thumbState]);

  return (
    <div
      ref={rootRef}
      className="w-full max-w-lg mx-auto select-none"
      aria-hidden
    >
      <div className="relative rounded-md bg-[#050608] p-3 sm:p-4 shadow-[0_0_0_1px_rgba(52,211,153,0.25),0_24px_48px_-12px_rgba(0,0,0,0.45)] ring-1 ring-emerald-500/30">
        {/* Corner brackets */}
        <span className="pointer-events-none absolute -left-px -top-px z-20 h-8 w-8 border-l-[3px] border-t-[3px] border-emerald-400" />
        <span className="pointer-events-none absolute -right-px -top-px z-20 h-8 w-8 border-r-[3px] border-t-[3px] border-emerald-400" />
        <span className="pointer-events-none absolute -bottom-px -left-px z-20 h-8 w-8 border-b-[3px] border-l-[3px] border-emerald-400" />
        <span className="pointer-events-none absolute -bottom-px -right-px z-20 h-8 w-8 border-b-[3px] border-r-[3px] border-emerald-400" />

        {/* Chrome bar */}
        <div className="audit-preview-reveal mb-2 flex items-center gap-2 rounded border border-white/10 bg-black/55 px-2.5 py-1.5">
          {faviconSrc ? (
            <img
              src={faviconSrc}
              alt=""
              className="h-4 w-4 shrink-0 rounded-sm opacity-80"
              width={16}
              height={16}
              decoding="async"
            />
          ) : (
            <Globe className="h-4 w-4 shrink-0 text-emerald-500/80" aria-hidden />
          )}
          <span className="min-w-0 truncate font-mono text-[11px] text-emerald-300/90">
            {parsed?.href ?? displayUrl}
          </span>
        </div>

        {/* Viewport */}
        <div
          ref={viewportRef}
          className="audit-scan-viewport relative aspect-4/3 w-full overflow-hidden rounded-sm border border-emerald-500/20 bg-linear-to-b from-zinc-900 via-[#0a0b0f] to-black"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(52,211,153,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.4) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
            aria-hidden
          />

          {previewSrc ? (
            <img
              ref={thumbRef}
              src={previewSrc}
              alt=""
              width={1280}
              height={900}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="pointer-events-none absolute inset-0 z-1 h-full w-full object-cover object-top opacity-0"
              onLoad={() => setThumbState("loaded")}
              onError={() => setThumbState("error")}
            />
          ) : null}

          {/* Abstract “page” (placeholder until live preview loads) */}
          <div ref={wireframeRef} className="absolute inset-0 z-2 p-3 sm:p-4">
            <div className="audit-preview-reveal mb-3 flex gap-2">
              <div className="h-2 w-14 rounded-sm bg-white/12" />
              <div className="h-2 w-10 rounded-sm bg-white/10" />
              <div className="h-2 w-16 rounded-sm bg-white/10" />
            </div>
            <div className="audit-preview-reveal mb-2 h-3 w-[72%] rounded-sm bg-white/15" />
            <div className="audit-preview-reveal mb-2 h-2 w-[55%] rounded-sm bg-white/10" />
            <div className="audit-preview-reveal mb-4 h-2 w-[40%] rounded-sm bg-white/8" />
            <div className="audit-preview-reveal flex gap-2">
              <div className="h-16 flex-1 rounded border border-white/8 bg-white/4" />
              <div className="h-16 flex-1 rounded border border-white/8 bg-white/4" />
            </div>
            <div className="audit-preview-reveal mt-3 h-2 w-full rounded-sm bg-white/6" />
            <div className="audit-preview-reveal mt-1.5 h-2 w-[88%] rounded-sm bg-white/5" />
          </div>

          {HOTSPOTS.map((h, i) => (
            <div
              key={`${h.tag}-${i}`}
              className="audit-scan-hotspot pointer-events-none absolute z-10 flex flex-col items-center gap-0.5"
              style={{ top: h.top, left: h.left, right: h.right }}
            >
              <span className="rounded-sm border border-primary/80 bg-primary/25 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-primary-foreground shadow-[0_0_12px_hsl(13_100%_55%/0.45)]">
                {h.tag}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(13_100%_55%/0.9)]" />
            </div>
          ))}

          <div
            ref={beamRef}
            className="audit-frame-beam pointer-events-none absolute left-0 right-0 z-20"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
