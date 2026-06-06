import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCreateAudit,
  useCreateLead,
  getAudit,
  getGetAuditQueryKey,
} from "@workspace/api-client-react";
import type { AuditResult, AuditViolation } from "@workspace/api-client-react";
import {
  getHumanContextForViolation,
  getWhatHappensLine,
  type HumanViolationContext,
} from "@/lib/violation-human-context";
import { getManualFollowUpsFromViolations } from "@/lib/manual-followups";
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
  ChevronLeft,
  ChevronRight,
  ScanText,
  ScrollText,
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AuditPendingScanFrame } from "@/components/audit-pending-scan-frame";
import {
  useAuditHeroEntrance,
  useAuditMetricsEntrance,
  usePrefersReducedMotion,
  useViolationCardsEntrance,
  useViolationNavPulse,
} from "@/hooks/use-audit-result-gsap";

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
  const scannedParsed =
    typeof r.scannedAt === "string" && r.scannedAt.trim() ? Date.parse(r.scannedAt) : NaN;
  const scannedOk = !Number.isNaN(scannedParsed) && scannedParsed > 0;
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
    scannedAt: scannedOk ? r.scannedAt : "",
    scanEngine: r.scanEngine ?? "unknown",
    ...(pageScreenshot ? { pageScreenshot } : {}),
    ...(r.scanMetadata ? { scanMetadata: r.scanMetadata } : {}),
  };
}

/** Full hero-line caption; avoids “Scanned Jan 1, 1970” when the API sent a missing or epoch timestamp. */
function buildScannedCaption(scannedAt: string): string {
  const t = typeof scannedAt === "string" && scannedAt.trim() ? Date.parse(scannedAt) : NaN;
  if (Number.isNaN(t) || t <= 0) {
    return "Scan date not recorded";
  }
  return `Scanned ${new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
}

/** Single neutral card; sections inside use spacing and light fills only. */
function violationRowClass(_impact: AuditViolation["impact"]): string {
  return cn("rounded-xl border border-border bg-background");
}

function primaryViolationSelector(violation: AuditViolation): string {
  const fromInst = violation.instanceDetails?.find((i) => i.selector?.trim())?.selector;
  if (fromInst?.trim()) return fromInst.trim();
  const fromTop = (violation.topSelectors ?? []).find((s) => Boolean(s?.trim()));
  return (fromTop ?? "").trim();
}

/** Data URL from the same representative instance as `primaryViolationSelector` when possible. */
function primaryInstanceElementScreenshot(violation: AuditViolation): string | undefined {
  const details = violation.instanceDetails;
  if (!details?.length) return undefined;
  const primaryInst = details.find((i) => i.selector?.trim()) ?? details[0];
  const raw =
    primaryInst?.elementScreenshot?.trim() ??
    details.find((i) => i.elementScreenshot?.trim())?.elementScreenshot?.trim();
  if (!raw?.startsWith("data:image/")) return undefined;
  return raw;
}

/** Index of the primary instance in `instanceDetails` (matches `primaryViolationSelector` / preview crop). */
function primaryInstanceIndex(violation: AuditViolation): number {
  const details = violation.instanceDetails;
  if (!details?.length) return 0;
  const i = details.findIndex((inst) => inst.selector?.trim());
  return i >= 0 ? i : 0;
}

function ViolationHumanContextPanel({ human }: { human: HumanViolationContext }) {
  const toolLabel =
    human.relatedToolPath === "/tools/contrast-checker"
      ? "Open contrast checker"
      : "Open related tool";

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-wrap gap-2">
        {human.whoIsAffected.map((tag) => (
          <span
            key={tag}
            className="text-xs font-medium font-sans rounded-full bg-muted px-3 py-1.5 text-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-foreground leading-relaxed">
        <span className="font-semibold font-sans">When you fix it: </span>
        {human.whenYouFixIt}
      </p>
      {human.didYouKnow ? (
        <p className="text-sm text-muted-foreground leading-relaxed rounded-lg bg-muted/50 p-4">
          <span className="font-semibold font-sans text-foreground not-italic">Did you know? </span>
          {human.didYouKnow}
        </p>
      ) : null}
      {human.relatedToolPath ? (
        <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
          <Link href={human.relatedToolPath}>{toolLabel}</Link>
        </Button>
      ) : null}
      {human.fallback ? (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          We will add richer plain-language notes for more rule types over time. The technical section still lists the
          official finding and fix hints from the checker.
        </p>
      ) : null}
    </div>
  );
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
      "The `<iframe>` on your page: the embedded “window” between your document and third-party markup.",
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
      "In the page heading structure: the sequence of section titles screen readers use for navigation.",
    );
  } else if (insideEmbedDoc) {
    whereParts.push("Inside embedded content (an iframe), on the element described by the selector below.");
  } else {
    whereParts.push("On your page’s main document, on the element described by the selector below.");
  }

  let ownershipNote: string | null = null;
  if (region === "iframe-boundary") {
    ownershipNote =
      "You control this element in your own template: add a concise `title` (or another accessible name) so users know what the embed is before they enter it.";
  } else if (insideEmbedDoc) {
    ownershipNote = youtubeLike
      ? "This selector matches markup inside a video embed (often YouTube). Inner player issues are usually owned by the vendor; you can still fix the outer iframe name, swap embeds, or document limitations."
      : "This selector points inside an embedded document. Your app may only control the outer iframe, not the widget’s inner HTML.";
  }

  return {
    scope,
    diagram,
    region,
    whereLabel: whereParts.join(" "),
    ownershipNote,
  };
}

function ViolationWhereOnPage({
  violation,
  whatHappensLine,
}: {
  violation: AuditViolation;
  /** Prefer human-centered copy from getWhatHappensLine(getHumanContextForViolation(v)) */
  whatHappensLine: string;
}) {
  const model = violationVisualModel(violation);
  const sel = primaryViolationSelector(violation);
  const { diagram, region } = model;
  const elementPreviewSrc = primaryInstanceElementScreenshot(violation);
  const previewAlt = sel
    ? `Chromium viewport crop around the element matching this selector: ${sel}`
    : "Chromium viewport crop around the element flagged for this issue.";

  const innerPulse =
    region === "video-player" ? "bg-primary/25" : region === "compact-control" ? "bg-primary/20" : "bg-muted/50";

  const layoutDiagram =
    diagram === "host-body" ? (
      <div className="relative mx-auto rounded-md border border-border/60 bg-muted/40 min-h-[88px] w-[92%] p-2">
        {region === "compact-control" && (
          <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-primary/20 border border-primary/40" />
        )}
        {region === "page-generic" && <div className="absolute inset-2 rounded-sm bg-foreground/6" />}
      </div>
    ) : diagram === "host-iframe-shell" ? (
      <div className="relative mx-auto rounded-md border border-border/60 bg-muted/40 min-h-[88px] w-[92%] p-2 flex items-center justify-center">
        <div
          className={cn(
            "w-[78%] h-[72px] rounded-md border border-dashed bg-background flex items-center justify-center text-[8px] font-mono text-muted-foreground",
            region === "iframe-boundary" ? "border-primary/60" : "border-border",
          )}
        >
          iframe
        </div>
      </div>
    ) : (
      <div
        className={cn(
          "relative mx-auto rounded-md border border-dashed border-border bg-muted/20 p-1.5 min-h-[88px] w-[92%]",
        )}
      >
        <span className="absolute -top-0.5 left-1 text-[8px] font-mono text-muted-foreground">embed</span>
        <div className="absolute inset-1 rounded-sm border border-border/40" />
        {region === "video-player" && (
          <div className="absolute inset-2 rounded-sm bg-primary/15 border border-primary/20" />
        )}
        {region === "compact-control" && (
          <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-primary/20 border border-primary/40" />
        )}
        {region === "iframe-generic" && (
          <div className={cn("absolute inset-3 rounded-sm border border-border/50", innerPulse)} />
        )}
      </div>
    );

  return (
    <div className="flex flex-col sm:flex-row gap-8 sm:items-start">
        <div
          className="shrink-0 flex justify-center sm:justify-start"
          aria-hidden={elementPreviewSrc ? undefined : true}
        >
          {elementPreviewSrc ? (
            <figure className="relative w-full max-w-[200px] sm:max-w-[220px] rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-center mb-2">
                Element at scan
              </p>
              <div className="overflow-hidden rounded-md border border-border/60 bg-muted/40 flex items-center justify-center min-h-[96px] max-h-[132px]">
                <img
                  src={elementPreviewSrc}
                  alt={previewAlt}
                  className="max-h-[132px] w-full object-contain object-center"
                  loading="lazy"
                />
              </div>
              <figcaption className="text-[8px] text-center text-muted-foreground mt-1.5 leading-tight px-1">
                JPEG crop from the scan. Tiny controls can look soft here because the clip is only a few pixels tall on
                the real page.
              </figcaption>
            </figure>
          ) : (
            <div className="relative w-[148px] rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground text-center mb-2">
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

              {layoutDiagram}
              <p className="text-[8px] text-center text-muted-foreground mt-1.5 leading-tight px-1">
                Schematic (no element capture for this node)
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-5">
          <div>
            <p className="text-sm font-semibold font-sans text-foreground flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
              Where on the page
            </p>
            <p className="text-sm text-foreground leading-relaxed">{model.whereLabel}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">What happens for users</p>
            <p className="text-sm text-foreground leading-relaxed">{whatHappensLine}</p>
          </div>
          {model.ownershipNote ? (
            <p className="text-sm text-muted-foreground leading-relaxed">{model.ownershipNote}</p>
          ) : null}
          {sel ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Primary selector</p>
              <pre className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap wrap-break-word rounded-lg border border-border bg-muted/30 p-4 max-h-40 overflow-y-auto">
                {sel}
              </pre>
            </div>
          ) : null}
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
      return "Scan engine: static HTML only. The headless browser step failed, so JavaScript was not executed. SPAs and client-rendered pages are often under-tested in this mode. On the API server, run: pnpm --filter @workspace/api-server exec playwright install chromium";
    default:
      return "Scan engine not recorded for this audit (older data). New scans show whether Chromium or static HTML analysis was used.";
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
  const profileParam = searchParams.get("profile") === "strict" ? "strict" : "default";
  const multiViewportParam =
    searchParams.get("multiViewport") === "1" || searchParams.get("multiViewport") === "true";

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
    const intentKey = rescanParam
      ? `rescan:${rescanParam}:${fp}:p${profileParam}:mv${multiViewportParam ? "1" : "0"}`
      : `url:${fp}:p${profileParam}:mv${multiViewportParam ? "1" : "0"}`;
    if (lastScanIntentKey.current === intentKey) return;
    lastScanIntentKey.current = intentKey;
    resetCreateAudit();
  }, [auditIdParam, rescanParam, resetCreateAudit, urlParam, profileParam, multiViewportParam]);

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
    createAuditMutate({
      data: {
        url: urlParam,
        ...(profileParam === "strict" ? { profile: "strict" as const } : {}),
        ...(multiViewportParam ? { multiViewport: true } : {}),
      },
    });
  }, [
    auditIdParam,
    createAudit.data,
    createAudit.isError,
    createAudit.isPending,
    createAuditMutate,
    urlParam,
    profileParam,
    multiViewportParam,
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
            Chromium scrolls the full page, then axe analyzes: typically 15–40 seconds.
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
  const scannedCaption = buildScannedCaption(result.scannedAt);

  return <AuditResultView result={result} scannedCaption={scannedCaption} />;
}

function ViolationElementExamples({ violation }: { violation: AuditViolation }) {
  const instances = violation.instanceDetails;
  const selectors = (violation.topSelectors ?? []).filter(Boolean);
  const primaryShot = primaryInstanceElementScreenshot(violation);
  const primaryIdx = primaryInstanceIndex(violation);

  if (instances && instances.length > 0) {
    return (
      <div className="w-full text-left space-y-6">
        <p className="text-xs text-muted-foreground font-mono leading-relaxed">
          Representative nodes (up to three): selector, failure summary, axe check messages, markup, and element
          screenshot when capture succeeded. The primary instance uses the same crop as{" "}
          <span className="font-sans font-semibold text-foreground">Where on the page</span> above, so it is not shown
          again here.
        </p>
        {instances.map((inst, idx) => {
          const instShot = inst.elementScreenshot?.trim();
          const omitDuplicateScreenshot =
            Boolean(primaryShot) &&
            idx === primaryIdx &&
            instShot === primaryShot;
          const gridCols = omitDuplicateScreenshot ? "grid-cols-1" : "lg:grid-cols-2";

          return (
          <div
            key={`${violation.id}-${idx}-${inst.selector}`}
            className={cn("grid grid-cols-1 gap-4 lg:gap-6 rounded-lg border border-border bg-muted/20 p-5", gridCols)}
          >
            <div className="space-y-2 min-w-0 order-2 lg:order-1">
              <p className="text-xs font-mono text-muted-foreground font-semibold">Instance {idx + 1}</p>
              <code className="block text-xs font-mono break-all bg-background text-foreground px-3 py-2.5 rounded-md border border-border">
                {inst.selector || ", "}
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
                <pre className="text-xs font-mono bg-background text-foreground rounded-md border border-border p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {inst.htmlSnippet || ""}
                </pre>
              </div>
              {omitDuplicateScreenshot ? (
                <p className="text-xs text-muted-foreground leading-relaxed rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                  {" "}
                  <span className="font-semibold text-foreground"></span>
                </p>
              ) : null}
            </div>
            {omitDuplicateScreenshot ? null : (
            <div className="order-1 lg:order-2 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Element screenshot
              </p>
              {inst.elementScreenshot ? (
                <figure className="rounded-lg border border-border bg-background overflow-hidden">
                  <img
                    src={inst.elementScreenshot}
                    alt={`Rendered bounds of the element matching: ${inst.selector || violation.id}`}
                    className="w-full h-auto object-contain max-h-64 bg-muted/50"
                    loading="lazy"
                  />
                  <figcaption className="text-[10px] text-muted-foreground px-2 py-1.5 font-mono border-t border-border/60 bg-muted/30">
                    JPEG from headless Chromium, cropped to the node box. Small targets often look blurry enlarged—that
                    reflects the clip size, not how sharp the control is on your live page.
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
            )}
          </div>
          );
        })}
      </div>
    );
  }

  if (selectors.length === 0) return null;

  return (
    <div className="w-full text-left space-y-3 pt-2">
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
  scannedCaption,
}: {
  result: NonNullable<ReturnType<typeof useCreateAudit>["data"]>;
  scannedCaption: string;
}) {
  const { download, isPending: pdfPending } = useDownloadPdf(result.auditId);
  const violations = Array.isArray(result.violations) ? result.violations : [];
  const [simpleView, setSimpleView] = useState(false);
  const [activeViolationIdx, setActiveViolationIdx] = useState(0);
  const [navPulseToken, setNavPulseToken] = useState(0);
  const violationArticleRefs = useRef<Array<HTMLElement | null>>([]);
  const scoreRingRef = useRef<SVGCircleElement | null>(null);
  const metricsRef = useRef<HTMLDivElement | null>(null);
  const violationsListRef = useRef<HTMLDivElement | null>(null);
  const violationsToolbarRef = useRef<HTMLDivElement | null>(null);
  const screenshotRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const scoreNumberRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const violationFingerprint = useMemo(
    () => violations.map((v) => `${v.id}:${v.affectedElements}`).join("|"),
    [violations],
  );

  const manualFollowUps = useMemo(() => getManualFollowUpsFromViolations(violations), [violations]);
  const toolTargetUrl = encodeURIComponent(result.url);

  useAuditHeroEntrance({
    auditId: result.auditId,
    reducedMotion,
    heroRef,
  });

  useAuditMetricsEntrance({
    auditId: result.auditId,
    reducedMotion,
    score: result.score,
    scoreRingRef,
    scoreNumberRef,
    metricsRef,
    screenshotRef,
  });

  useViolationCardsEntrance({
    auditId: result.auditId,
    violationFingerprint,
    violationCount: violations.length,
    reducedMotion,
    violationsListRef,
    violationsToolbarRef,
  });

  useViolationNavPulse(violationArticleRefs, activeViolationIdx, navPulseToken, reducedMotion);

  function focusViolationAt(index: number) {
    const el = violationArticleRefs.current[index];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.requestAnimationFrame(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
    });
  }

  function goToAdjacentViolation(delta: number) {
    if (violations.length === 0) return;
    const next = (activeViolationIdx + delta + violations.length) % violations.length;
    setActiveViolationIdx(next);
    setNavPulseToken((t) => t + 1);
    focusViolationAt(next);
  }

  useEffect(() => {
    if (violations.length === 0) return;
    setActiveViolationIdx((idx) => (idx >= violations.length ? violations.length - 1 : idx));
  }, [violations.length]);

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <section className="hero-gradient pt-16 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div
            ref={heroRef}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6"
          >
            <div className="min-w-0">
              <h1 className="text-display-md font-extrabold mb-3" data-hero-line>
                Audit <span className="heading-accent">result.</span>
              </h1>
              <p
                className="font-mono text-sm text-muted-foreground bg-muted inline-block px-3 py-1 rounded-lg mb-2 break-all"
                data-hero-line
              >
                {result.url}
              </p>
              <p className="text-xs text-muted-foreground font-mono" data-hero-line>
                {scannedCaption}
              </p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xl leading-relaxed" data-hero-line>
                {scanEngineDescription(result.scanEngine)}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1 shrink-0" data-hero-line>
              <Button
                onClick={download}
                disabled={pdfPending}
                variant="outline"
                className="h-11 px-5 text-sm font-semibold border-foreground/20 bg-white/80 hover:bg-white gap-2 shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none"
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
          <div
            ref={metricsRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 perspective-[1400px]"
          >
            <Card className="col-span-1 border" data-audit-metric-card>
              <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
                    <circle cx="72" cy="72" r="62" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-muted" />
                    <circle
                      ref={scoreRingRef}
                      cx="72" cy="72" r="62"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray="390"
                      strokeDashoffset={390 - (390 * result.score) / 100}
                      className={result.score >= 90 ? "text-emerald-500" : result.score >= 50 ? "text-yellow-500" : "text-destructive"}
                    />
                  </svg>
                  <div
                    ref={scoreNumberRef}
                    className="absolute text-3xl font-extrabold font-sans tabular-nums tracking-tight"
                  >
                    {result.score}
                  </div>
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
                <Card key={label} data-audit-metric-card>
                  <CardContent className="p-5">
                    <div className={`text-3xl font-extrabold font-sans mb-1 ${color}`}>{value}</div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider font-sans">{label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {result.pageScreenshot ? (
            <div
              ref={screenshotRef}
              className="mb-12 rounded-xl border border-border bg-muted/20 overflow-hidden shadow-sm"
            >
              <div className="px-4 py-3 border-b border-border bg-background/80 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold font-sans text-foreground">Page at scan time (viewport)</h3>
                <p className="text-[11px] text-muted-foreground font-mono">
                  JPEG after axe: same scroll position as rule documentation below.
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-muted/30" data-screenshot-inner>
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

          <div className="space-y-6 mb-12">
              {(result.complianceReport ?? result.scanMetadata?.complianceReport) ? (
                <Card className="border-2 border-primary/20 shadow-none">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold font-sans">BITV 2.0 / BFSG (EN 301 549)</h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                          {(result.complianceReport ?? result.scanMetadata?.complianceReport)!.summaryDe}
                        </p>
                      </div>
                      <Badge
                        variant={
                          (result.complianceReport ?? result.scanMetadata?.complianceReport)!.overallStatus ===
                          "non_conformant"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {(result.complianceReport ?? result.scanMetadata?.complianceReport)!.overallStatus ===
                        "non_conformant"
                          ? "Nicht konform (automatisiert)"
                          : "Manuelle Prüfung erforderlich"}
                      </Badge>
                    </div>

                    {(result.complianceReport ?? result.scanMetadata?.complianceReport)!.clauseFindings.length > 0 ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          EN 301 549 / BITV-Klauseln
                        </p>
                        <ul className="space-y-2 text-xs">
                          {(result.complianceReport ?? result.scanMetadata?.complianceReport)!.clauseFindings
                            .slice(0, 8)
                            .map((c) => (
                              <li
                                key={`${c.en301549Clause}-${c.bitvSection}`}
                                className="flex flex-wrap gap-x-2 gap-y-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2"
                              >
                                <span className="font-mono text-primary">{c.en301549Clause}</span>
                                <span className="text-muted-foreground">·</span>
                                <span className="font-semibold">{c.titleDe}</span>
                                <span className="text-muted-foreground ml-auto">
                                  {c.violationCount} {c.violationCount === 1 ? "Mangel" : "Mängel"}
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}

                    {(result.complianceReport ?? result.scanMetadata?.complianceReport)!.supplementalFindings
                      .filter((s) => s.status !== "pass")
                      .length > 0 ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Zusatzprüfungen (über axe-core hinaus)
                        </p>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          {(result.complianceReport ?? result.scanMetadata?.complianceReport)!.supplementalFindings
                            .filter((s) => s.status !== "pass")
                            .map((s) => (
                              <li key={s.id} className="flex gap-2">
                                <span
                                  className={
                                    s.status === "fail" ? "text-destructive font-semibold" : "text-amber-700 font-semibold"
                                  }
                                >
                                  {s.status === "fail" ? "Fehler" : "Hinweis"}
                                </span>
                                <span>{s.titleDe}: {s.description}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {result.scanMetadata ? (
                <Card className="border-2 border-primary/15 shadow-none">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-sm font-bold font-sans">Scan details</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">Axe profile: </span>
                      {result.scanMetadata.profile === "strict" ? "Strict (includes AAA-oriented rules)" : "Default (AA-oriented)"}
                      {result.scanMetadata.multiViewport ? (
                        <>
                          {" "}
                          <span className="font-semibold text-foreground">· Viewports: </span>
                          {result.scanMetadata.viewportsUsed.map((v) => `${v.label} (${v.width}×${v.height})`).join(" · ")}
                        </>
                      ) : (
                        <>
                          {" "}
                          <span className="font-semibold text-foreground">· Viewport: </span>
                          {result.scanMetadata.viewportsUsed[0]
                            ? `${result.scanMetadata.viewportsUsed[0].label} (${result.scanMetadata.viewportsUsed[0].width}×${result.scanMetadata.viewportsUsed[0].height})`
                            : "Desktop"}
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Passed/total checks count reflects the final viewport run. Multi-viewport merges unique violations and tags where each rule fired.
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {result.scanMetadata?.runtimeDiagnostics &&
              (result.scanMetadata.runtimeDiagnostics.consoleErrors.length > 0 ||
                (result.scanMetadata.runtimeDiagnostics.failedRequests?.length ?? 0) > 0) ? (
                <Card className="border-2 border-amber-500/25 bg-amber-500/5 shadow-none">
                  <CardContent className="p-6 space-y-3">
                    <h3 className="text-sm font-bold font-sans flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-700 shrink-0" aria-hidden />
                      Runtime signals (not WCAG violations)
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Console errors and failed network requests during the scan can indicate hydration issues, blocked assets, or
                      third-party scripts. Triangulate with DevTools: they are not automatic WCAG failures.
                    </p>
                    {result.scanMetadata.runtimeDiagnostics.consoleErrors.length > 0 ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Console ({result.scanMetadata.runtimeDiagnostics.consoleErrors.length})
                        </p>
                        <ul className="text-xs font-mono space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-border bg-background p-3">
                          {result.scanMetadata.runtimeDiagnostics.consoleErrors.map((e, i) => (
                            <li key={i} className="break-words text-foreground/90">
                              {e.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {result.scanMetadata.runtimeDiagnostics.failedRequests &&
                    result.scanMetadata.runtimeDiagnostics.failedRequests.length > 0 ? (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Failed requests ({result.scanMetadata.runtimeDiagnostics.failedRequests.length})
                        </p>
                        <ul className="text-xs font-mono space-y-1.5 max-h-32 overflow-y-auto rounded-lg border border-border bg-background p-3">
                          {result.scanMetadata.runtimeDiagnostics.failedRequests.map((f, i) => (
                            <li key={i} className="break-all text-foreground/90">
                              {f.url}
                              {f.errorText ? `: ${f.errorText}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}

              {manualFollowUps.length > 0 ? (
                <Card className="border-2 border-primary/15 shadow-none">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-sm font-bold font-sans">Recommended manual checks</h3>
                    <ul className="space-y-3">
                      {manualFollowUps.map((item) => (
                        <li key={item.id} className="text-sm leading-relaxed">
                          <span className="font-semibold font-sans text-foreground">{item.title}. </span>
                          <span className="text-muted-foreground">{item.detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="border shadow-none">
                <CardContent className="p-6 space-y-3">
                  <h3 className="text-sm font-bold font-sans">Open in toolkit</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Continue on the scanned URL with in-browser tools (each opens in a new context on our servers).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
                      <Link href={`/tools/focus-order?url=${toolTargetUrl}`}>Focus order</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
                      <Link href={`/tools/screen-reader-preview?url=${toolTargetUrl}`}>Screen reader preview</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
                      <Link href={`/tools/colour-blindness?url=${toolTargetUrl}`}>Colour blindness</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
                      <Link href={`/tools/low-vision?url=${toolTargetUrl}`}>Low vision</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold">
                      <Link href={`/tools/contrast-checker`}>Contrast checker</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
          </div>

          {/* Violations */}
          <div
            ref={violationsToolbarRef}
            className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4"
          >
            <h3 className="text-lg font-bold font-sans text-foreground">Violations</h3>
            {violations.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 text-xs font-semibold transition-transform active:scale-[0.97] motion-reduce:transition-none"
                  disabled={violations.length <= 1}
                  onClick={() => goToAdjacentViolation(-1)}
                  aria-label="Previous violation"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1 text-xs font-semibold transition-transform active:scale-[0.97] motion-reduce:transition-none"
                  disabled={violations.length <= 1}
                  onClick={() => goToAdjacentViolation(1)}
                  aria-label="Next violation"
                >
                  Next
                  <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant={simpleView ? "default" : "outline"}
                  size="sm"
                  className="h-9 gap-1.5 text-xs font-semibold transition-transform active:scale-[0.98] motion-reduce:transition-none"
                  onClick={() => setSimpleView((v) => !v)}
                  aria-pressed={simpleView}
                  aria-label={simpleView ? "Show technical details for each issue" : "Simple view: hide rule ids and tuck details away"}
                >
                  <ScanText className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  {simpleView ? "Simple view on" : "Simple view"}
                </Button>
              </div>
            ) : null}
          </div>
          <div ref={violationsListRef} className="space-y-6 mb-12">
            {violations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No violations in this result.
              </p>
            ) : (
              violations.map((violation, i) => {
                const human = getHumanContextForViolation(violation);
                const whatHappensLine = getWhatHappensLine(human);
                const instanceCount = violation.instanceDetails?.length ?? 0;

                return (
                <article
                  key={`${violation.id}-${i}`}
                  id={`audit-violation-${i}`}
                  data-violation-card
                  ref={(el) => {
                    violationArticleRefs.current[i] = el;
                  }}
                  tabIndex={-1}
                  aria-current={activeViolationIdx === i ? "true" : undefined}
                  className={cn(
                    violationRowClass(violation.impact),
                    "scroll-mt-24 outline-none flex flex-col gap-8 p-6 md:p-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none",
                  )}
                  onFocus={() => setActiveViolationIdx(i)}
                >
                  <div className="flex flex-col md:flex-row gap-5 md:gap-8 items-start md:items-start pb-6 border-b border-border">
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={violation.impact === "critical" ? "destructive" : "outline"}
                          className="text-xs capitalize font-medium"
                        >
                          {violation.impact}
                        </Badge>
                        {violation.detectedInViewports && violation.detectedInViewports.length > 0
                          ? violation.detectedInViewports.map((vp) => (
                              <span
                                key={vp}
                                className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-primary/10 px-2.5 py-0.5 text-primary"
                              >
                                {vp}
                              </span>
                            ))
                          : null}
                        {!simpleView ? (
                          <>
                            <span className="font-mono text-xs text-muted-foreground">{violation.wcagCriteria}</span>
                            <span className="font-mono text-[10px] text-muted-foreground/80">Rule: {violation.id}</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground font-sans">{violation.wcagCriteria}</span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold font-sans text-foreground leading-snug">
                        {human.plainLead}
                      </h4>
                      {!simpleView ? (
                        <p className="text-sm text-muted-foreground leading-relaxed">{violation.description}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0 md:text-right md:min-w-22 md:pl-2">
                      <p className="text-2xl font-bold font-sans tabular-nums text-foreground tracking-tight">
                        {violation.affectedElements}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-sans font-medium">nodes</p>
                    </div>
                  </div>

                  <details open className="group rounded-lg border border-border bg-muted/20 p-5">
                    <summary className="cursor-pointer list-none text-sm font-semibold font-sans text-foreground flex items-center gap-2 pb-4 mb-0 border-b border-border/60 [&::-webkit-details-marker]:hidden">
                      <ScrollText
                        className="w-4 h-4 text-primary shrink-0 transition-transform duration-500 ease-out group-open:rotate-6 motion-reduce:transition-none"
                        aria-hidden
                      />
                      Why this matters
                    </summary>
                    <ViolationHumanContextPanel human={human} />
                  </details>

                  <ViolationWhereOnPage violation={violation} whatHappensLine={whatHappensLine} />

                  {violation.help ? (
                    <div className="rounded-lg border border-border bg-muted/25 p-5">
                      <p className="text-sm text-foreground leading-relaxed">
                        <span className="font-semibold font-sans">How to fix: </span>
                        {violation.help}
                      </p>
                      {violation.helpUrl ? (
                        <a
                          href={violation.helpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2"
                        >
                          Open rule documentation
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                  ) : violation.helpUrl ? (
                    <div>
                      <a
                        href={violation.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2"
                      >
                        Open rule documentation
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      </a>
                    </div>
                  ) : null}

                  <details className="rounded-lg border border-border bg-muted/15 p-5">
                    <summary className="cursor-pointer list-none text-sm font-semibold font-sans text-foreground pb-4 mb-0 border-b border-border/60 [&::-webkit-details-marker]:hidden">
                      Technical details
                      {instanceCount > 0 ? (
                        <span className="text-muted-foreground font-normal font-mono text-xs ml-2">
                          ({instanceCount} instance{instanceCount === 1 ? "" : "s"})
                        </span>
                      ) : null}
                    </summary>
                    <div className="space-y-4 pt-4">
                      {simpleView ? (
                        <p className="text-sm text-foreground leading-snug">{violation.description}</p>
                      ) : null}
                      <ViolationElementExamples violation={violation} />
                    </div>
                  </details>
                </article>
                );
              })
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
