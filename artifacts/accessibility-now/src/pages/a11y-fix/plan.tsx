import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { A11yFixJourneyStepper } from "@/components/a11y-fix/journey-stepper";
import { A11yFixLeadCapture } from "@/components/a11y-fix/lead-capture";
import { A11yFixMonitorSetup } from "@/components/a11y-fix/monitor-setup";
import { A11yFixToolkitLinks } from "@/components/a11y-fix/toolkit-links";
import { POUR_PRINCIPLES } from "@/data/pour-principles";
import {
  buildFixActionPlan,
  difficultyBadgeClass,
  difficultyLabel,
  intentContactHref,
  loadPlanProgress,
  savePlanProgress,
  type A11yFixIntent,
  type FixActionItem,
} from "@/lib/a11y-fix";
import { useA11yFixAudit } from "@/hooks/use-a11y-fix-audit";
import { cn } from "@/lib/utils";

const VALID_INTENTS: A11yFixIntent[] = ["self", "engineers", "monitor"];

function parseIntent(raw: string | null): A11yFixIntent {
  return VALID_INTENTS.includes(raw as A11yFixIntent) ? (raw as A11yFixIntent) : "self";
}

function PlanItemRow({
  item,
  done,
  onToggle,
}: {
  item: FixActionItem;
  done: boolean;
  onToggle: () => void;
}) {
  const meta = POUR_PRINCIPLES.find((p) => p.name === item.principle);

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        done ? "border-emerald-200 bg-emerald-50/40 opacity-80" : "border-border bg-background",
      )}
    >
      <div className="flex gap-3 items-start">
        <button
          type="button"
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          aria-pressed={done}
          aria-label={done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
        >
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-bold font-sans uppercase", meta?.color)}>
              {item.principle}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold font-sans rounded-full border px-2 py-0.5",
                difficultyBadgeClass(item.difficulty),
              )}
            >
              {difficultyLabel(item.difficulty)}
            </span>
          </div>
          <p className={cn("font-semibold font-sans text-sm", done && "line-through text-muted-foreground")}>
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{item.plainLead}</p>
          {item.help && !done && (
            <p className="text-xs text-foreground mt-2 leading-relaxed">
              <span className="font-semibold">Fix: </span>
              {item.help}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {item.relatedToolPath && (
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2">
                <Link href={item.relatedToolPath}>Open tool</Link>
              </Button>
            )}
            {item.helpUrl && (
              <a
                href={item.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary px-2 py-1 hover:underline"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {item.difficulty === "expert" && (
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs px-2 text-rose-700">
                <Link href="/contact?service=remediation&source=a11y-fix">Ask engineers →</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function A11yFixPlan() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const auditIdParam = params.get("auditId") ?? "";
  const urlParam = params.get("url") ?? "";
  const intent = parseIntent(params.get("intent"));

  const { audit, isLoading, isError } = useA11yFixAudit({
    urlParam,
    auditIdParam,
    rescanKey: "",
    intent,
    allowScan: false,
  });

  const plan = useMemo(() => buildFixActionPlan(audit?.violations ?? []), [audit?.violations]);
  const [completed, setCompleted] = useState<Set<string>>(() =>
    auditIdParam ? loadPlanProgress(auditIdParam) : new Set(),
  );

  useEffect(() => {
    if (auditIdParam) setCompleted(loadPlanProgress(auditIdParam));
  }, [auditIdParam]);

  function toggleItem(id: string) {
    if (!audit?.auditId) return;
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      savePlanProgress(audit.auditId, next);
      return next;
    });
  }

  const doneCount = plan.filter((p) => completed.has(p.id)).length;
  const progressPct = plan.length > 0 ? Math.round((doneCount / plan.length) * 100) : 0;
  const expertRemaining = plan.filter((p) => p.difficulty === "expert" && !completed.has(p.id)).length;

  const planHref = audit?.auditId
    ? `/a11y-fix/plan?auditId=${audit.auditId}&intent=${intent}`
    : undefined;

  if (!auditIdParam && !urlParam) {
    return (
      <div className="container mx-auto max-w-2xl py-24 px-4 text-center">
        <h1 className="text-2xl font-extrabold font-sans mb-4">No scan to plan from</h1>
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
            <p className="text-xs font-semibold text-primary uppercase tracking-widest font-sans">A11y Fix · Action plan</p>
          </div>
          <A11yFixJourneyStepper current="plan" planHref={planHref} />
          <div>
            <h1 className="text-display-md font-extrabold mb-2">Your fix roadmap</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {audit?.url
                ? `Prioritized for ${audit.url} — quick wins first, expert items flagged for engineers.`
                : "Loading your prioritized fix list…"}
            </p>
          </div>
        </div>
      </section>

      {isLoading && (
        <section className="py-16 px-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading scan data…</p>
        </section>
      )}

      {isError && (
        <section className="py-16 px-4 text-center">
          <AlertOctagon className="w-10 h-10 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-6">Could not load this scan. Run a new one.</p>
          <Button asChild>
            <Link href="/solutions/a11y-fix">Start over</Link>
          </Button>
        </section>
      )}

      {audit && !isLoading && (
        <>
          <section className="py-10 px-4 bg-white border-b">
            <div className="container mx-auto max-w-3xl">
              <div className="rounded-2xl border border-border p-6 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <p className="text-3xl font-extrabold font-sans">{progressPct}%</p>
                    <p className="text-xs text-muted-foreground">
                      {doneCount} of {plan.length} items marked done
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground" style={{ fontFamily: "var(--app-font-mono)" }}>
                    Score {audit.score}/100 · {expertRemaining} expert items left
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Fix plan progress"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="btn-gsap h-11 font-semibold">
                  <Link
                    href={`/a11y-fix/result?auditId=${audit.auditId}&url=${encodeURIComponent(audit.url)}&intent=${intent}&rescan=${Date.now()}`}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Re-scan to verify
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 [box-shadow:none]">
                  <Link href={intentContactHref(intent, { url: audit.url, auditId: audit.auditId })}>
                    {intent === "engineers" ? "Book remediation →" : intent === "monitor" ? "Discuss monitoring →" : "Book manual audit →"}
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="py-12 px-4 warm-section">
            <div className="container mx-auto max-w-3xl space-y-3">
              {plan.length === 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                  <p className="font-bold font-sans">No automated issues found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Manual review is still recommended for full BFSG sign-off.
                  </p>
                </div>
              ) : (
                plan.map((item) => (
                  <PlanItemRow
                    key={item.id}
                    item={item}
                    done={completed.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="py-12 px-4 bg-white">
            <div className="container mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6">
              {intent === "monitor" ? (
                <A11yFixMonitorSetup url={audit.url} auditId={audit.auditId} />
              ) : (
                <div className="rounded-2xl border border-border p-6">
                  <h3 className="font-bold font-sans text-sm mb-2">Need help shipping fixes?</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {expertRemaining > 0
                      ? `${expertRemaining} items need engineering expertise. Our team ships PRs citing WCAG criteria.`
                      : "Your backlog looks manageable — a manual audit validates what automation cannot see."}
                  </p>
                  <Button asChild className="w-full h-11 font-semibold">
                    <Link href={intentContactHref(intent, { url: audit.url, auditId: audit.auditId })}>
                      Talk to an engineer <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
              <A11yFixToolkitLinks scannedUrl={audit.url} />
            </div>
          </section>

          <section className="py-12 px-4 warm-section">
            <div className="container mx-auto max-w-xl rounded-2xl border bg-background p-8">
              <h2 className="font-extrabold font-sans text-lg mb-2">Get the full report</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We will email what automation missed and what a manual audit would cover.
              </p>
              <A11yFixLeadCapture auditId={audit.auditId} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
