"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AuditViolation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, FileDown, Loader2 } from "lucide-react";
import { A11yFixIcon } from "@/lib/product-icons";
import { A11yFixJourneyStepper } from "@/components/a11y-fix/journey-stepper";
import { A11yFixLeadCapture } from "@/components/a11y-fix/lead-capture";
import { POUR_PRINCIPLES } from "@/data/pour-principles";
import {
  loadA11yFixBatchResult,
  openA11yFixPrintReport,
  type A11yFixBatchResult,
  type A11yFixCrossPageViolation,
} from "@/lib/a11y-fix-batch";
import { openPrintReport } from "@/lib/print-report";
import { groupViolationsByPour } from "@/lib/pour-mapper";
import { getFixDifficulty, difficultyBadgeClass, difficultyLabel, intentContactHref } from "@/lib/a11y-fix";
import { cn } from "@/lib/utils";

function crossPageToViolation(v: A11yFixCrossPageViolation): AuditViolation {
  return {
    id: v.id,
    wcagCriteria: v.wcagCriteria,
    description: v.description,
    impact: v.impact,
    affectedElements: v.totalAffectedElements,
    topSelectors: [],
  };
}

export default function A11yFixBatchResult() {
  const [data, setData] = useState<A11yFixBatchResult | null>(null);

  useEffect(() => {
    setData(loadA11yFixBatchResult());
  }, []);

  const pourGroups = useMemo(() => {
    if (!data) return null;
    return groupViolationsByPour(data.crossPageViolations.map(crossPageToViolation));
  }, [data]);

  const intent = (data?.intent ?? "self") as "self" | "engineers" | "monitor";
  const successPages = data?.pages.filter((p) => p.status === "success") ?? [];
  const primaryAuditId = successPages[0]?.auditId;

  function downloadBatchPdf() {
    if (!successPages.length) return;
    openPrintReport("batch");
  }

  if (!data) {
    return (
      <div className="container mx-auto max-w-2xl py-24 px-4 text-center">
        <h1 className="text-2xl font-extrabold font-sans mb-4">No site scan found</h1>
        <p className="text-muted-foreground mb-6">Run a whole-site A11y Fix scan first.</p>
        <Button asChild>
          <Link href="/solutions/a11y-fix">Start A11y Fix →</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-20 pb-8 px-4 border-b">
        <div className="container mx-auto max-w-5xl space-y-6">
          <div className="flex items-center gap-2">
            <A11yFixIcon className="w-4 h-4 text-primary" aria-hidden />
            <p className="text-sm font-semibold text-foreground font-sans">A11y Fix · Whole-site results</p>
          </div>
          <A11yFixJourneyStepper current="scan" />
          <div>
            <h1 className="text-display-md font-extrabold mb-2">Site-wide BFSG scan</h1>
            <p className="text-sm text-muted-foreground">
              {successPages.length} pages scanned · strict BITV / BFSG profile · issues grouped by POUR across the site
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 bg-white border-b">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-extrabold font-sans">{data.siteScore}</p>
                <p className="text-xs text-muted-foreground mt-1">Site score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-extrabold font-sans">{successPages.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Pages scanned</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-extrabold font-sans">{data.crossPageViolations.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Unique issue types</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-extrabold font-sans capitalize">{data.siteLevel}</p>
                <p className="text-xs text-muted-foreground mt-1">Site level</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3 mb-10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="[box-shadow:none]"
              disabled={!successPages.length}
              onClick={downloadBatchPdf}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Save site report as PDF
            </Button>
            {primaryAuditId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="[box-shadow:none]"
                onClick={() => openA11yFixPrintReport(primaryAuditId)}
              >
                <FileDown className="w-4 h-4 mr-2" />
                A11y Fix PDF (homepage)
              </Button>
            )}
            <Button asChild variant="outline" size="sm" className="[box-shadow:none]">
              <Link href="/solutions/a11y-fix">Scan again</Link>
            </Button>
          </div>

          <h2 className="font-bold font-sans text-base mb-4">Pages scanned</h2>
          <div className="space-y-2 mb-12">
            {data.pages.map((page) => (
              <div
                key={page.auditId || page.url}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold font-sans truncate" title={page.url}>
                    {page.url}
                  </p>
                  {page.status === "error" ? (
                    <p className="text-xs text-destructive">{page.error ?? "Scan failed"}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Score {page.score} · {page.totalViolations} issues
                    </p>
                  )}
                </div>
                {page.status === "success" && page.auditId && (
                  <div className="flex gap-2 shrink-0">
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs [box-shadow:none]">
                      <Link href={`/audit-result?auditId=${page.auditId}&intent=${intent}&profile=strict`}>Results</Link>
                    </Button>
                    <Button asChild size="sm" className="h-8 text-xs">
                      <Link href={`/a11y-fix/plan?auditId=${page.auditId}&intent=${intent}`}>Fix plan</Link>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pourGroups && (
            <>
              <h2 className="text-display-md font-extrabold mb-6">
                Site issues by <span className="heading-accent">principle</span>
              </h2>
              <div className="space-y-5">
                {POUR_PRINCIPLES.map((meta, idx) => {
                  const items = pourGroups[meta.name];
                  return (
                    <section key={meta.name} className={cn("rounded-2xl border overflow-hidden", meta.border)}>
                      <div className={cn("p-5 flex items-center gap-3", meta.bg)}>
                        <span className={cn("text-lg font-extrabold font-sans", meta.color)}>{meta.letter}</span>
                        <h3 className="font-bold font-sans">{meta.name}</h3>
                        <Badge variant="secondary">{items.length}</Badge>
                      </div>
                      <div className="p-5 space-y-3 bg-white">
                        {items.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No cross-page issues.</p>
                        ) : (
                          items.map((v) => {
                            const cross = data.crossPageViolations.find((c) => c.id === v.id);
                            const difficulty = getFixDifficulty(v.id);
                            return (
                              <div key={v.id} className="rounded-lg border border-border p-4 text-sm">
                                <div className="flex flex-wrap gap-2 mb-1">
                                  <span
                                    className={cn(
                                      "text-[10px] font-semibold rounded-full border px-2 py-0.5",
                                      difficultyBadgeClass(difficulty),
                                    )}
                                  >
                                    {difficultyLabel(difficulty)}
                                  </span>
                                  {cross && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {cross.pageCount} page{cross.pageCount === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </div>
                                <p className="font-semibold font-sans">{v.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">{v.wcagCriteria}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-12 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-extrabold font-sans text-white mb-3">Need engineers for the backlog?</h2>
          <p className="text-gray-400 text-sm mb-6">
            Whole-site scans surface architectural issues. Our remediation sprints ship PRs citing WCAG criteria.
          </p>
          <Button asChild className="btn-gsap h-12 px-8 font-semibold">
            <Link
              href={intentContactHref(intent, {
                url: successPages[0]?.url,
                auditId: primaryAuditId,
              })}
            >
              Book remediation scoping <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {primaryAuditId && (
        <section className="py-12 px-4 warm-section">
          <div className="container mx-auto max-w-xl rounded-2xl border bg-background p-8">
            <h2 className="font-extrabold font-sans text-lg mb-2">Get the full report</h2>
            <A11yFixLeadCapture auditId={primaryAuditId} />
          </div>
        </section>
      )}
    </div>
  );
}
