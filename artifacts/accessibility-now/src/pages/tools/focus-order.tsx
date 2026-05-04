import { useState, useRef, useCallback, useEffect } from "react";
import { useSearch } from "wouter";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolEmptyState } from "@/components/tools/tool-empty-state";
import { Loader2, Download, AlertTriangle, CheckCircle2, TabletSmartphone } from "lucide-react";

type ElementType = "link" | "button" | "input" | "select" | "textarea" | "other";

interface FocusableElement {
  index: number;
  type: ElementType;
  tag: string;
  role: string;
  name: string;
  tabIndex: number;
  rect: { x: number; y: number; width: number; height: number };
  issues: string[];
}

interface FocusOrderResult {
  url: string;
  screenshotBase64: string;
  pageWidth: number;
  pageHeight: number;
  elements: FocusableElement[];
  hasSkipLink: boolean;
}

/** Marker colour on screenshot overlay (must stay distinct per type). */
const TYPE_MARKER_DOT: Record<ElementType, string> = {
  link: "#0ea5e9",
  button: "#f97316",
  input: "#22c55e",
  select: "#a855f7",
  textarea: "#14b8a6",
  other: "#ca8a04",
};

const TYPE_BADGE_CLASS =
  "bg-muted/80 text-foreground border border-border/90 px-1.5 py-0.5 rounded text-xs font-semibold font-sans shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]";

const TYPE_LABELS: Record<ElementType, string> = {
  link: "Link",
  button: "Button",
  input: "Input",
  select: "Select",
  textarea: "Textarea",
  other: "Other",
};

function TypeLegendChips() {
  return (
    <ul
      className="m-0 flex list-none flex-wrap justify-center gap-2.5 p-0 sm:gap-3"
      aria-label="Marker colours by element type"
    >
      {(Object.keys(TYPE_MARKER_DOT) as ElementType[]).map((t) => (
        <li key={t}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-linear-to-b from-white to-[hsl(40_18%_97%)] px-3.5 py-1.5 text-xs font-semibold font-sans text-foreground shadow-sm ring-1 ring-black/4">
            <span
              className="size-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-white"
              style={{ background: TYPE_MARKER_DOT[t] }}
              aria-hidden
            />
            {TYPE_LABELS[t]}
          </span>
        </li>
      ))}
    </ul>
  );
}

const SVG_MARKER_R = 12;
const SVG_FONT_SIZE = 11;

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function buildAnnotatedCanvas(
  img: HTMLImageElement,
  elements: FocusableElement[],
  pageWidth: number,
  pageHeight: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const scaleX = img.naturalWidth / pageWidth;
  const scaleY = img.naturalHeight / pageHeight;

  elements.forEach((el) => {
    const color = TYPE_MARKER_DOT[el.type] ?? "#888";
    const cx = (el.rect.x + el.rect.width / 2) * scaleX;
    const cy = el.rect.y * scaleY + SVG_MARKER_R + 2;

    ctx.beginPath();
    ctx.arc(cx, cy, SVG_MARKER_R, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = `bold ${SVG_FONT_SIZE}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(el.index), cx, cy);
  });

  return canvas;
}

export default function FocusOrderVisualizer() {
  const search = useSearch();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FocusOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ElementType | "all">("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(search);
    const u = q.get("url");
    if (u?.trim()) setUrl(decodeURIComponent(u.trim()));
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    setLoading(true);
    setError(null);
    setResult(null);
    setFilter("all");
    setHoveredIndex(null);
    try {
      const resp = await fetch(`${BASE_URL}/api/focus-order?url=${encodeURIComponent(target)}`);
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || "Could not analyse focus order.");
      }
      const data: FocusOrderResult = await resp.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!result || !imgRef.current) return;
    const img = imgRef.current;
    const canvas = buildAnnotatedCanvas(img, result.elements, result.pageWidth, result.pageHeight);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    const hostname = new URL(result.url).hostname.replace(/\./g, "-");
    link.download = `focus-order-${hostname}.png`;
    link.click();
  }, [result]);

  const displayed = result
    ? filter === "all"
      ? result.elements
      : result.elements.filter((el) => el.type === filter)
    : [];

  const issueCount = result ? result.elements.filter((el) => el.issues.length > 0).length : 0;
  const typeCounts = result
    ? (Object.keys(TYPE_MARKER_DOT) as ElementType[]).reduce<Record<ElementType, number>>(
        (acc, t) => ({ ...acc, [t]: result.elements.filter((el) => el.type === t).length }),
        {} as Record<ElementType, number>,
      )
    : null;

  const imgSrc = result ? `data:image/png;base64,${result.screenshotBase64}` : null;

  return (
    <ToolPageLayout
      eyebrow="Screenshot · Tab order API"
      title={
        <>
          Focus order<br />
          <span className="heading-accent">visualizer.</span>
        </>
      }
      description="Enter a URL to capture a screenshot and overlay numbered markers showing the keyboard Tab order of every interactive element - colour-coded by type."
      contentMaxWidth="max-w-6xl"
      innerClassName="space-y-10"
    >
          <div className="max-w-3xl rounded-2xl border border-[rgba(210,198,178,0.45)] bg-linear-to-b from-white/95 to-[hsl(42_22%_97%/0.9)] p-1.5 shadow-[0_1px_0_rgba(255,255,255,0.92)_inset,0_10px_40px_-18px_rgba(0,0,0,0.08)] sm:p-2">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
              <label htmlFor="fo-url" className="sr-only">Website URL</label>
              <Input
                id="fo-url"
                type="url"
                placeholder="https://your-website.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12 flex-1 rounded-xl border-border/55 bg-background/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-12 shrink-0 rounded-xl px-7 font-semibold shadow-md shadow-primary/15"
              >
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Analyse →"}
              </Button>
            </form>
          </div>

          {loading && (
            <div className="rounded-2xl border border-border/50 bg-linear-to-b from-white/95 to-[hsl(40_20%_98%)] px-6 py-16 text-center shadow-[0_1px_0_rgba(255,255,255,0.88)_inset,0_14px_48px_-22px_rgba(0,0,0,0.07)] sm:px-10 sm:py-20">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
                <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
              </div>
              <p className="text-sm font-semibold font-sans text-foreground">Capturing page and mapping Tab order</p>
              <div className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground font-sans">
                Full-page screenshot plus focus extraction, typically 15–25 seconds.
              </div>
            </div>
          )}

          {error && (
            <div
              className="flex gap-3 rounded-2xl border border-red-200/80 bg-red-50/95 px-5 py-4 text-sm text-red-800 shadow-sm"
              role="alert"
            >
              <AlertTriangle className="size-5 shrink-0 text-red-600" aria-hidden />
              <div className="min-w-0 pt-0.5 font-sans leading-relaxed">{error}</div>
            </div>
          )}

          {result && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                <div className="rounded-2xl border border-border/55 bg-linear-to-b from-white to-[hsl(40_15%_99%)] p-5 shadow-sm">
                  <p className="text-3xl font-extrabold font-sans tabular-nums">{result.elements.length}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground font-sans">Focusable elements</p>
                </div>
                <div
                  className={`rounded-2xl border p-5 shadow-sm ${
                    issueCount > 0 ? "border-red-200/90 bg-linear-to-b from-red-50 to-red-50/70" : "border-green-200/90 bg-linear-to-b from-green-50 to-emerald-50/60"
                  }`}
                >
                  <p className={`text-3xl font-extrabold font-sans tabular-nums ${issueCount > 0 ? "text-red-600" : "text-green-700"}`}>
                    {issueCount}
                  </p>
                  <p className={`mt-1 text-xs font-medium font-sans ${issueCount > 0 ? "text-red-600" : "text-green-700"}`}>Issues detected</p>
                </div>
                <div
                  className={`rounded-2xl border p-5 shadow-sm ${
                    result.hasSkipLink
                      ? "border-green-200/90 bg-linear-to-b from-green-50 to-emerald-50/50"
                      : "border-amber-200/90 bg-linear-to-b from-amber-50 to-amber-50/60"
                  }`}
                >
                  <p className={`text-sm font-bold font-sans ${result.hasSkipLink ? "text-green-700" : "text-amber-800"}`}>
                    {result.hasSkipLink ? "✓ Present" : "✗ Missing"}
                  </p>
                  <p className={`mt-1 text-xs font-medium font-sans ${result.hasSkipLink ? "text-green-700" : "text-amber-800/90"}`}>Skip link</p>
                </div>
                <div className="rounded-2xl border border-border/55 bg-linear-to-b from-white to-[hsl(40_15%_99%)] p-5 shadow-sm">
                  <p className="text-3xl font-extrabold font-sans tabular-nums">{result.elements.filter((e) => e.tabIndex > 0).length}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground font-sans">Positive tabindex</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">
                <div className="xl:col-span-3 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-sm font-bold font-sans">Annotated screenshot</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 [box-shadow:none] text-xs"
                      onClick={handleDownload}
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_12px_40px_-20px_rgba(0,0,0,0.1)]">
                    <div className="relative w-full overflow-auto" style={{ maxHeight: "600px" }}>
                      <div className="relative inline-block w-full">
                        <img
                          ref={imgRef}
                          src={imgSrc!}
                          alt={`Screenshot of ${result.url}`}
                          className="w-full block"
                          crossOrigin="anonymous"
                        />
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          viewBox={`0 0 ${result.pageWidth} ${result.pageHeight}`}
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          {result.elements.map((el) => {
                            const color = TYPE_MARKER_DOT[el.type] ?? "#888";
                            const cx = el.rect.x + el.rect.width / 2;
                            const cy = el.rect.y + SVG_MARKER_R + 2;
                            const isHovered = hoveredIndex === el.index;
                            const isFiltered = filter !== "all" && el.type !== filter;
                            return (
                              <g key={el.index} opacity={isFiltered ? 0.2 : 1}>
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={isHovered ? SVG_MARKER_R * 1.3 : SVG_MARKER_R}
                                  fill={color}
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                                <text
                                  x={cx}
                                  y={cy}
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill="#fff"
                                  fontSize={SVG_FONT_SIZE}
                                  fontWeight="bold"
                                  fontFamily="sans-serif"
                                >
                                  {el.index}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  </div>

                  <TypeLegendChips />
                </div>

                <div className="xl:col-span-2 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-sm font-bold font-sans">Tab order list</h2>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by element type">
                      <button
                        onClick={() => setFilter("all")}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium font-sans transition-all border ${filter === "all" ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:border-foreground"}`}
                        aria-pressed={filter === "all"}
                      >
                        All ({result.elements.length})
                      </button>
                      {(Object.keys(TYPE_MARKER_DOT) as ElementType[]).filter((t) => typeCounts![t] > 0).map((t) => (
                        <button
                          key={t}
                          onClick={() => setFilter(t)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium font-sans transition-all border ${filter === t ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:border-foreground"}`}
                          aria-pressed={filter === t}
                        >
                          {TYPE_LABELS[t]} ({typeCounts![t]})
                        </button>
                      ))}
                    </div>
                  </div>

                  <ol
                    className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1"
                    aria-label="Focus order elements list"
                  >
                    {displayed.map((el) => {
                      const dot = TYPE_MARKER_DOT[el.type] ?? "#888";
                      const hasIssues = el.issues.length > 0;
                      return (
                        <li
                          key={el.index}
                          onMouseEnter={() => setHoveredIndex(el.index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`flex cursor-default items-start gap-2.5 rounded-xl border p-3.5 transition-all duration-200 ${
                            hasIssues
                              ? "border-red-200 bg-red-50"
                              : hoveredIndex === el.index
                                ? "border-primary/40 bg-primary/8 shadow-sm"
                                : "border-border/70 bg-linear-to-b from-white to-[hsl(40_18%_99%)] hover:border-border hover:shadow-sm"
                          }`}
                        >
                          <span
                            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold font-sans mt-0.5"
                            style={{ background: dot }}
                            aria-label={`Tab stop ${el.index}`}
                          >
                            {el.index}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className={TYPE_BADGE_CLASS}>
                                {TYPE_LABELS[el.type]}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">&lt;{el.tag}&gt;</span>
                              {el.role && el.role !== el.tag && (
                                <span className="text-xs text-muted-foreground">role={el.role}</span>
                              )}
                              {el.tabIndex > 0 && (
                                <span className="text-xs bg-primary/12 text-primary border border-primary/25 px-1.5 py-0.5 rounded font-sans">
                                  tabindex={el.tabIndex}
                                </span>
                              )}
                            </div>
                            {el.name ? (
                              <p className="text-xs font-sans text-foreground truncate" title={el.name}>{el.name}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">(no accessible name)</p>
                            )}
                            {hasIssues && (
                              <ul className="mt-1 space-y-0.5">
                                {el.issues.map((issue, i) => (
                                  <li key={i} className="flex items-start gap-1 text-xs text-red-600">
                                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {!hasIssues && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                <span className="text-xs text-green-600">No issues</span>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                    {displayed.length === 0 && (
                      <li className="text-center py-8 text-sm text-muted-foreground">
                        No elements for this filter.
                      </li>
                    )}
                  </ol>
                </div>
              </div>
            </>
          )}

          {!result && !loading && !error && (
            <ToolEmptyState
              icon={TabletSmartphone}
              title="Enter a URL to visualise focus order"
              description="We capture a full-page screenshot in a headless browser, walk every focusable control in real Tab sequence, and paint numbered badges on the image, each hue matches the element family below."
            >
              <TypeLegendChips />
            </ToolEmptyState>
          )}
    </ToolPageLayout>
  );
}
