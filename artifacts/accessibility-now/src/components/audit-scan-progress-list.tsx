"use client";

import {
  discoveryHeading,
  urlScanStatusDotClass,
  urlScanStatusLabel,
  type BatchScanProgress,
  type DiscoverySource,
} from "@/lib/batch-scan-sse";
import { Loader2 } from "lucide-react";

function progressSummary(
  source: DiscoverySource | undefined,
  discovering: boolean,
  doneCount: number,
  total: number,
): string {
  if (discovering) {
    if (source === "links") return "Discovering pages from homepage links…";
    if (source === "sitemap") return "Discovering pages from sitemap…";
    return "Finding pages to scan…";
  }
  const heading = discoveryHeading(source, total);
  if (doneCount === 0) return `${heading} — starting first page`;
  if (doneCount >= total) return `${heading} — all pages complete`;
  return `${heading} — ${doneCount} of ${total} scanned`;
}

/**
 * Per-URL scan queue shown during whole-site batch scans.
 */
export function AuditScanProgressList({
  progress,
  seedUrl,
}: {
  progress: BatchScanProgress;
  seedUrl?: string;
}) {
  const { urlStates, discoverySource, discovering } = progress;
  const doneCount = urlStates.filter((s) => s.status === "done" || s.status === "error").length;
  const total = Math.max(urlStates.length, 1);
  const current = urlStates.find((s) => s.status === "scanning");

  return (
    <div
      className="rounded-xl border border-border bg-background/80 backdrop-blur-sm p-5 text-left shadow-sm max-w-xl w-full"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-3">
        {discovering ? (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" aria-hidden />
        ) : null}
        <p className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wide">
          {progressSummary(discoverySource, discovering, doneCount, total)}
        </p>
      </div>

      {current ? (
        <p className="text-xs text-foreground mb-3 font-sans">
          Now scanning:{" "}
          <span className="font-mono text-[11px] break-all">{current.url}</span>
        </p>
      ) : null}

      {urlStates.length > 0 ? (
        <ul className="space-y-0">
          {urlStates.map((s, i) => (
            <li
              key={`${s.url}-${i}`}
              className={[
                "flex items-center gap-3 py-2 border-b border-border/40 last:border-0 rounded-md -mx-1 px-1",
                s.status === "scanning" ? "bg-primary/5 ring-1 ring-primary/15" : "",
              ].join(" ")}
            >
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${urlScanStatusDotClass[s.status]}`}
                aria-hidden
              />
              <span className="flex-1 font-mono text-xs text-foreground truncate" title={s.url}>
                {s.url}
              </span>
              <div className="text-right shrink-0">
                {s.status === "done" && s.score !== undefined ? (
                  <span className="font-bold font-sans text-sm text-foreground">{s.score}</span>
                ) : (
                  <span
                    className={[
                      "text-xs font-sans",
                      s.status === "scanning" ? "font-semibold text-primary" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {urlScanStatusLabel[s.status]}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : seedUrl ? (
        <ul className="space-y-0">
          <li className="flex items-center gap-3 py-2 border-b border-border/40">
            <div className="w-2 h-2 rounded-full shrink-0 bg-primary animate-pulse" aria-hidden />
            <span className="flex-1 font-mono text-xs text-foreground truncate" title={seedUrl}>
              {seedUrl}
            </span>
            <span className="text-xs font-sans text-muted-foreground shrink-0">Finding pages…</span>
          </li>
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground font-sans">
          Looking for pages in sitemap.xml and homepage links…
        </p>
      )}
    </div>
  );
}
