import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Mail,
  FileDown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useCreateLead } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AuditViolation {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  affectedElements: number;
  topSelectors: string[];
}

interface BatchPageResult {
  auditId: string;
  url: string;
  score: number;
  level: "critical" | "poor" | "moderate" | "good" | "excellent";
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  passedChecks: number;
  totalChecks: number;
  scannedAt: string;
  status: "success" | "error";
  error?: string;
}

interface CrossPageViolation {
  id: string;
  wcagCriteria: string;
  description: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  pageCount: number;
  totalAffectedElements: number;
  affectedUrls: string[];
}

interface BatchAuditResult {
  siteScore: number;
  siteLevel: "critical" | "poor" | "moderate" | "good" | "excellent";
  pages: BatchPageResult[];
  crossPageViolations: CrossPageViolation[];
  scannedAt: string;
}

const STORAGE_KEY = "batch_audit_result";

function levelColor(level: string) {
  switch (level) {
    case "excellent": return "text-emerald-600";
    case "good": return "text-yellow-600";
    case "moderate": return "text-orange-500";
    case "poor": return "text-red-500";
    case "critical": return "text-destructive";
    default: return "text-foreground";
  }
}

function scoreRingColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 50) return "text-yellow-500";
  return "text-destructive";
}

function impactBadgeVariant(impact: string): "destructive" | "default" | "secondary" | "outline" {
  if (impact === "critical") return "destructive";
  if (impact === "serious") return "default";
  return "secondary";
}

function LeadCaptureCard({ pages }: { pages: BatchPageResult[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();
  const firstAuditId = pages.find((p) => p.status === "success" && p.auditId)?.auditId ?? "";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    createLead.mutate(
      { data: { name: name.trim(), email: email.trim(), auditId: firstAuditId } },
      { onSuccess: () => setSubmitted(true) }
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <p className="font-bold font-sans text-sm mb-1">We'll be in touch.</p>
          <p className="text-xs text-muted-foreground">
            Your full multi-page report will be sent to{" "}
            <span className="font-medium text-foreground">{email}</span> within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="batch-lead-name" className="text-xs font-semibold font-sans block mb-1.5">
            Your name
          </label>
          <Input
            id="batch-lead-name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="batch-lead-email" className="text-xs font-semibold font-sans block mb-1.5">
            Work email
          </label>
          <Input
            id="batch-lead-email"
            type="email"
            placeholder="jane@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-11 text-sm font-semibold"
        disabled={createLead.isPending || !name.trim() || !email.trim()}
      >
        {createLead.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...</>
        ) : (
          "Get the full multi-page report →"
        )}
      </Button>
      {createLead.isError && (
        <p className="text-xs text-destructive text-center">Something went wrong. Please try again.</p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        No spam. We'll send one report and follow up once.
      </p>
    </form>
  );
}

function DownloadBatchPdf({ pages }: { pages: BatchPageResult[] }) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const successIds = pages.filter((p) => p.status === "success" && p.auditId).map((p) => p.auditId);

  async function download() {
    if (successIds.length === 0) {
      toast({ title: "No successful scans", description: "No pages were scanned successfully.", variant: "destructive" });
      return;
    }
    setIsPending(true);
    try {
      const resp = await fetch(`${BASE}/api/audit/batch-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditIds: successIds }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `accessibility-batch-report-${successIds.length}pages.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Report generation failed",
        description: "Could not generate the multi-page PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      onClick={download}
      disabled={isPending || successIds.length === 0}
      variant="outline"
      className="h-11 px-5 text-sm font-semibold border-foreground/20 bg-white/80 hover:bg-white gap-2"
    >
      {isPending ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
      ) : (
        <><FileDown className="w-4 h-4" /> Download Report</>
      )}
    </Button>
  );
}

export default function BatchResult() {
  const [result, setResult] = useState<BatchAuditResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setNotFound(true);
      return;
    }
    try {
      setResult(JSON.parse(raw) as BatchAuditResult);
    } catch {
      setNotFound(true);
    }
  }, []);

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <AlertOctagon className="w-10 h-10 text-destructive mx-auto mb-6" />
        <h1 className="text-display-md font-extrabold mb-4">No batch result found.</h1>
        <p className="text-muted-foreground mb-8">
          Run a multi-page scan from the homepage to see results here.
        </p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="hero-gradient min-h-[80vh] flex items-center justify-center px-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const scannedDate = new Date(result.scannedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const successCount = result.pages.filter((p) => p.status === "success").length;
  const errorCount = result.pages.filter((p) => p.status === "error").length;

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <section className="hero-gradient pt-16 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <h1 className="text-display-md font-extrabold mb-3">
                Multi-page <span className="heading-accent">audit result.</span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                {result.pages.length} page{result.pages.length !== 1 ? "s" : ""} scanned · {scannedDate}
                {errorCount > 0 && (
                  <span className="text-orange-500 ml-2">· {errorCount} page{errorCount !== 1 ? "s" : ""} failed</span>
                )}
              </p>
            </div>
            <div className="shrink-0">
              <DownloadBatchPdf pages={result.pages.filter((p) => p.status === "success")} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-5xl space-y-12">

          {/* Site-wide score */}
          <div>
            <h2 className="text-lg font-extrabold font-sans mb-5">Site-wide score</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
                      <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="9" fill="transparent" className="text-muted" />
                      <circle
                        cx="64" cy="64" r="54"
                        stroke="currentColor"
                        strokeWidth="9"
                        fill="transparent"
                        strokeDasharray="339"
                        strokeDashoffset={339 - (339 * result.siteScore) / 100}
                        className={scoreRingColor(result.siteScore)}
                      />
                    </svg>
                    <div className="absolute text-3xl font-extrabold font-sans">{result.siteScore}</div>
                  </div>
                  <h3 className={`text-base font-bold font-sans capitalize ${levelColor(result.siteLevel)}`}>
                    {result.siteLevel}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Average across {successCount} page{successCount !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                {[
                  {
                    value: result.pages.reduce((s, p) => s + p.criticalViolations, 0),
                    label: "Critical Violations",
                    color: "text-destructive",
                  },
                  {
                    value: result.pages.reduce((s, p) => s + p.seriousViolations, 0),
                    label: "Serious Violations",
                    color: "text-primary",
                  },
                  {
                    value: result.crossPageViolations.length,
                    label: "Unique Violation Types",
                    color: "text-foreground",
                  },
                  {
                    value: `${successCount}/${result.pages.length}`,
                    label: "Pages Scanned",
                    color: "text-emerald-600",
                  },
                ].map(({ value, label, color }) => (
                  <Card key={label}>
                    <CardContent className="p-5">
                      <div className={`text-3xl font-extrabold font-sans mb-1 ${color}`}>{value}</div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-sans">{label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Per-page score table */}
          <div>
            <h2 className="text-lg font-extrabold font-sans mb-5">Per-page results</h2>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold font-sans text-xs uppercase tracking-wide">URL</th>
                    <th className="text-center px-4 py-3 font-semibold font-sans text-xs uppercase tracking-wide">Score</th>
                    <th className="text-center px-4 py-3 font-semibold font-sans text-xs uppercase tracking-wide hidden sm:table-cell">Critical</th>
                    <th className="text-center px-4 py-3 font-semibold font-sans text-xs uppercase tracking-wide hidden sm:table-cell">Serious</th>
                    <th className="text-center px-4 py-3 font-semibold font-sans text-xs uppercase tracking-wide hidden md:table-cell">Total</th>
                    <th className="text-center px-4 py-3 font-semibold font-sans text-xs uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {result.pages.map((page) => (
                    <tr key={page.url} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs text-foreground truncate max-w-[200px] md:max-w-[300px]">{page.url}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {page.status === "success" ? (
                          <span className={`text-base font-extrabold font-sans ${levelColor(page.level)}`}>
                            {page.score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                        <span className="font-bold font-sans text-destructive">{page.criticalViolations}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                        <span className="font-bold font-sans text-primary">{page.seriousViolations}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center hidden md:table-cell">
                        <span className="font-semibold font-sans">{page.totalViolations}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {page.status === "success" ? (
                          <Badge variant="outline" className={`text-xs capitalize border-current ${levelColor(page.level)}`}>
                            {page.level}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Failed</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {page.status === "success" && page.auditId ? (
                          <Link
                            href={`/audit-result?auditId=${page.auditId}&url=${encodeURIComponent(page.url)}`}
                            className="text-primary hover:underline text-xs font-semibold font-sans inline-flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cross-page violations */}
          {result.crossPageViolations.length > 0 && (
            <div>
              <h2 className="text-lg font-extrabold font-sans mb-2">Top violations across pages</h2>
              <p className="text-xs text-muted-foreground font-mono mb-5">
                Deduplicated by type · ranked by pages affected
              </p>
              <div className="space-y-3">
                {result.crossPageViolations.slice(0, 20).map((v) => (
                  <Card key={v.id} className="border-l-4 border-l-destructive">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2.5 mb-2">
                            <Badge variant={impactBadgeVariant(v.impact)} className="uppercase text-xs">
                              {v.impact}
                            </Badge>
                            <span className="font-mono text-xs font-medium text-muted-foreground">
                              {v.wcagCriteria}
                            </span>
                            {v.pageCount > 1 && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 rounded-full px-2 py-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                {v.pageCount} pages
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold font-sans mb-1">{v.description}</h4>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {v.affectedUrls.map((u) => (
                              <span key={u} className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]">{u}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-extrabold font-sans">{v.totalAffectedElements}</div>
                          <div className="text-xs text-muted-foreground font-mono">total elements</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Lead capture */}
          <Card className="border-2 border-primary/20 bg-background">
            <CardContent className="p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                <div className="md:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-extrabold font-sans mb-2">
                    Get the full report.
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Automated tools catch ~30% of WCAG violations. Leave your details and we'll
                    send a combined report with manual findings across all {result.pages.length} pages - no obligation.
                  </p>
                </div>
                <div className="md:col-span-3">
                  <LeadCaptureCard pages={result.pages} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download Report CTA at bottom of results */}
          <div className="flex justify-center pt-2 pb-4">
            <DownloadBatchPdf pages={result.pages} />
          </div>
        </div>
      </section>

      {/* Upsell CTA */}
      <section className="py-16 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-display-md font-extrabold text-white mb-4">
            This is only an<br />
            <span style={{ color: "#FF4D1C", fontStyle: "italic" }}>automated snapshot.</span>
          </h2>
          <p className="text-gray-400 text-sm mb-10 max-w-xl mx-auto">
            Automated tools detect roughly 30% of WCAG violations. A full manual audit with
            screen readers across all your key pages will reveal 3–5× more issues - and is required for legal sign-off.
          </p>
          <Button asChild className="h-12 px-8 text-sm font-bold">
            <Link href="/contact">Get a full audit <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
