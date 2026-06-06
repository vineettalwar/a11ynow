import { useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import type { AuditViolation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertOctagon,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileDown,
  Loader2,
  Sparkles,
} from "lucide-react";
import { AuditPendingScanFrame } from "@/components/audit-pending-scan-frame";
import { A11yFixJourneyStepper } from "@/components/a11y-fix/journey-stepper";
import { A11yFixLeadCapture } from "@/components/a11y-fix/lead-capture";
import { A11yFixMonitorSetup } from "@/components/a11y-fix/monitor-setup";
import { A11yFixToolkitLinks } from "@/components/a11y-fix/toolkit-links";
import { ViolationElementShot } from "@/components/a11y-fix/violation-element-shot";
import { primaryViolationSelector } from "@/lib/violation-element-preview";
import { POUR_PRINCIPLES } from "@/data/pour-principles";
import { groupViolationsByPour } from "@/lib/pour-mapper";
import { getManualFollowUpsFromViolations } from "@/lib/manual-followups";
import {
  buildFixActionPlan,
  countByDifficulty,
  difficultyBadgeClass,
  difficultyLabel,
  getFixDifficulty,
  intentContactHref,
  recommendedUpsell,
  type A11yFixIntent,
} from "@/lib/a11y-fix";
import { getHumanContextForViolation } from "@/lib/violation-human-context";
import { useA11yFixAudit } from "@/hooks/use-a11y-fix-audit";
import { cn } from "@/lib/utils";
const VALID_INTENTS: A11yFixIntent[] = ["self", "engineers", "monitor"];

function parseIntent(raw: string | null): A11yFixIntent {
  return VALID_INTENTS.includes(raw as A11yFixIntent) ? (raw as A11yFixIntent) : "self";
}

function impactBadgeClass(impact: AuditViolation["impact"]): string {
  switch (impact) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200";
    case "serious":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "moderate":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function ComplianceStatusBadge({ status }: { status: string }) {
  const cls =
    status === "conformant"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "needs_manual_review"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";
  const label =
    status === "conformant"
      ? "Likely conformant (automated)"
      : status === "needs_manual_review"
        ? "Manual review required"
        : "Non-conformant (automated)";
  return (
    <span className={cn("text-xs font-semibold font-sans rounded-full border px-3 py-1", cls)}>{label}</span>
  );
}

function ViolationFixCard({ violation }: { violation: AuditViolation }) {
  const [expanded, setExpanded] = useState(false);
  const human = getHumanContextForViolation(violation);
  const difficulty = getFixDifficulty(violation.id);

  const selector = primaryViolationSelector(violation);

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex flex-col sm:flex-row gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold font-sans text-sm text-foreground leading-snug">
                {violation.titleDe ?? violation.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{human.plainLead}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <span
                className={cn(
                  "text-[10px] font-semibold font-sans rounded-full border px-2 py-0.5 uppercase tracking-wide",
                  impactBadgeClass(violation.impact),
                )}
              >
                {violation.impact}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold font-sans rounded-full border px-2 py-0.5",
                  difficultyBadgeClass(difficulty),
                )}
              >
                {difficultyLabel(difficulty)}
              </span>
            </div>
          </div>
        </div>
        <ViolationElementShot violation={violation} />
      </div>

      {violation.bitvSection && (
        <p className="text-[11px] text-muted-foreground mb-3" style={{ fontFamily: "var(--app-font-mono)" }}>
          BITV {violation.bitvSection}
          {violation.wcagCriteria ? ` · ${violation.wcagCriteria}` : ""}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
          {expanded ? "Hide fix steps" : "Show fix steps"}
        </Button>
        {human.relatedToolPath && (
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <Link href={human.relatedToolPath}>Open tool</Link>
          </Button>
        )}
        {violation.helpUrl && (
          <a
            href={violation.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary px-2 py-1 hover:underline"
          >
            Rule docs <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-border/60 space-y-3 text-sm">
          {violation.help && (
            <p className="text-foreground leading-relaxed">
              <span className="font-semibold font-sans">How to fix: </span>
              {violation.help}
            </p>
          )}
          <p className="text-muted-foreground text-xs">{human.whenYouFixIt}</p>
          {(selector || (violation.topSelectors?.length ?? 0) > 0) && (
            <div>
              <p className="text-xs font-semibold font-sans mb-1">Selectors</p>
              <ul className="space-y-1">
                {[selector, ...(violation.topSelectors ?? [])]
                  .filter((s, i, arr) => s && arr.indexOf(s) === i)
                  .slice(0, 3)
                  .map((sel) => (
                    <li key={sel} className="text-[11px] font-mono text-muted-foreground truncate" title={sel}>
                      {sel}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PourSectionBlock({
  principleIndex,
  violations,
  defaultOpen,
}: {
  principleIndex: number;
  violations: AuditViolation[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = POUR_PRINCIPLES[principleIndex];
  const Icon = meta.icon;
  let quickWins = 0;
  let moderate = 0;
  let expert = 0;
  for (const v of violations) {
    const d = getFixDifficulty(v.id);
    if (d === "quick_win") quickWins += 1;
    else if (d === "moderate") moderate += 1;
    else expert += 1;
  }

  return (
    <section className={cn("rounded-2xl border overflow-hidden", meta.border)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn("w-full text-left p-6 flex items-start gap-4 transition-colors hover:bg-white/60", meta.bg)}
        aria-expanded={open}
      >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white/80", meta.color)}>
          <Icon className="w-6 h-6" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn("text-lg font-extrabold font-sans", meta.color)}>{meta.letter}</span>
            <h2 className="text-lg font-extrabold font-sans">{meta.name}</h2>
            <Badge variant="secondary" className="text-xs">
              {violations.length} {violations.length === 1 ? "issue" : "issues"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          {violations.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: "var(--app-font-mono)" }}>
              {quickWins} quick wins · {moderate} moderate · {expert} expert
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-3 bg-white">
          {violations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No automated issues detected under this principle.</p>
          ) : (
            violations.map((v) => <ViolationFixCard key={`${v.id}-${v.wcagCriteria}`} violation={v} />)
          )}
        </div>
      )}
    </section>
  );
}

export default function A11yFixResult() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const urlParam = params.get("url") ?? "";
  const auditIdParam = params.get("auditId") ?? "";
  const intent = parseIntent(params.get("intent"));
  const rescanKey = params.get("rescan") ?? "";

  const { audit, isLoading, isError } = useA11yFixAudit({
    urlParam,
    auditIdParam,
    rescanKey,
    intent,
  });

  const violations = audit?.violations ?? [];
  const pourGroups = useMemo(() => groupViolationsByPour(violations), [violations]);
  const difficultyCounts = useMemo(() => countByDifficulty(violations), [violations]);
  const actionPlan = useMemo(() => buildFixActionPlan(violations), [violations]);
  const manualFollowUps = useMemo(() => getManualFollowUpsFromViolations(violations), [violations]);
  const upsell = useMemo(() => recommendedUpsell(violations, intent), [violations, intent]);
  const compliance = audit?.complianceReport ?? audit?.scanMetadata?.complianceReport;

  const planHref = audit?.auditId
    ? `/a11y-fix/plan?auditId=${audit.auditId}&intent=${intent}`
    : undefined;

  if (!urlParam && !auditIdParam) {
    return (
      <div className="container mx-auto max-w-2xl py-24 px-4 text-center">
        <h1 className="text-2xl font-extrabold font-sans mb-4">No URL provided</h1>
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
            <Sparkles className="w-4 h-4 text-primary" aria-hidden />
            <p className="text-xs font-semibold text-primary uppercase tracking-widest font-sans">A11y Fix results</p>
          </div>
          <A11yFixJourneyStepper current="scan" planHref={planHref} />
          <div>
            <h1 className="text-display-md font-extrabold mb-2 break-all">{audit?.url ?? urlParam}</h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
              BITV 2.0 / BFSG strict scan · grouped by POUR
            </p>
          </div>
        </div>
      </section>

      {isLoading && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-3xl text-center space-y-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" aria-hidden />
            <p className="text-sm text-muted-foreground">Scanning against EN 301 549…</p>
            <AuditPendingScanFrame displayUrl={urlParam || audit?.url || ""} />
          </div>
        </section>
      )}

      {isError && (
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <AlertOctagon className="w-10 h-10 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">We could not scan this URL. Check it is public and reachable.</p>
            <Button asChild>
              <Link href="/solutions/a11y-fix">Try again</Link>
            </Button>
          </div>
        </section>
      )}

      {audit && !isLoading && (
        <>
          <section className="py-10 px-4 bg-white border-b">
            <div className="container mx-auto max-w-5xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-extrabold font-sans">{audit.score}</p>
                    <p className="text-xs text-muted-foreground mt-1">Score / 100</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-extrabold font-sans text-red-600">{audit.criticalViolations}</p>
                    <p className="text-xs text-muted-foreground mt-1">Critical</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-extrabold font-sans">{difficultyCounts.quick_win}</p>
                    <p className="text-xs text-muted-foreground mt-1">Quick wins</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-extrabold font-sans text-rose-600">{difficultyCounts.expert}</p>
                    <p className="text-xs text-muted-foreground mt-1">Need engineers</p>
                  </CardContent>
                </Card>
              </div>

              {audit.pageScreenshot && (
                <div className="rounded-2xl border border-border overflow-hidden mb-6">
                  <img
                    src={audit.pageScreenshot}
                    alt="Screenshot of scanned page"
                    className="w-full max-h-64 object-cover object-top"
                  />
                </div>
              )}

              {compliance && (
                <div className="rounded-2xl border border-border bg-muted/20 p-6 mb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h2 className="font-bold font-sans text-base">BITV 2.0 / BFSG assessment</h2>
                    <ComplianceStatusBadge status={compliance.overallStatus} />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">{compliance.summaryDe}</p>
                  {compliance.supplementalFindings?.length > 0 && (
                    <ul className="text-xs space-y-1 mb-4">
                      {compliance.supplementalFindings
                        .filter((f) => f.status !== "pass")
                        .slice(0, 4)
                        .map((f) => (
                          <li key={f.id} className="text-muted-foreground">
                            <span className="font-semibold text-foreground">{f.titleDe}: </span>
                            {f.description}
                          </li>
                        ))}
                    </ul>
                  )}
                  {compliance.manualReviewRequired.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                      <p className="text-xs font-semibold font-sans text-amber-900 mb-2">
                        Requires manual review (cannot be automated)
                      </p>
                      <ul className="text-xs text-amber-900/90 space-y-1 list-disc pl-4">
                        {compliance.manualReviewRequired.slice(0, 4).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <Button asChild variant="link" className="h-auto p-0 mt-3 text-xs text-amber-900">
                        <Link href={intentContactHref("self", { url: audit.url, auditId: audit.auditId })}>
                          Book manual audit for sign-off →
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {actionPlan.length > 0 && planHref && (
                <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="font-bold font-sans text-base mb-1">Step 3 — Your fix plan is ready</h2>
                      <p className="text-sm text-muted-foreground">
                        {actionPlan.length} prioritized items — {difficultyCounts.quick_win} quick wins to start with.
                      </p>
                    </div>
                    <Button asChild className="btn-gsap h-12 px-8 font-semibold shrink-0">
                      <Link href={planHref}>
                        Open fix plan <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                  <ol className="mt-4 space-y-2">
                    {actionPlan.slice(0, 3).map((item, i) => (
                      <li key={item.id} className="flex items-start gap-2 text-sm">
                        <span className="text-xs font-bold text-primary font-sans w-5 shrink-0">{i + 1}.</span>
                        <span className="text-foreground">{item.title}</span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold rounded-full border px-2 py-0.5 shrink-0",
                            difficultyBadgeClass(item.difficulty),
                          )}
                        >
                          {difficultyLabel(item.difficulty)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {audit.auditId && (
                  <Button asChild variant="outline" size="sm" className="[box-shadow:none]">
                    <a
                      href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/audit/${audit.auditId}/pdf`}
                      download
                    >
                      <FileDown className="w-4 h-4 mr-2" /> Download PDF
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline" size="sm" className="[box-shadow:none]">
                  <Link
                    href={`/audit-result?auditId=${audit.auditId}&url=${encodeURIComponent(audit.url)}&profile=strict&multiViewport=1`}
                  >
                    Full technical report →
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="[box-shadow:none]">
                  <Link href="/solutions/a11y-fix">Scan another site</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="py-12 px-4 warm-section">
            <div className="container mx-auto max-w-5xl space-y-5">
              <div className="mb-6">
                <h2 className="text-display-md font-extrabold mb-2">
                  Issues by <span className="heading-accent">principle.</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {intent === "self" &&
                    "Start with quick wins in each section. Escalate expert items to our remediation team when needed."}
                  {intent === "engineers" &&
                    "We scoped this scan for a remediation sprint. Expert items are highlighted — book a call to confirm sprint size."}
                  {intent === "monitor" &&
                    "This is your compliance baseline. Set up monitoring to catch regressions after you ship fixes."}
                </p>
              </div>

              {POUR_PRINCIPLES.map((p, idx) => (
                <PourSectionBlock
                  key={p.name}
                  principleIndex={idx}
                  violations={pourGroups[p.name]}
                  defaultOpen={pourGroups[p.name].length > 0 && idx === 0}
                />
              ))}

              {manualFollowUps.length > 0 && (
                <div className="rounded-2xl border border-primary/15 bg-background p-6">
                  <h3 className="font-bold font-sans text-sm mb-3">Recommended manual checks</h3>
                  <ul className="space-y-2">
                    {manualFollowUps.map((item) => (
                      <li key={item.id} className="text-sm">
                        <span className="font-semibold font-sans">{item.title}. </span>
                        <span className="text-muted-foreground">{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className="py-12 px-4 bg-white">
            <div className="container mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
              {intent === "monitor" ? (
                <A11yFixMonitorSetup url={audit.url} auditId={audit.auditId} />
              ) : (
                <div className="rounded-2xl border border-border p-6 flex flex-col justify-center">
                  <h3 className="font-bold font-sans text-sm mb-2">Step 4 — Act on your plan</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Mark items done in the fix plan, re-scan to verify, or book engineers for the hard parts.
                  </p>
                  {planHref && (
                    <Button asChild className="h-11 font-semibold mb-3">
                      <Link href={planHref}>Open interactive fix plan →</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="h-11 [box-shadow:none]">
                    <Link href={intentContactHref(intent, { url: audit.url, auditId: audit.auditId })}>
                      {upsell.cta}
                    </Link>
                  </Button>
                </div>
              )}
              <A11yFixToolkitLinks scannedUrl={audit.url} />
            </div>
          </section>

          <section className="py-16 px-4 bg-foreground text-background">
            <div className="container mx-auto max-w-3xl text-center">
              <h2 className="text-2xl font-extrabold font-sans mb-3 text-white">{upsell.title}</h2>
              <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">{upsell.body}</p>
              <Button asChild className="btn-gsap h-12 px-8 font-semibold">
                <Link href={intentContactHref(intent, { url: audit.url, auditId: audit.auditId })}>{upsell.cta}</Link>
              </Button>
            </div>
          </section>

          <section className="py-16 px-4 warm-section">
            <div className="container mx-auto max-w-xl">
              <div className="rounded-2xl border bg-background p-8">
                <h2 className="font-extrabold font-sans text-lg mb-2">Get the full report by email</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Automated scans catch roughly 30% of WCAG issues. Leave your details and we will send context on what
                  automation missed.
                </p>
                <A11yFixLeadCapture auditId={audit.auditId} />
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <Link
                  href="/services/remediation"
                  className="rounded-xl border p-5 hover:border-primary transition-colors group bg-background"
                >
                  <p className="font-bold font-sans mb-1 group-hover:text-primary">Remediation sprints</p>
                  <p className="text-xs text-muted-foreground">PRs in your repo, WCAG-cited fixes.</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3">
                    Learn more <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
                <Link
                  href="/services/monitoring"
                  className="rounded-xl border p-5 hover:border-primary transition-colors group bg-background"
                >
                  <p className="font-bold font-sans mb-1 group-hover:text-primary">Monitoring retainer</p>
                  <p className="text-xs text-muted-foreground">Re-scans, CI gates, regression alerts.</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-3">
                    Learn more <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
