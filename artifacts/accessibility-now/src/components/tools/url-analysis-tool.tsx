import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolEmptyState } from "@/components/tools/tool-empty-state";
import { Loader2, CheckCircle2, XCircle, Search } from "lucide-react";
import { apiUrl } from "@/lib/api-base";

export type AnalysisItemType = "heading" | "link" | "image";

interface ScreenReaderItem {
  type: string;
  level?: number;
  text: string;
  pass: boolean;
  issue?: string;
}

interface PreviewResult {
  url: string;
  items: ScreenReaderItem[];
  engine?: string;
}

export interface UrlAnalysisToolConfig {
  eyebrow: string;
  title: ReactNode;
  description: string;
  itemType: AnalysisItemType;
  emptyLabel: string;
  passLabel: string;
  failLabel: string;
}

const TYPE_LABELS: Record<AnalysisItemType, string> = {
  heading: "Heading",
  link: "Link",
  image: "Image",
};

export function UrlAnalysisTool({ config }: { config: UrlAnalysisToolConfig }) {
  const search = useSearch();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFailsOnly, setShowFailsOnly] = useState(false);

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
    try {
      const resp = await fetch(
        `${apiUrl("/api/screen-reader-preview")}?url=${encodeURIComponent(target)}`,
      );
      if (!resp.ok) {
        const data = (await resp.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(data.message || "Could not analyse the page.");
      }
      const data: PreviewResult = await resp.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  };

  const items = result
    ? result.items.filter((i) => i.type === config.itemType)
    : [];
  const displayed = showFailsOnly ? items.filter((i) => !i.pass) : items;
  const failCount = items.filter((i) => !i.pass).length;
  const passCount = items.filter((i) => i.pass).length;

  return (
    <ToolPageLayout
      eyebrow={config.eyebrow}
      title={config.title}
      description={config.description}
      contentMaxWidth="max-w-4xl"
      innerClassName="space-y-8"
    >
      <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
        <Input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-12 flex-1"
          aria-label="Page URL"
        />
        <Button type="submit" disabled={loading || !url.trim()} className="h-12 px-6 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : "Analyse"}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <ToolEmptyState icon={Loader2} title="Scanning page…" description="Rendering in headless Chromium when available." />
      )}

      {!loading && !result && !error && (
        <ToolEmptyState
          icon={Search}
          title={config.emptyLabel}
          description="Enter a public URL above. JavaScript-heavy sites are rendered in Chromium for accurate results."
        />
      )}

      {result && items.length === 0 && (
        <ToolEmptyState
          icon={Search}
          title={`No ${TYPE_LABELS[config.itemType].toLowerCase()}s found`}
          description="The page may block automated browsers, require sign-in, or have no matching elements in the rendered DOM."
        />
      )}

      {result && items.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" aria-hidden />
              {passCount} {config.passLabel}
            </span>
            <span className="flex items-center gap-1.5 text-destructive">
              <XCircle className="w-4 h-4" aria-hidden />
              {failCount} {config.failLabel}
            </span>
            {result.engine && (
              <span className="text-xs font-mono text-muted-foreground ml-auto">
                Engine: {result.engine}
              </span>
            )}
            <label className="flex items-center gap-2 text-xs cursor-pointer ml-auto sm:ml-0">
              <input
                type="checkbox"
                checked={showFailsOnly}
                onChange={(e) => setShowFailsOnly(e.target.checked)}
                className="rounded border-border"
              />
              Show issues only
            </label>
          </div>

          <ul className="space-y-3" aria-label={`${TYPE_LABELS[config.itemType]} audit results`}>
            {displayed.map((item, idx) => (
              <li
                key={`${item.text}-${idx}`}
                className={`rounded-xl border p-4 ${item.pass ? "border-border/60 bg-white" : "border-destructive/30 bg-destructive/5"}`}
              >
                <div className="flex items-start gap-3">
                  {item.pass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" aria-hidden />
                  )}
                  <div className="min-w-0">
                    {config.itemType === "heading" && item.level != null && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                        H{item.level}{" "}
                      </span>
                    )}
                    <p className="text-sm font-medium break-words">{item.text || "(empty)"}</p>
                    {item.issue && (
                      <p className="text-xs text-destructive mt-1">{item.issue}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ToolPageLayout>
  );
}
