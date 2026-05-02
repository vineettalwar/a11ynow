import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download } from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface VisionMode {
  id: string;
  label: string;
  description: string;
  recommendations: string[];
  blur: number;
  contrast: number;
  brightness: number;
  vignette: boolean;
  vignetteStrength: number;
  centralLoss: boolean;
}

const MODES: VisionMode[] = [
  {
    id: "normal",
    label: "Normal vision",
    description: "No impairment applied.",
    recommendations: [],
    blur: 0, contrast: 1, brightness: 1, vignette: false, vignetteStrength: 0, centralLoss: false,
  },
  {
    id: "moderate",
    label: "Moderate low vision",
    description: "Equivalent to approximately 6/18 visual acuity. Reading small text becomes difficult.",
    recommendations: ["Use at least 16px base font size", "Minimum 1.5× line height", "Avoid text in images"],
    blur: 1.5, contrast: 0.85, brightness: 0.95, vignette: false, vignetteStrength: 0, centralLoss: false,
  },
  {
    id: "severe",
    label: "Severe low vision",
    description: "Equivalent to approximately 6/60 visual acuity. Most details are lost without magnification.",
    recommendations: ["Large text toggle (200% scale)", "High contrast mode support", "Generous spacing (padding ≥ 12px)"],
    blur: 3.5, contrast: 0.7, brightness: 0.9, vignette: false, vignetteStrength: 0, centralLoss: false,
  },
  {
    id: "tunnel",
    label: "Tunnel vision",
    description: "Peripheral vision is lost. Only a narrow central area is visible (e.g. retinitis pigmentosa).",
    recommendations: ["Avoid important content at page edges", "Keep CTAs centred", "Don't rely on peripheral indicators"],
    blur: 0, contrast: 1, brightness: 1, vignette: true, vignetteStrength: 0.85, centralLoss: false,
  },
  {
    id: "macular",
    label: "Central field loss",
    description: "Central vision is lost (macular degeneration). Reading and face recognition are severely affected.",
    recommendations: ["Never embed critical content only in images", "Support high-zoom layouts", "Provide text alternatives for all visual content"],
    blur: 0, contrast: 0.9, brightness: 1, vignette: false, vignetteStrength: 0, centralLoss: true,
  },
];

type ImgState = "idle" | "loading" | "loaded" | "error";

function screenshotSrc(url: string) {
  return `${BASE_URL}/api/page-screenshot?url=${encodeURIComponent(url)}`;
}

async function downloadLowVision(
  src: string,
  label: string,
  blur: number,
  contrast: number,
  brightness: number,
  vignette: boolean,
  vignetteStrength: number,
  centralLoss: boolean,
) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;

  const filters: string[] = [];
  if (blur > 0) filters.push(`blur(${blur}px)`);
  if (contrast !== 1) filters.push(`contrast(${contrast})`);
  if (brightness !== 1) filters.push(`brightness(${brightness})`);
  ctx.filter = filters.length > 0 ? filters.join(" ") : "none";
  ctx.drawImage(img, 0, 0);
  ctx.filter = "none";

  if (vignette) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const rx = cx * (1 - vignetteStrength * 0.55);
    const ry = cy * (1 - vignetteStrength * 0.55);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(cx, cy));
    grad.addColorStop(0, "rgba(0,0,0,0)");
    const fadeStart = Math.min(rx / cx, ry / cy);
    grad.addColorStop(fadeStart, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${vignetteStrength * 0.98})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (centralLoss) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const rx = canvas.width * 0.22;
    const ry = canvas.height * 0.18;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    grad.addColorStop(0, "rgba(0,0,0,0.92)");
    grad.addColorStop(0.6, "rgba(0,0,0,0.5)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("toBlob returned null")); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label.toLowerCase().replace(/\s+/g, "-")}-simulation.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}

export default function LowVision() {
  const [url, setUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [screenshotSrcUrl, setScreenshotSrcUrl] = useState("");
  const [activeMode, setActiveMode] = useState("normal");
  const [blurOverride, setBlurOverride] = useState<number | null>(null);
  const [vignetteOverride, setVignetteOverride] = useState<number | null>(null);
  const [imgState, setImgState] = useState<ImgState>("idle");
  const [downloading, setDownloading] = useState(false);

  const mode = MODES.find((m) => m.id === activeMode)!;
  const blur = blurOverride ?? mode.blur;
  const vignetteStrength = vignetteOverride ?? mode.vignetteStrength;

  const imgStyle: React.CSSProperties = {
    filter: [
      blur > 0 ? `blur(${blur}px)` : "",
      mode.contrast !== 1 ? `contrast(${mode.contrast})` : "",
      mode.brightness !== 1 ? `brightness(${mode.brightness})` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    setBlurOverride(null);
    setVignetteOverride(null);
    setLoadedUrl(target);
    setScreenshotSrcUrl(screenshotSrc(target));
    setImgState("loading");
  };

  const handleModeChange = (id: string) => {
    setActiveMode(id);
    setBlurOverride(null);
    setVignetteOverride(null);
  };

  const handleDownload = async () => {
    if (!screenshotSrcUrl || imgState !== "loaded") return;
    setDownloading(true);
    try {
      await downloadLowVision(
        screenshotSrcUrl,
        mode.label,
        blur,
        mode.contrast,
        mode.brightness,
        mode.vignette,
        vignetteStrength,
        mode.centralLoss,
      );
    } catch {
      alert("Could not export the image. The screenshot server may need CORS headers enabled.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Low vision<br />
            <span className="heading-accent">simulator.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Apply CSS simulations of moderate and severe low vision, tunnel vision, and macular degeneration to any URL.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl space-y-8">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
            <label htmlFor="lv-url" className="sr-only">Website URL</label>
            <Input
              id="lv-url"
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

          <div className="flex flex-wrap gap-2" role="group" aria-label="Vision mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium font-sans transition-all border ${
                  activeMode === m.id
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground hover:text-foreground"
                }`}
                aria-pressed={activeMode === m.id}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode.id !== "normal" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(mode.blur > 0 || mode.id === "moderate" || mode.id === "severe") && (
                <div>
                  <label htmlFor="blur-slider" className="block text-xs font-semibold font-sans uppercase tracking-widest text-muted-foreground mb-2">
                    Blur intensity — {(blurOverride ?? mode.blur).toFixed(1)}px
                  </label>
                  <input
                    id="blur-slider"
                    type="range"
                    min={0}
                    max={8}
                    step={0.1}
                    value={blurOverride ?? mode.blur}
                    onChange={(e) => setBlurOverride(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                    aria-valuemin={0}
                    aria-valuemax={8}
                    aria-valuenow={blurOverride ?? mode.blur}
                  />
                </div>
              )}
              {mode.vignette && (
                <div>
                  <label htmlFor="vignette-slider" className="block text-xs font-semibold font-sans uppercase tracking-widest text-muted-foreground mb-2">
                    Tunnel strength — {Math.round((vignetteOverride ?? vignetteStrength) * 100)}%
                  </label>
                  <input
                    id="vignette-slider"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={vignetteOverride ?? vignetteStrength}
                    onChange={(e) => setVignetteOverride(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round((vignetteOverride ?? vignetteStrength) * 100)}
                  />
                </div>
              )}
            </div>
          )}

          {mode.id !== "normal" && (
            <div className="rounded-xl border p-5 bg-background flex gap-4">
              <div className="flex-1">
                <p className="text-sm font-bold font-sans mb-1">{mode.label}</p>
                <p className="text-xs text-muted-foreground mb-3">{mode.description}</p>
                {mode.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold font-sans mb-1.5">Design recommendations:</p>
                    <ul className="space-y-1">
                      {mode.recommendations.map((r) => (
                        <li key={r} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-primary shrink-0">→</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border overflow-hidden bg-muted relative min-h-[520px]">
            {!loadedUrl && (
              <div className="flex flex-col items-center justify-center h-[520px] text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-2xl">👓</span>
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
                {/* Hidden img drives state transition */}
                <img
                  key={screenshotSrcUrl}
                  src={screenshotSrcUrl}
                  alt=""
                  aria-hidden="true"
                  className="sr-only"
                  onLoad={() => setImgState("loaded")}
                  onError={() => setImgState("error")}
                />
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

            {loadedUrl && imgState === "loaded" && (
              <div className="relative">
                <img
                  src={screenshotSrcUrl}
                  alt={`${mode.label} simulation of ${loadedUrl}`}
                  className="w-full block"
                  style={imgStyle}
                  draggable={false}
                />
                {mode.vignette && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse ${100 - (vignetteOverride ?? vignetteStrength) * 55}% ${100 - (vignetteOverride ?? vignetteStrength) * 55}% at 50% 50%, transparent 0%, rgba(0,0,0,${(vignetteOverride ?? vignetteStrength) * 0.98}) 100%)`,
                    }}
                    aria-hidden="true"
                  />
                )}
                {mode.centralLoss && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "radial-gradient(ellipse 22% 18% at 50% 50%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
            )}
          </div>

          {imgState === "loaded" && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? "Exporting…" : "Download PNG"}
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
