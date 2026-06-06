/**
 * Delegate scans to a Cloudflare Browser Rendering worker when configured.
 * Set SCAN_WORKER_URL (e.g. https://accessibility-now-scan.workers.dev) and
 * optionally SCAN_WORKER_TOKEN for Bearer auth.
 */

import type { AuditViolation, ScanEngine, ScanMetadata, ScanProfile, ScanViewport } from "./scan";
import { buildComplianceReport, enrichViolationsWithCompliance } from "./compliance/bitv-bfsg";
import { runSupplementalChecksFromHtml } from "./supplemental-checks";
import { scoreToLevel } from "./scan";

export function cloudflareScanEnabled(): boolean {
  const url = process.env.SCAN_WORKER_URL?.trim();
  return Boolean(url && url.startsWith("https://"));
}

function tagToWcagCriteria(tags: string[]): string {
  const wcagTag = tags.find((t) => /^wcag\d{3,}$/.test(t));
  if (wcagTag) {
    const digits = wcagTag.replace("wcag", "");
    const parts: string[] = [];
    if (digits.length >= 1) parts.push(digits[0]);
    if (digits.length >= 2) parts.push(digits[1]);
    if (digits.length >= 3) parts.push(digits.slice(2));
    return parts.join(".");
  }
  if (tags.includes("best-practice")) return "Best Practice";
  return "WCAG 2.1";
}

interface CloudflareScanResponse {
  violations: Array<{
    id: string;
    tags: string[];
    description: string;
    impact?: string | null;
    nodes: Array<{ target?: unknown }>;
    help?: string;
    helpUrl?: string;
  }>;
  passedChecks: number;
  totalChecks: number;
  pageScreenshot?: string;
  viewportsUsed?: ScanViewport[];
}

export async function runCloudflareScan(
  url: string,
  options: { profile?: ScanProfile; multiViewport?: boolean },
): Promise<{
  score: number;
  level: ReturnType<typeof scoreToLevel>;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  violations: AuditViolation[];
  passedChecks: number;
  totalChecks: number;
  scanEngine: ScanEngine;
  pageScreenshot?: string;
  scanMetadata?: ScanMetadata;
  complianceReport: ReturnType<typeof buildComplianceReport>;
}> {
  const workerUrl = process.env.SCAN_WORKER_URL!.replace(/\/$/, "");
  const token = process.env.SCAN_WORKER_TOKEN?.trim();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${workerUrl}/scan`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url,
      profile: options.profile ?? "default",
      multiViewport: options.multiViewport ?? false,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Cloudflare scan worker returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as CloudflareScanResponse;

  let violations: AuditViolation[] = data.violations.map((v) => ({
    id: v.id,
    wcagCriteria: tagToWcagCriteria(v.tags ?? []),
    description: v.description,
    impact: (v.impact as AuditViolation["impact"]) ?? "minor",
    affectedElements: v.nodes?.length ?? 0,
    topSelectors: (v.nodes ?? [])
      .slice(0, 3)
      .map((n) => (Array.isArray(n.target) ? n.target.join(" > ") : String(n.target ?? ""))),
    ...(v.help ? { help: v.help } : {}),
    ...(v.helpUrl ? { helpUrl: v.helpUrl } : {}),
  }));

  const htmlRes = await fetch(url, {
    headers: { "User-Agent": "accessibility.now/1.0 Compliance Scanner" },
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  let supplementalFindings = runSupplementalChecksFromHtml("", url).findings;
  if (htmlRes?.ok) {
    const html = await htmlRes.text();
    const supplemental = runSupplementalChecksFromHtml(html, url);
    supplementalFindings = supplemental.findings;
    const existingIds = new Set(violations.map((v) => v.id));
    for (const sv of supplemental.violations) {
      if (!existingIds.has(sv.id)) violations.push(sv);
    }
  }

  violations = enrichViolationsWithCompliance(violations);
  const complianceReport = buildComplianceReport(violations, supplementalFindings);

  const impactWeights: Record<string, number> = { critical: 15, serious: 10, moderate: 5, minor: 2 };
  let deductions = 0;
  for (const v of violations) {
    deductions += (impactWeights[v.impact] ?? 2) * Math.min(v.affectedElements, 3);
  }
  const score = Math.max(0, Math.min(100, Math.round(100 - deductions)));

  const profile = options.profile ?? "default";
  const multiViewport = Boolean(options.multiViewport);

  return {
    score,
    level: scoreToLevel(score),
    totalViolations: violations.length,
    criticalViolations: violations.filter((v) => v.impact === "critical").length,
    seriousViolations: violations.filter((v) => v.impact === "serious").length,
    violations,
    passedChecks: data.passedChecks,
    totalChecks: data.totalChecks,
    scanEngine: "playwright",
    ...(data.pageScreenshot ? { pageScreenshot: data.pageScreenshot } : {}),
    scanMetadata: {
      profile,
      multiViewport,
      viewportsUsed: data.viewportsUsed ?? [{ width: 1280, height: 720, label: "Desktop" }],
      complianceReport,
      supplementalFindings,
    },
    complianceReport,
  };
}
