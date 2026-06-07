"use client";

import { Suspense, useEffect, useState } from "react";
import { AutoPrint } from "@/components/reports/auto-print";
import { ReportPrintToolbar } from "@/components/reports/report-print-toolbar";
import { BATCH_AUDIT_STORAGE_KEY } from "@/lib/batch-audit-storage";
import type { BatchAuditResult } from "@/lib/batch-scan-sse";

function BatchReportPrintInner() {
  const [result, setResult] = useState<BatchAuditResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BATCH_AUDIT_STORAGE_KEY);
      if (raw) setResult(JSON.parse(raw) as BatchAuditResult);
    } catch {
      /* ignore */
    }
  }, []);

  if (!result) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        No batch scan data in this session. Run a whole-site scan first, then open Print / Save as PDF from the batch
        results page.
      </p>
    );
  }

  const scannedDate = new Date(result.scannedAt).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <>
      <AutoPrint />
      <ReportPrintToolbar title="Multi-page accessibility report" />
      <article className="report-document mx-auto max-w-[210mm] bg-white px-8 py-10 text-[11pt] print:px-0 print:py-0">
        <header className="mb-8 rounded-lg bg-[#1a1a1a] px-6 py-5 text-white print:rounded-none">
          <p className="text-xl font-bold">
            accessibility<span className="text-[#FF4D1C]">.now</span>
          </p>
          <p className="mt-1 text-xs text-white/60">Multi-page site accessibility summary</p>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-4 border-b border-border pb-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Site score</p>
            <p className="text-4xl font-extrabold tabular-nums">{result.siteScore}</p>
            <p className="text-sm capitalize">{result.siteLevel}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Scanned</p>
            <p className="text-sm">{scannedDate}</p>
            <p className="text-sm">{result.pages.length} pages</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold">Pages</h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-2">URL</th>
                <th className="py-2 pr-2">Score</th>
                <th className="py-2">Issues</th>
              </tr>
            </thead>
            <tbody>
              {result.pages.map((p) => (
                <tr key={p.url + p.auditId} className="border-b border-border/60">
                  <td className="max-w-[280px] break-all py-2 pr-2">{p.url}</td>
                  <td className="py-2 pr-2 tabular-nums">{p.status === "success" ? p.score : "—"}</td>
                  <td className="py-2 tabular-nums">{p.status === "success" ? p.totalViolations : p.error ?? "Failed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {result.crossPageViolations.length > 0 ? (
          <section>
            <h2 className="mb-3 text-sm font-bold">Cross-page issues</h2>
            <ol className="space-y-2 text-sm">
              {result.crossPageViolations.slice(0, 15).map((v) => (
                <li key={v.id}>
                  <span className="font-semibold">{v.description}</span>
                  <span className="text-muted-foreground"> — {v.pageCount} pages</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </article>
    </>
  );
}

export default function BatchReportPrintPage() {
  return (
    <Suspense fallback={null}>
      <BatchReportPrintInner />
    </Suspense>
  );
}
