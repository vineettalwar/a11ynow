"use client";

import { useReducer, useEffect, useState } from "react";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { ExternalLink, ClipboardCopy, RotateCcw, ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WCAG_CRITERIA, PRINCIPLES, getCriteriaByGuideline, type WcagStatus } from "@/data/wcag-21-aa";

const STORAGE_KEY = "accessibility-now:wcag-checklist";

type State = Record<string, WcagStatus>;

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

type Action =
  | { type: "SET"; id: string; status: WcagStatus }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: State };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "SET": {
      const next = { ...state, [action.id]: action.status };
      saveState(next);
      return next;
    }
    case "RESET": {
      saveState({});
      return {};
    }
    default:
      return state;
  }
}

const STATUS_OPTIONS: { value: WcagStatus; label: string; short: string }[] = [
  { value: "pass", label: "Pass", short: "P" },
  { value: "fail", label: "Fail", short: "F" },
  { value: "na", label: "N/A", short: "N" },
];

function statusClasses(status: WcagStatus, value: WcagStatus) {
  if (status !== value) {
    return "border border-border bg-background text-muted-foreground hover:border-muted-foreground transition-colors";
  }
  if (value === "pass") return "border border-green-600 bg-green-50 text-green-700 font-semibold";
  if (value === "fail") return "border border-red-500 bg-red-50 text-red-700 font-semibold";
  return "border border-slate-400 bg-slate-100 text-slate-700 font-semibold";
}

function rowBg(status: WcagStatus) {
  if (status === "pass") return "bg-green-50/60 border-green-100";
  if (status === "fail") return "bg-red-50/60 border-red-100";
  if (status === "na") return "bg-slate-50/80 border-slate-100";
  return "bg-background border-border";
}

function StatusIcon({ status }: { status: WcagStatus }) {
  if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />;
  if (status === "fail") return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  if (status === "na") return <MinusCircle className="w-4 h-4 text-slate-400 shrink-0" />;
  return <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />;
}

export default function WcagChecklist() {
  const [state, dispatch] = useReducer(reducer, {});
  const [openGuidelines, setOpenGuidelines] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch({ type: "HYDRATE", state: loadState() });
  }, []);

  const total = WCAG_CRITERIA.length;
  const reviewed = WCAG_CRITERIA.filter((c) => state[c.id] && state[c.id] !== "untouched").length;
  const passes = WCAG_CRITERIA.filter((c) => state[c.id] === "pass").length;
  const failures = WCAG_CRITERIA.filter((c) => state[c.id] === "fail").length;
  const nas = WCAG_CRITERIA.filter((c) => state[c.id] === "na").length;
  const progressPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;

  useEffect(() => {
    const allKeys = WCAG_CRITERIA.map((c) => c.guideline);
    const unique = [...new Set(allKeys)];
    const initial: Record<string, boolean> = {};
    unique.forEach((g) => { initial[g] = true; });
    setOpenGuidelines(initial);
  }, []);

  function toggleGuideline(guideline: string) {
    setOpenGuidelines((prev) => ({ ...prev, [guideline]: !prev[guideline] }));
  }

  function setStatus(id: string, value: WcagStatus) {
    const current = state[id];
    dispatch({ type: "SET", id, status: current === value ? "untouched" : value });
  }

  function handleReset() {
    dispatch({ type: "RESET" });
  }

  function copySummary() {
    const failedItems = WCAG_CRITERIA.filter((c) => state[c.id] === "fail");
    const lines = [
      "WCAG 2.1 AA Checklist - Failure Summary",
      `Date: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`,
      `Reviewed: ${reviewed}/${total} criteria`,
      `Passed: ${passes}  |  Failed: ${failures}  |  N/A: ${nas}`,
      "",
      failedItems.length === 0
        ? "No failures recorded."
        : `Failures (${failedItems.length}):`,
      ...failedItems.map((c) => `  ${c.number} ${c.title} [${c.level}] - ${c.description}`),
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <ToolPageLayout
      eyebrow="50 criteria · Local save"
      title={
        <>
          WCAG 2.1 AA<br />
          <span className="heading-accent">interactive checklist.</span>
        </>
      }
      description="Work through all 50 WCAG 2.1 AA success criteria. Mark each as Pass, Fail, or N/A - progress is saved in your browser automatically."
      contentMaxWidth="max-w-5xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* Sidebar */}
            <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-2xl bg-foreground text-background p-6">
                <p className="text-xs uppercase tracking-widest mb-1 text-background/60 font-sans">Progress</p>
                <p className="text-4xl font-extrabold font-sans">
                  {reviewed}<span className="text-background/40">/{total}</span>
                </p>
                <div className="mt-3 h-2 rounded-full bg-background/20 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                    role="progressbar"
                    aria-valuenow={reviewed}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-label="Criteria reviewed"
                  />
                </div>
                <p className="text-xs text-background/50 mt-2 font-sans">{progressPct}% reviewed</p>

                <div className="mt-4 pt-4 border-t border-background/10 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-400 font-sans">{passes}</p>
                    <p className="text-xs text-background/50 font-sans">Pass</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-400 font-sans">{failures}</p>
                    <p className="text-xs text-background/50 font-sans">Fail</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-background/60 font-sans">{nas}</p>
                    <p className="text-xs text-background/50 font-sans">N/A</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 [box-shadow:none] text-sm"
                  onClick={copySummary}
                >
                  <ClipboardCopy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy summary"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 [box-shadow:none] text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset all selections?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear every Pass, Fail, and N/A selection and cannot be undone. Your progress will be permanently removed from this browser.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Reset checklist
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="rounded-xl border p-4 bg-background text-xs text-muted-foreground space-y-2">
                <p className="font-bold font-sans text-foreground">How to use</p>
                <p>For each criterion, mark <strong>Pass</strong> if it's met, <strong>Fail</strong> if it's not, or <strong>N/A</strong> if it doesn't apply to your content. Click again to deselect.</p>
                <p>Your progress is saved automatically in this browser. Use "Copy summary" to get a plain-text list of all failures.</p>
              </div>

              <div className="rounded-xl border p-4 bg-background text-xs text-muted-foreground">
                <p className="font-bold font-sans text-foreground mb-1">Level guide</p>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-foreground text-background font-sans">A</span>
                  <span>Minimum level - must meet.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-foreground text-foreground font-sans">AA</span>
                  <span>Standard level - required for most regulations.</span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="lg:col-span-2 space-y-10">
              {PRINCIPLES.map((principle) => {
                const guidelines = getCriteriaByGuideline(principle);
                const principleTotal = guidelines.flatMap((g) => g.criteria).length;
                const principleReviewed = guidelines.flatMap((g) => g.criteria).filter((c) => state[c.id] && state[c.id] !== "untouched").length;
                const principleFails = guidelines.flatMap((g) => g.criteria).filter((c) => state[c.id] === "fail").length;

                return (
                  <div key={principle}>
                    <div className="flex items-baseline gap-3 mb-5 pb-3 border-b">
                      <h2 className="text-xl font-extrabold font-sans">{principle}</h2>
                      <span className="text-xs text-muted-foreground font-sans">
                        {principleReviewed}/{principleTotal} reviewed
                        {principleFails > 0 && (
                          <span className="ml-2 text-red-500 font-semibold">{principleFails} {principleFails === 1 ? "failure" : "failures"}</span>
                        )}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {guidelines.map(({ guideline, guidelineTitle, criteria }) => {
                        const isOpen = openGuidelines[guideline] !== false;
                        const guidelineFails = criteria.filter((c) => state[c.id] === "fail").length;
                        const guidelineReviewed = criteria.filter((c) => state[c.id] && state[c.id] !== "untouched").length;

                        return (
                          <div key={guideline} className="rounded-2xl border overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between px-5 py-4 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
                              onClick={() => toggleGuideline(guideline)}
                              aria-expanded={isOpen}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-muted-foreground">{guideline}</span>
                                <span className="text-sm font-bold font-sans">{guidelineTitle}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-muted-foreground font-sans hidden sm:block">
                                  {guidelineReviewed}/{criteria.length}
                                  {guidelineFails > 0 && (
                                    <span className="ml-2 text-red-500 font-semibold">{guidelineFails}✕</span>
                                  )}
                                </span>
                                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            </button>

                            {isOpen && (
                              <ul className="divide-y divide-border" aria-label={`${guidelineTitle} criteria`}>
                                {criteria.map((criterion) => {
                                  const currentStatus = state[criterion.id] || "untouched";
                                  return (
                                    <li key={criterion.id} className={`px-5 py-4 border-t transition-colors ${rowBg(currentStatus)}`}>
                                      <div className="flex items-start gap-3">
                                        <StatusIcon status={currentStatus} />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-muted-foreground">{criterion.number}</span>
                                            <span className="text-sm font-bold font-sans">{criterion.title}</span>
                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-sans ${criterion.level === "A" ? "bg-foreground text-background" : "border border-foreground text-foreground"}`}>
                                              {criterion.level}
                                            </span>
                                            <a
                                              href={criterion.specUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-muted-foreground hover:text-primary transition-colors"
                                              aria-label={`WCAG spec for ${criterion.title} (opens in new tab)`}
                                            >
                                              <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                          </div>
                                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{criterion.description}</p>
                                          <div className="flex gap-1.5" role="group" aria-label={`Status for ${criterion.number} ${criterion.title}`}>
                                            {STATUS_OPTIONS.map(({ value, label }) => (
                                              <button
                                                key={value}
                                                onClick={() => setStatus(criterion.id, value)}
                                                aria-pressed={currentStatus === value}
                                                className={`px-3 py-1 rounded-lg text-xs transition-all ${statusClasses(currentStatus, value)}`}
                                              >
                                                {label}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
      </div>
    </ToolPageLayout>
  );
}
