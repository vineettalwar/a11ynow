import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

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

export default function ColourBlindness() {
  const [url, setUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [activeType, setActiveType] = useState("normal");
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    setIframeError(false);
    setLoadedUrl(target);
  };

  const active = VISION_TYPES.find((v) => v.id === activeType)!;
  const filterId = `cb-filter-${activeType}`;

  return (
    <div className="flex flex-col w-full">
      {active.matrix && (
        <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
          <defs>
            {VISION_TYPES.filter((v) => v.matrix).map((v) => (
              <filter key={v.id} id={`cb-filter-${v.id}`} colorInterpolationFilters="sRGB">
                <feColorMatrix type="matrix" values={v.matrix!} />
              </filter>
            ))}
          </defs>
        </svg>
      )}

      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Colour blindness<br />
            <span className="heading-accent">simulator.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Enter any URL and see it through four types of colour vision deficiency. Filters are applied to the rendered page output.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl space-y-8">
          <form onSubmit={handleLoad} className="flex gap-3 max-w-2xl">
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

          {active && (
            <div className="rounded-xl border p-4 bg-background flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold font-sans">{active.label}</p>
                <p className="text-xs text-muted-foreground">{active.description}{active.prevalence ? ` Affects ${active.prevalence}.` : ""}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border overflow-hidden bg-muted min-h-[520px] relative">
            {!loadedUrl && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">👁</span>
                </div>
                <p className="text-sm font-semibold font-sans mb-1">Enter a URL above to begin</p>
                <p className="text-xs text-muted-foreground max-w-sm">The page will be rendered in this frame and you can toggle between vision types in real-time.</p>
              </div>
            )}

            {loadedUrl && iframeError && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <AlertTriangle className="w-10 h-10 text-primary mb-4" />
                <p className="text-sm font-bold font-sans mb-2">Site blocks embedding</p>
                <p className="text-xs text-muted-foreground max-w-sm mb-4">
                  This site uses <code className="font-mono bg-muted px-1 py-0.5 rounded">X-Frame-Options</code> or a Content Security Policy that prevents iframes. Many large sites do this.
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  To simulate colour blindness on these sites, use a browser extension such as <strong>Colorblindly</strong> (Chrome) or <strong>Color Oracle</strong> (desktop app).
                </p>
              </div>
            )}

            {loadedUrl && !iframeError && (
              <iframe
                ref={iframeRef}
                key={loadedUrl}
                src={loadedUrl}
                title={`${active.label} simulation of ${loadedUrl}`}
                className="w-full border-0 h-[520px] block"
                style={
                  active.matrix
                    ? { filter: `url(#${filterId})` }
                    : {}
                }
                onError={() => setIframeError(true)}
                onLoad={() => {
                  try {
                    const doc = iframeRef.current?.contentDocument;
                    if (!doc || doc.location.href === "about:blank") setIframeError(true);
                  } catch {
                    setIframeError(true);
                  }
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
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
