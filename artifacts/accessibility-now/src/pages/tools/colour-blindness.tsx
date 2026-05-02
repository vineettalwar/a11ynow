import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Columns2, MonitorPlay } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const VISION_TYPES = [
  {
    id: "normal",
    label: "Normal vision",
    description: "No colour vision deficiency.",
    prevalence: null,
    filter: null,
  },
  {
    id: "deuteranopia",
    label: "Deuteranopia",
    description: "Red-green deficiency (green cone absent). Most common type.",
    prevalence: "~6% of males",
    filter:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='d'><feColorMatrix type='matrix' values='0.367 0.861 -0.228 0 0 0.280 0.673 0.047 0 0 -0.012 0.043 0.969 0 0 0 0 0 1 0'/></filter></svg>#d\")",
  },
  {
    id: "protanopia",
    label: "Protanopia",
    description: "Red-green deficiency (red cone absent). Reds appear very dark.",
    prevalence: "~2% of males",
    filter:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='p'><feColorMatrix type='matrix' values='0.152 1.053 -0.205 0 0 0.115 0.786 0.099 0 0 -0.004 -0.048 1.052 0 0 0 0 0 1 0'/></filter></svg>#p\")",
  },
  {
    id: "tritanopia",
    label: "Tritanopia",
    description: "Blue-yellow deficiency (blue cone absent). Blues appear green.",
    prevalence: "~0.003% of people",
    filter:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='t'><feColorMatrix type='matrix' values='1.256 -0.077 -0.179 0 0 -0.078 0.931 0.148 0 0 0.005 0.691 0.304 0 0 0 0 0 1 0'/></filter></svg>#t\")",
  },
  {
    id: "achromatopsia",
    label: "Achromatopsia",
    description: "Complete colour blindness — the world appears in greyscale.",
    prevalence: "~0.003% of people",
    filter: "grayscale(1)",
  },
];

type ViewMode = "single" | "side-by-side";
type ImgState = "idle" | "loading" | "loaded" | "error";

function screenshotSrc(url: string) {
  return `${BASE_URL}/api/page-screenshot?url=${encodeURIComponent(url)}`;
}

interface SimImageProps {
  src: string;
  filter: string | null;
  label: string;
  onLoad: () => void;
  onError: () => void;
}

function SimImage({ src, filter, label, onLoad, onError }: SimImageProps) {
  return (
    <img
      src={src}
      alt={label}
      className="w-full h-full object-cover object-top"
      style={filter ? { filter } : undefined}
      onLoad={onLoad}
      onError={onError}
      draggable={false}
    />
  );
}

export default function ColourBlindness() {
  const [url, setUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [screenshotSrcUrl, setScreenshotSrcUrl] = useState("");
  const [activeType, setActiveType] = useState("deuteranopia");
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [imgState, setImgState] = useState<ImgState>("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    setLoadedUrl(target);
    setScreenshotSrcUrl(screenshotSrc(target));
    setImgState("loading");
  };

  const active = VISION_TYPES.find((v) => v.id === activeType)!;

  return (
    <div className="flex flex-col w-full">
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
            <Button type="submit" className="h-12 px-6" disabled={imgState === "loading"}>
              {imgState === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simulate →"}
            </Button>
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
            {!loadedUrl && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">👁</span>
                </div>
                <p className="text-sm font-semibold font-sans mb-1">Enter a URL above to begin</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  A screenshot of the page is captured server-side and displayed here with the selected vision simulation applied via CSS filters.
                </p>
              </div>
            )}

            {imgState === "loading" && loadedUrl && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-sm font-semibold font-sans">Capturing screenshot…</p>
                <p className="text-xs text-muted-foreground mt-1">This usually takes 5–15 seconds</p>
              </div>
            )}

            {imgState === "error" && loadedUrl && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <p className="text-sm font-semibold font-sans text-destructive mb-1">Could not capture this page</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  The page may be unreachable, require authentication, or block automated browsers.
                </p>
              </div>
            )}

            {loadedUrl && imgState === "loaded" && viewMode === "single" && (
              <div className="h-[520px] overflow-hidden">
                <SimImage
                  src={screenshotSrcUrl}
                  filter={active.filter}
                  label={`${active.label} simulation of ${loadedUrl}`}
                  onLoad={() => setImgState("loaded")}
                  onError={() => setImgState("error")}
                />
              </div>
            )}

            {loadedUrl && imgState === "loaded" && viewMode === "side-by-side" && (
              <div className="flex h-[400px]">
                <div className="flex-1 flex flex-col border-r overflow-hidden">
                  <div className="px-3 py-1.5 border-b bg-background text-xs font-medium font-sans text-muted-foreground shrink-0">
                    Normal vision
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <SimImage
                      src={screenshotSrcUrl}
                      filter={null}
                      label={`Normal vision view of ${loadedUrl}`}
                      onLoad={() => {}}
                      onError={() => {}}
                    />
                  </div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-3 py-1.5 border-b bg-background text-xs font-medium font-sans text-muted-foreground shrink-0">
                    {active.label}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <SimImage
                      src={screenshotSrcUrl}
                      filter={active.filter}
                      label={`${active.label} simulation of ${loadedUrl}`}
                      onLoad={() => {}}
                      onError={() => {}}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hidden loader img — drives loading/error state */}
            {loadedUrl && imgState !== "loaded" && imgState !== "error" && (
              <img
                key={screenshotSrcUrl}
                src={screenshotSrcUrl}
                alt=""
                aria-hidden="true"
                className="sr-only"
                onLoad={() => setImgState("loaded")}
                onError={() => setImgState("error")}
              />
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
