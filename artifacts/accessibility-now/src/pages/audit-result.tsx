import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCreateAudit,
  useCreateLead,
  getAudit,
  getGetAuditQueryKey,
} from "@workspace/api-client-react";
import type { AuditResult, AuditViolation } from "@workspace/api-client-react";
import { AuditResultLevel } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertOctagon,
  Loader2,
  CheckCircle2,
  Mail,
  FileDown,
  Activity,
  ExternalLink,
  ImageIcon,
  MapPin,
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AuditPendingScanFrame } from "@/components/audit-pending-scan-frame";

/** Match audit rows to the URL the user asked to scan (same origin as API normalisation). */
function normalizeUrlForCompare(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    u.hash = "";
    return u.href;
  } catch {
    return t.toLowerCase();
  }
}

function stripWwwHost(host: string): string {
  const h = host.toLowerCase();
  return h.startsWith("www.") ? h.slice(4) : h;
}

/**
 * Whether two URL strings are the same audit target for this page. The API returns the
 * final URL after redirects (often different path or scheme than the query string); we
 * only require the same site (hostname, www-insensitive).
 */
function urlsMatchForAudit(a: string, b: string): boolean {
  const ta = a.trim();
  const tb = b.trim();
  if (!ta || !tb) return false;
  try {
    const ua = new URL(/^https?:\/\//i.test(ta) ? ta : `https://${ta}`);
    const ub = new URL(/^https?:\/\//i.test(tb) ? tb : `https://${tb}`);
    return stripWwwHost(ua.hostname) === stripWwwHost(ub.hostname);
  } catch {
    return normalizeUrlForCompare(a) === normalizeUrlForCompare(b);
  }
}

/**
 * True when the API row looks like a real scan (not an empty shell from a race, parse glitch, or bad cache).
 */
function auditRowLooksUsable(row: AuditResult | null | undefined): boolean {
  if (!row || typeof row.auditId !== "string" || !row.auditId) return false;
  if (typeof row.url !== "string" || !row.url.trim()) return false;
  if (typeof row.scannedAt !== "string") return false;
  const scannedMs = Date.parse(row.scannedAt);
  if (Number.isNaN(scannedMs) || scannedMs <= 0) return false;

  const totalChecks = typeof row.totalChecks === "number" ? row.totalChecks : 0;
  const passed = typeof row.passedChecks === "number" ? row.passedChecks : 0;
  const violationCount = Array.isArray(row.violations) ? row.violations.length : 0;
  const totalV = typeof row.totalViolations === "number" ? row.totalViolations : 0;

  return totalChecks > 0 || passed > 0 || violationCount > 0 || totalV > 0;
}

/**
 * Prefer a complete GET row when available; never let an empty/partial GET override the mutation response
 * for the same auditId (fixes all-zero / epoch UI after a successful scan).
 */
function mergeAuditRow(
  auditId: string,
  fromGet: AuditResult | undefined,
  fromPost: AuditResult | undefined,
): AuditResult | undefined {
  if (!auditId) return fromPost;

  const getIdMatch = fromGet?.auditId === auditId;
  const postIdMatch = fromPost?.auditId === auditId;

  const getUsable = Boolean(getIdMatch && auditRowLooksUsable(fromGet));
  const postUsable = Boolean(postIdMatch && auditRowLooksUsable(fromPost));

  if (getUsable) return fromGet;
  if (postUsable) return fromPost;
  if (postIdMatch) return fromPost;
  if (getIdMatch) return fromGet;
  return undefined;
}

/** API / cache should always send full rows; this prevents broken layout if anything is missing. */
function normalizeAuditResult(r: AuditResult): AuditResult {
  const violations = (Array.isArray(r.violations) ? r.violations : []).map((v) => ({
    ...v,
    topSelectors: Array.isArray(v.topSelectors) ? v.topSelectors : [],
    instanceDetails: Array.isArray(v.instanceDetails)
      ? v.instanceDetails.map((inst) => ({
          ...inst,
          checkDetails: Array.isArray(inst.checkDetails) ? inst.checkDetails : undefined,
        }))
      : undefined,
  }));
  const scannedOk = typeof r.scannedAt === "string" && !Number.isNaN(Date.parse(r.scannedAt));
  const pageScreenshot =
    typeof r.pageScreenshot === "string" && r.pageScreenshot.startsWith("data:image/")
      ? r.pageScreenshot
      : undefined;
  return {
    ...r,
    violations,
    score: typeof r.score === "number" && !Number.isNaN(r.score) ? r.score : 0,
    level: r.level ?? AuditResultLevel.moderate,
    totalViolations: typeof r.totalViolations === "number" ? r.totalViolations : violations.length,
    criticalViolations: typeof r.criticalViolations === "number" ? r.criticalViolations : 0,
    seriousViolations: typeof r.seriousViolations === "number" ? r.seriousViolations : 0,
    passedChecks: typeof r.passedChecks === "number" ? r.passedChecks : 0,
    totalChecks: typeof r.totalChecks === "number" ? r.totalChecks : 0,
    scannedAt: scannedOk ? r.scannedAt : new Date(0).toISOString(),
    scanEngine: r.scanEngine ?? "unknown",
    ...(pageScreenshot ? { pageScreenshot } : {}),
  };
}

function formatScannedAt(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "Date unavailable";
  return new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function violationRowClass(impact: AuditViolation["impact"]): string {
  const accent =
    impact === "critical"
      ? "border-l-destructive"
      : impact === "serious"
        ? "border-l-orange-500"
        : impact === "moderate"
          ? "border-l-amber-600"
          : "border-l-muted-foreground/45";
  return cn(
    "rounded-md border border-border border-l-2 bg-background p-5 shadow-none",
    accent,
  );
}

function primaryViolationSelector(violation: AuditViolation): string {
  const fromInst = violation.instanceDetails?.find((i) => i.selector?.trim())?.selector;
  if (fromInst?.trim()) return fromInst.trim();
  const fromTop = (violation.topSelectors ?? []).find((s) => Boolean(s?.trim()));
  return (fromTop ?? "").trim();
}

type ViolationVisualRegion =
  | "iframe-boundary"
  | "video-player"
  | "compact-control"
  | "heading-outline"
  | "iframe-generic"
  | "page-generic";

interface ViolationVisualModel {
  scope: "host" | "iframe";
  diagram: "host-iframe-shell" | "embed-interior" | "host-body";
  region: ViolationVisualRegion;
  whereLabel: string;
  effectLine: string;
  ownershipNote: string | null;
}

/** Selector chain enters an iframe’s document (e.g. `iframe > #x`). */
function selectorIsInsideIframeDocument(sel: string): boolean {
  const t = sel.trim();
  if (!t) return false;
  return /\biframe\s*>/i.test(t);
}

function violationVisualModel(violation: AuditViolation): ViolationVisualModel {
  const sel = primaryViolationSelector(violation);
  const lower = sel.toLowerCase();
  const insideEmbedDoc = selectorIsInsideIframeDocument(sel);
  const rule = violation.id;

  const youtubeLike =
    /movie_player|ytm|ytp-|youtube|yt-embed|yt-iframe|html5-video|video-player/.test(lower);

  let region: ViolationVisualRegion = insideEmbedDoc ? "iframe-generic" : "page-generic";
  if (rule === "frame-title") {
    region = "iframe-boundary";
  } else if (
    /#movie_player|\.html5-video|html5-video-player|ytp-player|ytp-video/.test(lower) ||
    (insideEmbedDoc && rule === "aria-prohibited-attr" && /player|video|movie/.test(lower))
  ) {
    region = "video-player";
  } else if (
    /avatar|channel|subscribe|ytm|\.ytp-/.test(lower) ||
    (insideEmbedDoc && rule === "button-name")
  ) {
    region = "compact-control";
  } else if (rule === "heading-order" || /^h[1-6]\b/.test(lower) || /heading/.test(lower)) {
    region = "heading-outline";
  }

  const scope: ViolationVisualModel["scope"] = insideEmbedDoc ? "iframe" : "host";
  const diagram: ViolationVisualModel["diagram"] =
    region === "iframe-boundary" ? "host-iframe-shell" : insideEmbedDoc ? "embed-interior" : "host-body";

  const whereParts: string[] = [];
  if (region === "iframe-boundary") {
    whereParts.push(
      "The `<iframe>` on your page — the embedded “window” between your document and third-party markup.",
    );
  } else if (region === "video-player") {
    whereParts.push(
      insideEmbedDoc
        ? "Inside that embed: the main video / player surface (the large interactive media area)."
        : "The main video or media player region on the page.",
    );
  } else if (region === "compact-control") {
    whereParts.push(
      insideEmbedDoc
        ? "Inside the embed: a small control near the video (often an icon, avatar, or chrome button)."
        : "A compact control on your page (often an icon-only button or avatar).",
    );
  } else if (region === "heading-outline") {
    whereParts.push(
      "In the page heading structure — the sequence of section titles screen readers use for navigation.",
    );
  } else if (insideEmbedDoc) {
    whereParts.push("Inside embedded content (an iframe), on the element described by the selector below.");
  } else {
    whereParts.push("On your page’s main document, on the element described by the selector below.");
  }

  const effectLine =
    violation.description ||
    "Assistive technology may not receive the same information a sighted user gets from layout and nearby text.";

  let ownershipNote: string | null = null;
  if (region === "iframe-boundary") {
    ownershipNote =
      "You control this element in your own template: add a concise `title` (or another accessible name) so users know what the embed is before they enter it.";
  } else if (insideEmbedDoc) {
    ownershipNote = youtubeLike
      ? "This selector matches markup inside a video embed (often YouTube). Inner player issues are usually owned by the vendor; you can still fix the outer iframe name, swap embeds, or document limitations."
      : "This selector points inside an embedded document. Your app may only control the outer iframe — not the widget’s inner HTML.";
  }

  return {
    scope,
    diagram,
    region,
    whereLabel: whereParts.join(" "),
    effectLine,
    ownershipNote,
  };
}

function ViolationWhereOnPage({ violation }: { violation: AuditViolation }) {
  const model = violationVisualModel(violation);
  const sel = primaryViolationSelector(violation);
  const { diagram, region } = model;

  const innerPulse =
    region === "video-player" ? "bg-primary/25" : region === "compact-control" ? "bg-primary/20" : "bg-muted/50";

  return (
    <div className="mt-4 rounded-lg border border-border bg-muted/25 p-4 md:p-5">
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-stretch">
        <div
          className="shrink-0 flex justify-center sm:justify-start"
          aria-hidden
        >
          <div className="relative w-[148px] rounded-lg border border-foreground/15 bg-linear-to-b from-muted/80 to-background p-2 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground text-center mb-1.5">
              Page layout
            </p>
            <div className="h-1.5 w-[85%] mx-auto rounded-full bg-foreground/12 mb-2" title="Site header / chrome" />
            {region === "heading-outline" ? (
              <div className="space-y-1 mb-2 px-1">
                <div className="h-1 w-3/4 rounded bg-foreground/15" />
                <div className="h-1 w-1/2 rounded bg-primary/50" />
                <div className="h-1 w-2/3 rounded bg-foreground/10" />
              </div>
            ) : (
              <div className="h-1 w-[55%] rounded bg-foreground/8 mb-2 ml-1" />
            )}

            {diagram === "host-body" ? (
              <div className="relative mx-auto rounded-md border border-foreground/20 bg-muted/40 min-h-[88px] w-[92%] p-2">
                {region === "compact-control" && (
                  <div className="absolute top-3 right-3 h-7 w-7 rounded-full border-2 border-primary bg-primary/15 shadow-sm" />
                )}
                {region === "page-generic" && (
                  <div className="absolute inset-2 rounded-sm bg-foreground/6" />
                )}
              </div>
            ) : diagram === "host-iframe-shell" ? (
              <div className="relative mx-auto rounded-md border border-foreground/20 bg-muted/40 min-h-[88px] w-[92%] p-2 flex items-center justify-center">
                <div
                  className={cn(
                    "w-[78%] h-[72px] rounded-md border-2 border-dashed bg-background/90 flex items-center justify-center text-[8px] font-mono text-muted-foreground",
                    region === "iframe-boundary"
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-foreground/25",
                  )}
                >
                  iframe
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "relative mx-auto rounded-md border border-dashed border-primary/35 bg-background/90 p-1.5 min-h-[88px] w-[92%]",
                )}
              >
                <span className="absolute -top-0.5 left-1 text-[8px] font-mono text-muted-foreground">embed</span>
                <div className="absolute inset-1 rounded border border-foreground/10" />
                {region === "video-player" && (
                  <div className="absolute inset-2 rounded-sm bg-primary/20 border border-primary/30" />
                )}
                {region === "compact-control" && (
                  <div className="absolute top-2 left-2 h-6 w-6 rounded-full border-2 border-primary bg-primary/15 shadow-sm" />
                )}
                {region === "iframe-generic" && (
                  <div className={cn("absolute inset-3 rounded-sm border border-foreground/15", innerPulse)} />
                )}
              </div>
            )}
            <p className="text-[8px] text-center text-muted-foreground mt-1.5 leading-tight px-1">
              Schematic — not your screenshot
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-xs font-bold font-sans text-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" aria-hidden />
            Where on the page
          </p>
          <p className="text-xs text-foreground leading-relaxed">{model.whereLabel}</p>
          <div className="rounded-md bg-background/80 border border-border px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              What happens for users
            </p>
            <p className="text-xs text-foreground leading-relaxed">{model.effectLine}</p>
          </div>
          {model.ownershipNote ? (
            <p className="text-[11px] text-muted-foreground leading-relaxed border-l-2 border-amber-500/60 pl-3">
              {model.ownershipNote}
            </p>
          ) : null}
          {sel ? (
            <p className="text-[10px] font-mono text-muted-foreground break-all pt-1">
              <span className="text-muted-foreground/80">Primary selector: </span>
              {sel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function scanEngineDescription(
  engine: "playwright" | "static_fallback" | "unknown" | null | undefined,
): string {
  switch (engine) {
    case "playwright":
      return "Chromium + axe-core. Full DOM and scripts; page is scrolled before the run so lazy content can render; same-origin iframes included.";
    case "static_fallback":
      return "Scan engine: static HTML only — the headless browser step failed, so JavaScript was not executed. SPAs and client-rendered pages are often under-tested in this mode. On the API server, run: pnpm --filter @workspace/api-server exec playwright install chromium";
    default:
      return "Scan engine: not recorded (older audit). New audits show whether Chromium or static analysis was used.";
  }
}

function LeadCaptureForm({ auditId }: { auditId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    createLead.mutate(
      { data: { name: name.trim(), email: email.trim(), auditId } },
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
            Your full report will be sent to <span className="font-medium text-foreground">{email}</span> within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="lead-name" className="text-xs font-semibold font-sans block mb-1.5">
            Your name
          </label>
          <Input
            id="lead-name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="lead-email" className="text-xs font-semibold font-sans block mb-1.5">
            Work email
          </label>
          <Input
            id="lead-email"
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
          "Get the full report →"
        )}
      </Button>
      {createLead.isError && (
        <p className="text-xs text-destructive text-center">
          Something went wrong. Please try again.
        </p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        No spam. We'll send one report and follow up once.
      </p>
    </form>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useDownloadPdf(auditId: string) {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  async function download() {
    setIsPending(true);
    try {
      const resp = await fetch(`${BASE}/api/audit/${auditId}/pdf`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = resp.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "accessibility-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Report generation failed",
        description: "Could not generate the PDF report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  }

  return { download, isPending };
}

export default function AuditResult() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const urlParam = searchParams.get("url") || "";
  const auditIdParam = searchParams.get("auditId") || "";
  /** Each home submit sends a new nonce so we clear the mutation and POST again instead of reusing the last scan. */
  const rescanParam = searchParams.get("rescan") || "";

  const queryClient = useQueryClient();
  const createAudit = useCreateAudit();
  const { mutate: createAuditMutate, reset: resetCreateAudit } = createAudit;

  const lastScanIntentKey = useRef<string | null>(null);

  const existingAudit = useQuery({
    queryKey: getGetAuditQueryKey(auditIdParam),
    queryFn: () => getAudit(auditIdParam),
    enabled: !!auditIdParam,
    retry: false,
  });

  useEffect(() => {
    const row = createAudit.data;
    if (!row?.auditId || !auditRowLooksUsable(row)) return;
    queryClient.setQueryData(getGetAuditQueryKey(row.auditId), row);
  }, [createAudit.data, queryClient]);

  useEffect(() => {
    if (auditIdParam) {
      lastScanIntentKey.current = null;
      return;
    }
    if (!urlParam) return;
    const fp = normalizeUrlForCompare(urlParam);
    const intentKey = rescanParam ? `rescan:${rescanParam}:${fp}` : `url:${fp}`;
    if (lastScanIntentKey.current === intentKey) return;
    lastScanIntentKey.current = intentKey;
    resetCreateAudit();
  }, [auditIdParam, rescanParam, resetCreateAudit, urlParam]);

  useEffect(() => {
    if (!urlParam || auditIdParam) return;
    if (createAudit.isPending) return;
    const post = createAudit.data;
    if (!post?.url) return;
    if (!urlsMatchForAudit(post.url, urlParam)) {
      resetCreateAudit();
    }
  }, [auditIdParam, createAudit.data, createAudit.isPending, resetCreateAudit, urlParam]);

  useEffect(() => {
    if (!urlParam || auditIdParam) return;
    if (createAudit.isPending) return;
    const post = createAudit.data;
    if (!post?.auditId) return;
    if (!urlsMatchForAudit(post.url, urlParam)) return;
    const params = new URLSearchParams({ auditId: post.auditId, url: post.url });
    navigate(`/audit-result?${params.toString()}`, { replace: true });
  }, [
    auditIdParam,
    createAudit.data,
    createAudit.isPending,
    navigate,
    urlParam,
  ]);

  useEffect(() => {
    if (!urlParam || auditIdParam) return;
    if (createAudit.isPending || createAudit.data || createAudit.isError) return;
    createAuditMutate({ data: { url: urlParam } });
  }, [
    auditIdParam,
    createAudit.data,
    createAudit.isError,
    createAudit.isPending,
    createAuditMutate,
    urlParam,
  ]);

  if (!urlParam && !auditIdParam) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-display-md font-extrabold mb-4">No URL provided</h1>
        <p className="text-muted-foreground mb-8">Please provide a URL to run the audit.</p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    );
  }

  const mergedRaw = mergeAuditRow(auditIdParam, existingAudit.data, createAudit.data);
  const waitingForSavedAudit =
    !!auditIdParam &&
    mergedRaw === undefined &&
    (existingAudit.isPending || existingAudit.isFetching);
  const isPending = createAudit.isPending || waitingForSavedAudit;
  const isError =
    createAudit.isError ||
    (!!auditIdParam &&
      existingAudit.isError &&
      !(createAudit.data?.auditId === auditIdParam));
  const displayUrl = mergedRaw?.url || urlParam;

  if (isPending) {
    return (
      <div className="hero-gradient min-h-[80vh] flex flex-col items-center justify-center gap-8 px-4 py-12 sm:py-16">
        <div className="sr-only" role="status" aria-live="polite">
          Scanning {displayUrl}. Automated WCAG checks in progress.
        </div>
        <Loader2 className="w-9 h-9 text-primary animate-spin shrink-0" aria-hidden />
        <div className="text-center max-w-xl w-full space-y-3">
          <h1 className="text-display-md font-extrabold">
            Scanning<br />
            <span className="heading-accent">your site.</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Chromium scrolls the full page, then axe analyzes — typically 15–40 seconds.
          </p>
        </div>

        <AuditPendingScanFrame displayUrl={displayUrl} />

        <div className="rounded-xl border border-border bg-background/80 backdrop-blur-sm p-5 text-left shadow-sm max-w-xl w-full">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-11 h-11 rounded-lg bg-muted flex items-center justify-center border border-border">
              <ImageIcon className="w-5 h-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm font-semibold font-sans text-foreground">Visual evidence after the scan</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Viewport capture, JPEG clips of failing elements, selectors, HTML snippets, and axe messages when the
                browser run succeeds.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="hero-gradient min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <AlertOctagon className="w-10 h-10 text-destructive mx-auto mb-6" />
          <h1 className="text-display-md font-extrabold mb-4">
            Scan <span className="heading-accent">failed.</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            We couldn't complete the scan for{" "}
            <span className="font-mono text-foreground">{displayUrl}</span>.
            The site might be blocking our scanner, requires authentication, or is unreachable.
          </p>
          <Button asChild>
            <Link href="/">Try another URL</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!mergedRaw) {
    if (!isPending && !isError && auditIdParam) {
      return (
        <div className="hero-gradient min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            <AlertOctagon className="w-10 h-10 text-destructive mx-auto mb-6" />
            <h1 className="text-display-md font-extrabold mb-4">Audit not found.</h1>
            <p className="text-muted-foreground text-sm mb-8">
              We could not load a saved result for this link. Run a new scan from the home page.
            </p>
            <Button asChild>
              <Link href="/">Start a new audit</Link>
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="hero-gradient min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <AlertOctagon className="w-10 h-10 text-muted-foreground mx-auto mb-6" aria-hidden />
          <h1 className="text-display-md font-extrabold mb-4">Couldn’t show this result.</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Something interrupted loading the audit for{" "}
            <span className="font-mono text-foreground">{displayUrl || urlParam || "this URL"}</span>.
            Start a fresh scan from the home page.
          </p>
          <Button asChild>
            <Link href="/">Start a new audit</Link>
          </Button>
        </div>
      </div>
    );
  }

  const result = normalizeAuditResult(mergedRaw);
  const scannedDate = formatScannedAt(result.scannedAt);

  return <AuditResultView result={result} scannedDate={scannedDate} />;
}

function ViolationElementExamples({ violation }: { violation: AuditViolation }) {
  const instances = violation.instanceDetails;
  const selectors = (violation.topSelectors ?? []).filter(Boolean);

  if (instances && instances.length > 0) {
    return (
      <div className="mt-4 border-t border-border pt-4 w-full text-left space-y-6">
        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
          Representative nodes (up to three): selector, failure summary, axe check messages, markup, and element
          screenshot when capture succeeded.
        </p>
        {instances.map((inst, idx) => (
          <div
            key={`${violation.id}-${idx}-${inst.selector}`}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 rounded-lg border border-border bg-muted/30 p-4"
          >
            <div className="space-y-2 min-w-0 order-2 lg:order-1">
              <p className="text-xs font-mono text-muted-foreground font-semibold">Instance {idx + 1}</p>
              <code className="block text-xs font-mono break-all bg-background text-foreground px-2.5 py-2 rounded-md border border-border">
                {inst.selector || "—"}
              </code>
              {inst.failureSummary ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Failure summary
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{inst.failureSummary}</p>
                </div>
              ) : null}
              {inst.checkDetails && inst.checkDetails.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Axe checks
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-foreground leading-relaxed marker:text-muted-foreground">
                    {inst.checkDetails.map((msg, i) => (
                      <li key={`${violation.id}-${idx}-chk-${i}`}>{msg}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  HTML snippet
                </p>
                <pre className="text-xs font-mono bg-background text-foreground border border-border rounded-md p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {inst.htmlSnippet || ""}
                </pre>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Element screenshot
              </p>
              {inst.elementScreenshot ? (
                <figure className="rounded-md border border-border bg-background overflow-hidden shadow-sm">
                  <img
                    src={inst.elementScreenshot}
                    alt={`Rendered bounds of the element matching: ${inst.selector || violation.id}`}
                    className="w-full h-auto object-contain max-h-64 bg-muted/50"
                    loading="lazy"
                  />
                  <figcaption className="text-[10px] text-muted-foreground px-2 py-1.5 font-mono border-t border-border bg-muted/40">
                    JPEG capture from headless Chromium (cropped to node box).
                  </figcaption>
                </figure>
              ) : (
                <div className="rounded-md border border-dashed border-border bg-background/60 px-4 py-8 text-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" aria-hidden />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No image for this node (hidden, off-screen, iframe-only, or capture skipped after earlier clips).
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (selectors.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border pt-4 w-full text-left">
      <p className="text-xs text-muted-foreground font-mono mb-2">
        Selectors only (older audit). New scan from home includes markup snippets.
      </p>
      <ul className="list-disc pl-4 space-y-1.5 marker:text-muted-foreground">
        {selectors.map((s) => (
          <li key={s}>
            <code className="text-xs break-all font-mono">{s}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MonitorSetupCard({ url, auditId }: { url: string; auditId: string }) {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [token, setToken] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/monitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email: email.trim(), frequency, auditId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { token: string };
      setToken(data.token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast({ title: "Monitoring setup failed", description: msg, variant: "destructive" });
    } finally {
      setIsPending(false);
    }
  }

  const monitorUrl = token ? `${window.location.origin}${BASE}/monitor/${token}` : null;

  if (token && monitorUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <p className="font-bold font-sans text-sm mb-1">Monitoring is active.</p>
          <p className="text-xs text-muted-foreground mb-4">
            A confirmation has been sent to <span className="font-medium text-foreground">{email}</span>.
            Bookmark your results page:
          </p>
          <a
            href={monitorUrl}
            className="font-mono text-xs text-primary underline underline-offset-2 break-all"
          >
            {monitorUrl}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="monitor-email" className="text-xs font-semibold font-sans block mb-1.5">
          Email for scan summaries
        </label>
        <Input
          id="monitor-email"
          type="email"
          placeholder="jane@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <label className="text-xs font-semibold font-sans block mb-1.5">Scan frequency</label>
        <div className="flex gap-3">
          {(["weekly", "monthly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`flex-1 h-10 rounded-lg border text-xs font-semibold font-sans capitalize transition-colors ${
                frequency === f
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-11 text-sm font-semibold"
        disabled={isPending || !email.trim()}
      >
        {isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Setting up…</>
        ) : (
          "Start monitoring →"
        )}
      </Button>
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        We'll email a score summary after each scan. No spam.
      </p>
    </form>
  );
}

function AuditResultView({
  result,
  scannedDate,
}: {
  result: NonNullable<ReturnType<typeof useCreateAudit>["data"]>;
  scannedDate: string;
}) {
  const { download, isPending: pdfPending } = useDownloadPdf(result.auditId);
  const violations = Array.isArray(result.violations) ? result.violations : [];

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <section className="hero-gradient pt-16 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div>
              <h1 className="text-display-md font-extrabold mb-3">
                Audit <span className="heading-accent">result.</span>
              </h1>
              <p className="font-mono text-sm text-muted-foreground bg-muted inline-block px-3 py-1 rounded-lg mb-2">
                {result.url}
              </p>
              <p className="text-xs text-muted-foreground font-mono">Scanned {scannedDate}</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xl leading-relaxed">
                {scanEngineDescription(result.scanEngine)}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
              <Button
                onClick={download}
                disabled={pdfPending}
                variant="outline"
                className="h-11 px-5 text-sm font-semibold border-foreground/20 bg-white/80 hover:bg-white gap-2"
              >
                {pdfPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><FileDown className="w-4 h-4" /> Download Report</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          {/* Score + stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="col-span-1 border">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
                    <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-muted" />
                    <circle
                      cx="72" cy="72" r="62"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray="390"
                      strokeDashoffset={390 - (390 * result.score) / 100}
                      className={result.score >= 90 ? "text-emerald-500" : result.score >= 50 ? "text-yellow-500" : "text-destructive"}
                    />
                  </svg>
                  <div className="absolute text-3xl font-extrabold font-sans">{result.score}</div>
                </div>
                <h2 className="text-base font-bold font-sans capitalize">{result.level}</h2>
                <p className="text-xs text-muted-foreground font-mono">Automated Score</p>
              </CardContent>
            </Card>

            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
              {[
                { value: result.criticalViolations, label: "Critical Violations", color: "text-destructive" },
                { value: result.seriousViolations, label: "Serious Violations", color: "text-primary" },
                { value: result.totalViolations, label: "Total Violations", color: "text-foreground" },
                { value: `${result.passedChecks}/${result.totalChecks}`, label: "Passed Checks", color: "text-emerald-600" },
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

          {result.pageScreenshot ? (
            <div className="mb-12 rounded-xl border border-border bg-muted/20 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-background/80 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold font-sans text-foreground">Page at scan time (viewport)</h3>
                <p className="text-[11px] text-muted-foreground font-mono">
                  JPEG after axe — same scroll position as rule documentation below.
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-muted/30">
                <img
                  src={result.pageScreenshot}
                  alt={`Viewport screenshot of ${result.url} when the accessibility scan completed.`}
                  className="w-full h-auto rounded-md border border-border bg-background shadow-inner max-h-[min(70vh,720px)] object-top object-contain"
                  loading="eager"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-mono mb-10 max-w-2xl leading-relaxed">
              {result.scanEngine === "static_fallback"
                ? "Viewport screenshot is only available when the Chromium + Playwright scan succeeds. This run used static HTML analysis."
                : result.scanEngine === "unknown"
                  ? "This saved audit has no page capture (older record). Run a new scan from the home page for viewport and element images."
                  : "Page screenshot was not stored for this run (capture failed or engine limitation)."}
            </p>
          )}

          {/* Violations */}
          <h3 className="text-lg font-bold font-sans text-foreground mb-4">Violations</h3>
          <div className="space-y-2 mb-12">
            {violations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No violations in this result.
              </p>
            ) : (
              violations.map((violation, i) => (
                <article
                  key={`${violation.id}-${i}`}
                  className={violationRowClass(violation.impact)}
                >
                  <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-start">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={violation.impact === "critical" ? "destructive" : "outline"}
                          className="text-xs capitalize font-medium"
                        >
                          {violation.impact}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">{violation.wcagCriteria}</span>
                        <span className="font-mono text-[10px] text-muted-foreground/80">Rule: {violation.id}</span>
                      </div>
                      <p className="text-sm text-foreground leading-snug">{violation.description}</p>
                      {violation.help ? (
                        <p className="text-xs text-foreground/90 leading-relaxed border-l-2 border-primary/40 pl-3">
                          <span className="font-semibold font-sans">How to fix: </span>
                          {violation.help}
                        </p>
                      ) : null}
                      {violation.helpUrl ? (
                        <a
                          href={violation.helpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2"
                        >
                          Open rule documentation
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                    <div className="shrink-0 md:text-right md:min-w-20">
                      <p className="text-lg font-bold font-sans tabular-nums">{violation.affectedElements}</p>
                      <p className="text-xs text-muted-foreground font-mono">nodes</p>
                    </div>
                  </div>
                  <ViolationWhereOnPage violation={violation} />
                  <ViolationElementExamples violation={violation} />
                </article>
              ))
            )}
          </div>

          {/* Lead Capture */}
          <Card className="border-2 border-primary/20 bg-background mb-8">
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
                    send a summary of what a full manual audit would uncover - no obligation.
                  </p>
                </div>
                <div className="md:col-span-3">
                  <LeadCaptureForm auditId={result.auditId} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring Setup */}
          <Card className="border-2 border-foreground/10 bg-background">
            <CardContent className="p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
                <div className="md:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-4">
                    <Activity className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="text-lg font-extrabold font-sans mb-2">
                    Monitor this site.
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    EAA compliance isn't a one-time fix. Set up weekly or monthly re-scans and
                    receive an email summary whenever your score changes - completely free.
                  </p>
                </div>
                <div className="md:col-span-3">
                  <MonitorSetupCard url={result.url} auditId={result.auditId} />
                </div>
              </div>
            </CardContent>
          </Card>
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
            Automated tools only detect roughly 30% of WCAG violations. A full manual audit with
            screen readers will reveal 3–5× more issues - and is required for legal sign-off.
          </p>
          <Button asChild className="h-12 px-8 text-sm font-bold">
            <Link href="/contact">Get a full audit</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
