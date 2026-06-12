"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolEmptyState } from "@/components/tools/tool-empty-state";
import { Loader2, Columns2, MonitorPlay, Download, Eye } from "lucide-react";
import { apiUrl } from "@/lib/api-base";
import { useToast } from "@/hooks/use-toast";

interface VisionType {
  id: string;
  label: string;
  description: string;
  prevalence: string | null;
  filter: string | null;
  matrix: number[] | null;
}

const VISION_TYPES: VisionType[] = [
  {
    id: "normal",
    label: "Normal vision",
    description: "No colour vision deficiency.",
    prevalence: null,
    filter: null,
    matrix: null,
  },
  {
    id: "deuteranopia",
    label: "Deuteranopia",
    description: "Red-green deficiency (green cone absent). Most common type.",
    prevalence: "~6% of males",
    filter:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='d'><feColorMatrix type='matrix' values='0.367 0.861 -0.228 0 0 0.280 0.673 0.047 0 0 -0.012 0.043 0.969 0 0 0 0 0 1 0'/></filter></svg>#d\")",
    matrix: [0.367, 0.861, -0.228, 0, 0, 0.280, 0.673, 0.047, 0, 0, -0.012, 0.043, 0.969, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: "protanopia",
    label: "Protanopia",
    description: "Red-green deficiency (red cone absent). Reds appear very dark.",
    prevalence: "~2% of males",
    filter:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='p'><feColorMatrix type='matrix' values='0.152 1.053 -0.205 0 0 0.115 0.786 0.099 0 0 -0.004 -0.048 1.052 0 0 0 0 0 1 0'/></filter></svg>#p\")",
    matrix: [0.152, 1.053, -0.205, 0, 0, 0.115, 0.786, 0.099, 0, 0, -0.004, -0.048, 1.052, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: "tritanopia",
    label: "Tritanopia",
    description: "Blue-yellow deficiency (blue cone absent). Blues appear green.",
    prevalence: "~0.003% of people",
    filter:
      "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'><filter id='t'><feColorMatrix type='matrix' values='1.256 -0.077 -0.179 0 0 -0.078 0.931 0.148 0 0 0.005 0.691 0.304 0 0 0 0 0 1 0'/></filter></svg>#t\")",
    matrix: [1.256, -0.077, -0.179, 0, 0, -0.078, 0.931, 0.148, 0, 0, 0.005, 0.691, 0.304, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: "achromatopsia",
    label: "Achromatopsia",
    description: "Complete colour blindness - the world appears in greyscale.",
    prevalence: "~0.003% of people",
    filter: "grayscale(1)",
    matrix: null,
  },
];

type ViewMode = "single" | "side-by-side";
type ImgState = "idle" | "loading" | "loaded" | "error";

function screenshotSrc(url: string) {
  return `${apiUrl("/api/page-screenshot")}?url=${encodeURIComponent(url)}`;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

async function downloadColourBlind(
  src: string,
  label: string,
  matrix: number[] | null,
  isGrayscale: boolean,
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

  if (matrix) {
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const rn = d[i] / 255;
      const gn = d[i + 1] / 255;
      const bn = d[i + 2] / 255;
      d[i]     = clamp((matrix[0] * rn + matrix[1] * gn + matrix[2] * bn + matrix[4]) * 255);
      d[i + 1] = clamp((matrix[5] * rn + matrix[6] * gn + matrix[7] * bn + matrix[9]) * 255);
      d[i + 2] = clamp((matrix[10] * rn + matrix[11] * gn + matrix[12] * bn + matrix[14]) * 255);
    }
    ctx.putImageData(imageData, 0, 0);
  } else if (isGrayscale) {
    ctx.filter = "grayscale(1)";
    ctx.drawImage(img, 0, 0);
  } else {
    ctx.drawImage(img, 0, 0);
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
  const { toast } = useToast();
  const searchParamsHook = useSearchParams();
  const search = searchParamsHook?.toString() ?? "";
  const [url, setUrl] = useState("");
  const [loadedUrl, setLoadedUrl] = useState("");
  const [screenshotSrcUrl, setScreenshotSrcUrl] = useState("");
  const [activeType, setActiveType] = useState("deuteranopia");
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [imgState, setImgState] = useState<ImgState>("idle");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(search);
    const u = q.get("url");
    if (u?.trim()) setUrl(decodeURIComponent(u.trim()));
  }, [search]);

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

  const handleDownload = async () => {
    if (!screenshotSrcUrl || imgState !== "loaded") return;
    setDownloading(true);
    try {
      await downloadColourBlind(
        screenshotSrcUrl,
        active.label,
        active.matrix,
        active.id === "achromatopsia",
      );
    } catch {
      toast({
        title: "Export failed",
        description: "Could not export the image. The screenshot server may need CORS headers enabled.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ToolPageLayout
      eyebrow="Live URL · Four simulations"
      title={
        <>
          Colour blindness<br />
          <span className="heading-accent">simulator.</span>
        </>
      }
      description="Enter any URL and see it through four types of colour vision deficiency. Toggle between simulated-only and side-by-side comparison."
      contentMaxWidth="max-w-5xl"
      innerClassName="space-y-8"
    >
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
              <div className="flex flex-col items-center justify-center min-h-[520px] px-4 py-10">
                <ToolEmptyState
                  className="max-w-lg w-full"
                  icon={Eye}
                  title="Enter a URL above to begin"
                  description="A screenshot of the page is captured server-side and displayed here with the selected vision simulation applied via CSS filters."
                />
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

            {/* Hidden loader img - drives loading/error state */}
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {VISION_TYPES.filter((v) => v.prevalence).map((v) => (
              <div key={v.id} className="rounded-xl border p-5 bg-background">
                <p className="text-xs font-bold font-sans mb-1">{v.label}</p>
                <p className="text-xs text-primary font-semibold font-sans mb-2">{v.prevalence}</p>
                <p className="text-xs text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
    </ToolPageLayout>
  );
}
