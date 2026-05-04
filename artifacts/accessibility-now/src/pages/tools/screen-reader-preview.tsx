import { useState } from "react";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolEmptyState } from "@/components/tools/tool-empty-state";
import { CheckCircle2, XCircle, Loader2, Mic } from "lucide-react";

type ItemType = "title" | "landmark" | "heading" | "link" | "button" | "image" | "form-label";

interface ScreenReaderItem {
  type: ItemType;
  level?: number;
  role?: string;
  text: string;
  pass: boolean;
  issue?: string;
}

interface PreviewResult {
  url: string;
  items: ScreenReaderItem[];
}

const TYPE_LABELS: Record<ItemType, string> = {
  title: "Page Title",
  landmark: "Landmark",
  heading: "Heading",
  link: "Link",
  button: "Button",
  image: "Image",
  "form-label": "Form",
};

const TYPE_BADGE_CLASS =
  "bg-muted/80 text-foreground border border-border/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function ScreenReaderPreview() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ItemType | "all">("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let target = url;
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await fetch(`${BASE_URL}/api/screen-reader-preview?url=${encodeURIComponent(target)}`);
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.message || "Could not fetch screen reader preview.");
      }
      const data: PreviewResult = await resp.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  };

  const displayed = result
    ? filter === "all"
      ? result.items
      : result.items.filter((i) => i.type === filter)
    : [];

  const failCount = result ? result.items.filter((i) => !i.pass).length : 0;
  const passCount = result ? result.items.filter((i) => i.pass).length : 0;

  const filterTypes: Array<ItemType | "all"> = ["all", "landmark", "heading", "link", "button", "image", "form-label"];

  return (
    <ToolPageLayout
      eyebrow="Reading order · Server-side fetch"
      title={
        <>
          Screen reader<br />
          <span className="heading-accent">preview.</span>
        </>
      }
      description="See the exact reading order NVDA, JAWS, and VoiceOver would announce - landmarks, headings, links, buttons, and image alt text."
      innerClassName="space-y-8"
    >
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
            <label htmlFor="sr-url" className="sr-only">Website URL</label>
            <Input
              id="sr-url"
              type="url"
              placeholder="https://your-website.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading} className="h-12 px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Preview →"}
            </Button>
          </form>

          {loading && (
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Fetching page structure…
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {result && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border p-5 bg-background">
                  <p className="text-3xl font-extrabold font-sans">{result.items.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total elements</p>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                  <p className="text-3xl font-extrabold font-sans text-green-700">{passCount}</p>
                  <p className="text-xs text-green-600 mt-1">Passing</p>
                </div>
                <div className={`rounded-xl border p-5 ${failCount > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  <p className={`text-3xl font-extrabold font-sans ${failCount > 0 ? "text-red-600" : "text-green-700"}`}>{failCount}</p>
                  <p className={`text-xs mt-1 ${failCount > 0 ? "text-red-500" : "text-green-600"}`}>Issues found</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by element type">
                {filterTypes.map((t) => {
                  const count = t === "all" ? result.items.length : result.items.filter((i) => i.type === t).length;
                  return (
                    <button
                      key={t}
                      onClick={() => setFilter(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium font-sans transition-all border ${
                        filter === t
                          ? "bg-foreground text-background border-foreground"
                          : "bg-background text-muted-foreground border-border hover:border-foreground"
                      }`}
                      aria-pressed={filter === t}
                    >
                      {t === "all" ? "All" : TYPE_LABELS[t]} ({count})
                    </button>
                  );
                })}
              </div>

              <ol className="space-y-2" aria-label="Screen reader reading order">
                {displayed.map((item, i) => (
                  <li
                    key={i}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${item.pass ? "bg-background" : "bg-red-50 border-red-200"}`}
                  >
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      {item.pass
                        ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                        : <XCircle className="w-4 h-4 text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-sans ${TYPE_BADGE_CLASS}`}>
                          {item.type === "heading" && item.level ? `H${item.level}` : TYPE_LABELS[item.type]}
                          {item.role ? ` - ${item.role}` : ""}
                        </span>
                        {!item.pass && item.issue && (
                          <span className="text-xs text-red-600 font-medium">{item.issue}</span>
                        )}
                      </div>
                      <p className="text-sm font-sans text-foreground break-words leading-relaxed">{item.text || <em className="text-muted-foreground">(empty)</em>}</p>
                    </div>
                  </li>
                ))}
                {displayed.length === 0 && (
                  <li className="text-center py-12 text-muted-foreground text-sm">No elements found for this filter.</li>
                )}
              </ol>
            </>
          )}

          {!result && !loading && !error && (
            <ToolEmptyState
              icon={Mic}
              title="Enter a URL to see the screen reader view"
              description="The tool fetches the page server-side and extracts the reading order: document title, landmarks, headings H1–H6, link text, button labels, image alt text, and form labels."
            />
          )}
    </ToolPageLayout>
  );
}
