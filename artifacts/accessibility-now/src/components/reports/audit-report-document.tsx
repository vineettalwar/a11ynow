import type { AuditResult, AuditViolation } from "@workspace/api-client-react";

const IMPACT_CLASS: Record<string, string> = {
  critical: "text-red-600",
  serious: "text-orange-600",
  moderate: "text-amber-600",
  minor: "text-gray-500",
};

function scoreClass(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function topViolations(violations: AuditViolation[]): AuditViolation[] {
  const order: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  return [...violations]
    .sort((a, b) => (order[a.impact] ?? 4) - (order[b.impact] ?? 4))
    .slice(0, 10);
}

export function AuditReportDocument({ audit }: { audit: AuditResult }) {
  const violations = Array.isArray(audit.violations) ? audit.violations : [];
  const moderate = violations.filter((v) => v.impact === "moderate").length;
  const minor = violations.filter((v) => v.impact === "minor").length;
  const scannedDate = new Date(audit.scannedAt).toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const top = topViolations(violations);

  return (
    <article className="report-document mx-auto max-w-[210mm] bg-white px-8 py-10 text-[11pt] text-foreground print:px-0 print:py-0">
      <header className="report-header mb-8 rounded-lg bg-[#1a1a1a] px-6 py-5 text-white print:rounded-none">
        <p className="text-xl font-bold">
          accessibility<span className="text-[#FF4D1C]">.now</span>
        </p>
        <p className="mt-1 text-xs text-white/60">WCAG 2.1 AA Compliance Report</p>
      </header>

      <section className="mb-6 grid gap-1 border-b border-border pb-4 text-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">URL audited</p>
        <p className="break-all font-semibold">{audit.url}</p>
        <p className="text-xs text-muted-foreground">Scanned {scannedDate}</p>
      </section>

      <section className="mb-8 grid grid-cols-[120px_1fr] gap-4 print:grid-cols-[100px_1fr]">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className={`text-4xl font-extrabold tabular-nums ${scoreClass(audit.score)}`}>{audit.score}</p>
          <p className="mt-1 text-xs font-semibold capitalize">{audit.level}</p>
          <p className="text-[10px] text-muted-foreground">Score / 100</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 print:grid-cols-5">
          {[
            { label: "Critical", value: audit.criticalViolations, className: "text-red-600" },
            { label: "Serious", value: audit.seriousViolations, className: "text-orange-600" },
            { label: "Moderate", value: moderate, className: "text-amber-600" },
            { label: "Minor", value: minor, className: "text-gray-500" },
            { label: "Passed", value: `${audit.passedChecks}/${audit.totalChecks}`, className: "text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
              <p className={`text-lg font-bold tabular-nums ${s.className}`}>{s.value}</p>
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {audit.pageScreenshot ? (
        <section className="mb-8 break-inside-avoid">
          <h2 className="mb-2 text-sm font-bold">Page screenshot</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={audit.pageScreenshot} alt="" className="max-h-[280px] w-full rounded border object-cover object-top" />
        </section>
      ) : null}

      <section>
        <h2 className="mb-1 text-base font-bold">Top violations found</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Showing up to 10 issues sorted by impact. Full list available in the interactive report.
        </p>
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No automated violations detected.</p>
        ) : (
          <ol className="space-y-4">
            {top.map((v, i) => (
              <li key={`${v.id}-${i}`} className="break-inside-avoid rounded-lg border border-border p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                  <span className={`text-xs font-bold uppercase ${IMPACT_CLASS[v.impact] ?? ""}`}>{v.impact}</span>
                  {v.wcagCriteria ? (
                    <span className="text-xs font-mono text-muted-foreground">{v.wcagCriteria}</span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold">{v.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.affectedElements} affected element{v.affectedElements === 1 ? "" : "s"}
                </p>
                {v.topSelectors?.[0] ? (
                  <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">{v.topSelectors[0]}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="report-footer mt-10 border-t border-border pt-4 text-[10px] text-muted-foreground">
        <p>
          Generated by accessibility.now · Automated WCAG scan · Not a substitute for manual accessibility audit
        </p>
        <p className="mt-1 font-mono">Audit ID: {audit.auditId}</p>
      </footer>
    </article>
  );
}
