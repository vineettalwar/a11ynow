import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const TYPE_COLORS: Record<ElementType, { bg: string; border: string; badge: string; dot: string }> = {
  link:    { bg: "bg-sky-100",    border: "border-sky-300",    badge: "bg-sky-100 text-sky-700",    dot: "#0ea5e9" },
  button:  { bg: "bg-orange-100", border: "border-orange-300", badge: "bg-orange-100 text-orange-700", dot: "#f97316" },
  input:   { bg: "bg-green-100",  border: "border-green-300",  badge: "bg-green-100 text-green-700",  dot: "#22c55e" },
  select:  { bg: "bg-purple-100", border: "border-purple-300", badge: "bg-purple-100 text-purple-700", dot: "#a855f7" },
  textarea:{ bg: "bg-teal-100",   border: "border-teal-300",   badge: "bg-teal-100 text-teal-700",   dot: "#14b8a6" },
  other:   { bg: "bg-yellow-100", border: "border-yellow-300", badge: "bg-yellow-100 text-yellow-700", dot: "#eab308" },
};

const TYPE_LABELS: Record<ElementType, string> = {
  link: "Link",
  button: "Button",
  input: "Input",
  select: "Select",
  textarea: "Textarea",
  other: "Other",
};

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
    const color = TYPE_COLORS[el.type]?.dot ?? "#888";
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
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FocusOrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ElementType | "all">("all");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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
    ? (Object.keys(TYPE_COLORS) as ElementType[]).reduce<Record<ElementType, number>>(
        (acc, t) => ({ ...acc, [t]: result.elements.filter((el) => el.type === t).length }),
        {} as Record<ElementType, number>,
      )
    : null;

  const imgSrc = result ? `data:image/png;base64,${result.screenshotBase64}` : null;

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-display font-extrabold tracking-tight mb-6">
            Focus order<br />
            <span className="heading-accent">visualizer.</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl">
            Enter a URL to capture a screenshot and overlay numbered markers showing the keyboard Tab order of every interactive element — colour-coded by type.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl space-y-10">
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
            <label htmlFor="fo-url" className="sr-only">Website URL</label>
            <Input
              id="fo-url"
              type="url"
              placeholder="https://your-website.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="h-12 px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyse →"}
            </Button>
          </form>

          {loading && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Capturing page and extracting focus order… this may take 15–25 seconds.</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border p-5 bg-background">
                  <p className="text-3xl font-extrabold font-sans">{result.elements.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Focusable elements</p>
                </div>
                <div className={`rounded-xl border p-5 ${issueCount > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  <p className={`text-3xl font-extrabold font-sans ${issueCount > 0 ? "text-red-600" : "text-green-700"}`}>{issueCount}</p>
                  <p className={`text-xs mt-1 ${issueCount > 0 ? "text-red-500" : "text-green-600"}`}>Issues detected</p>
                </div>
                <div className={`rounded-xl border p-5 ${result.hasSkipLink ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}>
                  <p className={`text-sm font-bold font-sans ${result.hasSkipLink ? "text-green-700" : "text-yellow-700"}`}>
                    {result.hasSkipLink ? "✓ Present" : "✗ Missing"}
                  </p>
                  <p className={`text-xs mt-1 ${result.hasSkipLink ? "text-green-600" : "text-yellow-600"}`}>Skip link</p>
                </div>
                <div className="rounded-xl border p-5 bg-background">
                  <p className="text-3xl font-extrabold font-sans">{result.elements.filter((e) => e.tabIndex > 0).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Positive tabindex</p>
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

                  <div className="rounded-2xl border overflow-hidden bg-muted relative">
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
                            const color = TYPE_COLORS[el.type]?.dot ?? "#888";
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

                  <div className="flex flex-wrap gap-3 text-xs">
                    {(Object.keys(TYPE_COLORS) as ElementType[]).map((t) => (
                      <span key={t} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ background: TYPE_COLORS[t].dot }} />
                        <span className="text-muted-foreground">{TYPE_LABELS[t]}</span>
                      </span>
                    ))}
                  </div>
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
                      {(Object.keys(TYPE_COLORS) as ElementType[]).filter((t) => typeCounts![t] > 0).map((t) => (
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
                      const colors = TYPE_COLORS[el.type];
                      const hasIssues = el.issues.length > 0;
                      return (
                        <li
                          key={el.index}
                          onMouseEnter={() => setHoveredIndex(el.index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-default transition-all ${
                            hasIssues
                              ? "border-red-200 bg-red-50"
                              : hoveredIndex === el.index
                                ? `${colors.bg} ${colors.border}`
                                : "border-border bg-background hover:bg-muted/40"
                          }`}
                        >
                          <span
                            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold font-sans mt-0.5"
                            style={{ background: colors.dot }}
                            aria-label={`Tab stop ${el.index}`}
                          >
                            {el.index}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-bold font-sans ${colors.badge}`}>
                                {TYPE_LABELS[el.type]}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">&lt;{el.tag}&gt;</span>
                              {el.role && el.role !== el.tag && (
                                <span className="text-xs text-muted-foreground">role={el.role}</span>
                              )}
                              {el.tabIndex > 0 && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-sans">
                                  tabindex={el.tabIndex}
                                </span>
                              )}
                            </div>
                            {el.name ? (
                              <p className="text-xs font-mono text-foreground truncate" title={el.name}>{el.name}</p>
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
            <div className="rounded-2xl border bg-background p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                <TabletSmartphone className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-semibold font-sans mb-2">Enter a URL to visualise focus order</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                The tool captures a full-page screenshot via a headless browser, extracts every focusable element in keyboard Tab order, and overlays numbered markers — colour-coded by element type.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                {(Object.keys(TYPE_COLORS) as ElementType[]).map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: TYPE_COLORS[t].dot }} />
                    {TYPE_LABELS[t]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
