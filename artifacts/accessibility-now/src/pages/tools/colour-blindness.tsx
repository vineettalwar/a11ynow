import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Columns2, MonitorPlay } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const VISION_TYPES = [
  {
    id: "normal",
    label: "Normal vision",
    description: "No colour vision deficiency.",
    prevalence: null,
    matrix: null,
  },
  {
    id: "deuteranopia",
    label: "Deuteranopia",
    description: "Red-green deficiency (green cone absent). Most common type.",
    prevalence: "~6% of males",
    matrix: "0.367 0.861 -0.228 0 0   0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0   0 0 0 1 0",
  },
  {
    id: "protanopia",
    label: "Protanopia",
    description: "Red-green deficiency (red cone absent). Reds appear very dark.",
    prevalence: "~2% of males",
    matrix: "0.152 1.053 -0.205 0 0   0.115 0.786 0.099 0 0  -0.004 -0.048 1.052 0 0   0 0 0 1 0",
  },
  {
    id: "tritanopia",
    label: "Tritanopia",
    description: "Blue-yellow deficiency (blue cone absent). Blues appear green.",
    prevalence: "~0.003% of people",
    matrix: "1.256 -0.077 -0.179 0 0  -0.078 0.931 0.148 0 0   0.005 0.691 0.304 0 0   0 0 0 1 0",
  },
  {
    id: "achromatopsia",
    label: "Achromatopsia",
    description: "Complete colour blindness — the world appears in greyscale.",
    prevalence: "~0.003% of people",
    matrix: "0.299 0.587 0.114 0 0   0.299 0.587 0.114 0 0   0.299 0.587 0.114 0 0   0 0 0 1 0",
  },
];

type ViewMode = "single" | "side-by-side";
type EmbedState = "idle" | "loading" | "ok" | "blocked";

function proxyUrl(target: string) {
  return `${BASE_URL}/api/iframe-proxy?url=${encodeURIComponent(target)}`;
}

function IframePanel({
  proxyTarget,
  title,
  filter,
  onStateChange,
}: {
  proxyTarget: string;
  title: string;
  filter?: string;
  onStateChange: (s: EmbedState) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "__a11y_proxy_error") {
        if (timerRef.current) clearTimeout(timerRef.current);
        onStateChange("blocked");
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onStateChange]);

  const handleLoad = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onStateChange("ok");
  }, [onStateChange]);

  const handleError = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onStateChange("blocked");
  }, [onStateChange]);

  return (
    <iframe
      key={proxyTarget}
      src={proxyTarget}
      title={title}
      className="w-full border-0 h-full block"
      style={filter ? { filter } : undefined}
      onLoad={handleLoad}
      onError={handleError}
      sandbox="allow-scripts allow-forms allow-popups"
      aria-label={title}
    />
  );
}

export default function ColourBlindness() {
  const [url, setUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [activeType, setActiveType] = useState("deuteranopia");
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [embedState, setEmbedState] = useState<EmbedState>("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    setEmbedState("loading");
    setLoadedUrl(target);
  };

  const handleStateChange = useCallback((s: EmbedState) => {
    setEmbedState((prev) => (prev === "blocked" ? "blocked" : s));
  }, []);

  const active = VISION_TYPES.find((v) => v.id === activeType)!;
  const svgFilterId = `cb-filter-${activeType}`;
  const filterCss = active.matrix ? `url(#${svgFilterId})` : undefined;
  const proxiedUrl = loadedUrl ? proxyUrl(loadedUrl) : "";

  return (
    <div className="flex flex-col w-full">
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
        <defs>
          {VISION_TYPES.filter((v) => v.matrix).map((v) => (
            <filter key={v.id} id={`cb-filter-${v.id}`} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={v.matrix!} />
            </filter>
          ))}
        </defs>
      </svg>

      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Colour blindness<br />
            <span className="heading-accent">simulator.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Enter any URL and see it through four types of colour vision deficiency. Toggle between simulated-only and side-by-side comparison.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl space-y-8">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
            <label htmlFor="cb-url" className="sr-only">Website URL</label>
            <Input
              id="cb-url"
              type="url"
              placeholder="https://your-website.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 flex-1"
            />
            <Button type="submit" className="h-12 px-6">Simulate →</Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Vision type">
              {VISION_TYPES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setActiveType(v.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium font-sans transition-all border ${
                    activeType === v.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                  }`}
                  aria-pressed={activeType === v.id}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="flex rounded-xl border overflow-hidden ml-auto shrink-0" role="group" aria-label="View mode">
              <button
                onClick={() => setViewMode("single")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-sans transition-colors ${
                  viewMode === "single" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={viewMode === "single"}
                title="Single view"
              >
                <MonitorPlay className="w-3.5 h-3.5" /> Single
              </button>
              <button
                onClick={() => setViewMode("side-by-side")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-sans transition-colors ${
                  viewMode === "side-by-side" ? "bg-foreground text-background" : "bg-background text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={viewMode === "side-by-side"}
                title="Side-by-side: normal vs simulated"
              >
                <Columns2 className="w-3.5 h-3.5" /> Compare
              </button>
            </div>
          </div>

          {active && (
            <div className="rounded-xl border p-4 bg-background">
              <p className="text-sm font-bold font-sans">{active.label}</p>
              <p className="text-xs text-muted-foreground">
                {active.description}
                {active.prevalence ? ` Affects ${active.prevalence}.` : ""}
              </p>
            </div>
          )}

          <div className={`rounded-2xl border overflow-hidden bg-muted relative ${viewMode === "side-by-side" ? "min-h-[400px]" : "min-h-[520px]"}`}>
            {embedState === "idle" && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">👁</span>
                </div>
                <p className="text-sm font-semibold font-sans mb-1">Enter a URL above to begin</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  The page renders here with the selected vision simulation applied. Use Compare mode to see normal vs simulated side-by-side.
                </p>
              </div>
            )}

            {embedState === "loading" && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-sm text-muted-foreground font-sans">Loading page…</p>
              </div>
            )}

            {embedState === "blocked" && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <AlertTriangle className="w-10 h-10 text-primary mb-4" />
                <p className="text-sm font-bold font-sans mb-2">Could not load page</p>
                <p className="text-xs text-muted-foreground max-w-sm mb-4">
                  The page could not be fetched — it may block automated access or require a login.
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Use a browser extension such as <strong>Colorblindly</strong> (Chrome) or <strong>Color Oracle</strong> (desktop app) to simulate colour blindness on these pages.
                </p>
              </div>
            )}

            {loadedUrl && embedState !== "idle" && embedState !== "blocked" && viewMode === "single" && (
              <div className={`h-[520px] ${embedState === "loading" ? "absolute inset-0" : ""}`}>
                <IframePanel
                  proxyTarget={proxiedUrl}
                  title={`${active.label} simulation of ${loadedUrl}`}
                  filter={filterCss}
                  onStateChange={handleStateChange}
                />
              </div>
            )}

            {loadedUrl && embedState !== "idle" && embedState !== "blocked" && viewMode === "side-by-side" && (
              <div className={`flex h-[400px] ${embedState === "loading" ? "absolute inset-0" : ""}`}>
                <div className="flex-1 flex flex-col border-r overflow-hidden">
                  <div className="px-3 py-1.5 border-b bg-background text-xs font-medium font-sans text-muted-foreground shrink-0">
                    Normal vision
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <IframePanel
                      proxyTarget={proxiedUrl}
                      title={`Normal vision view of ${loadedUrl}`}
                      onStateChange={handleStateChange}
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-3 py-1.5 border-b bg-background text-xs font-medium font-sans text-muted-foreground shrink-0">
                    {active.label}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <IframePanel
                      proxyTarget={`${proxiedUrl}&panel=simulated`}
                      title={`${active.label} simulation of ${loadedUrl}`}
                      filter={filterCss}
                      onStateChange={handleStateChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {VISION_TYPES.filter((v) => v.prevalence).map((v) => (
              <div key={v.id} className="rounded-xl border p-5 bg-background">
                <p className="text-xs font-bold font-sans mb-1">{v.label}</p>
                <p className="text-xs text-primary font-semibold font-sans mb-2">{v.prevalence}</p>
                <p className="text-xs text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
