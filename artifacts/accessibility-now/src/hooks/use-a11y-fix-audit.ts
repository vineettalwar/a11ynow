import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCreateAudit, getAudit, getGetAuditQueryKey } from "@workspace/api-client-react";
import type { AuditResult } from "@workspace/api-client-react";

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

function auditRowLooksUsable(row: AuditResult | null | undefined): boolean {
  if (!row?.auditId || !row.url?.trim() || !row.scannedAt) return false;
  const scannedMs = Date.parse(row.scannedAt);
  if (Number.isNaN(scannedMs) || scannedMs <= 0) return false;
  const violationCount = row.violations?.length ?? 0;
  return row.totalChecks > 0 || row.passedChecks > 0 || violationCount > 0 || row.totalViolations > 0;
}

function mergeAuditRow(
  auditId: string,
  fromGet: AuditResult | undefined,
  fromPost: AuditResult | undefined,
): AuditResult | undefined {
  const getUsable = fromGet?.auditId === auditId && auditRowLooksUsable(fromGet);
  const postUsable = fromPost?.auditId === auditId && auditRowLooksUsable(fromPost);
  if (getUsable) return fromGet;
  if (postUsable) return fromPost;
  if (fromPost?.auditId === auditId) return fromPost;
  if (fromGet?.auditId === auditId) return fromGet;
  return undefined;
}

export interface UseA11yFixAuditOptions {
  urlParam: string;
  auditIdParam: string;
  rescanKey: string;
  intent: string;
  /** When false, only load by auditId (plan page). */
  allowScan?: boolean;
}

export function useA11yFixAudit({
  urlParam,
  auditIdParam,
  rescanKey,
  intent,
  allowScan = true,
}: UseA11yFixAuditOptions) {
  const [, navigate] = useLocation();
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
    if (!allowScan || auditIdParam) {
      lastScanIntentKey.current = null;
      return;
    }
    if (!urlParam) return;
    const fp = normalizeUrlForCompare(urlParam);
    const intentKey = rescanKey ? `rescan:${rescanKey}:${fp}` : `url:${fp}`;
    if (lastScanIntentKey.current === intentKey) return;
    lastScanIntentKey.current = intentKey;
    resetCreateAudit();
  }, [allowScan, auditIdParam, rescanKey, resetCreateAudit, urlParam]);

  useEffect(() => {
    if (!allowScan || !urlParam || auditIdParam) return;
    if (createAudit.isPending) return;
    const post = createAudit.data;
    if (!post?.url) return;
    if (!urlsMatchForAudit(post.url, urlParam)) resetCreateAudit();
  }, [allowScan, auditIdParam, createAudit.data, createAudit.isPending, resetCreateAudit, urlParam]);

  useEffect(() => {
    if (!allowScan || !urlParam || auditIdParam) return;
    if (createAudit.isPending) return;
    const post = createAudit.data;
    if (!post?.auditId || !urlsMatchForAudit(post.url, urlParam)) return;
    const params = new URLSearchParams({
      auditId: post.auditId,
      url: post.url,
      intent,
    });
    navigate(`/a11y-fix/result?${params.toString()}`, { replace: true });
  }, [allowScan, auditIdParam, createAudit.data, createAudit.isPending, intent, navigate, urlParam]);

  useEffect(() => {
    if (!allowScan || !urlParam || auditIdParam) return;
    if (createAudit.isPending || createAudit.data || createAudit.isError) return;
    createAuditMutate({
      data: { url: urlParam, profile: "strict", multiViewport: true },
    });
  }, [
    allowScan,
    auditIdParam,
    createAudit.data,
    createAudit.isError,
    createAudit.isPending,
    createAuditMutate,
    urlParam,
  ]);

  const audit = mergeAuditRow(auditIdParam, existingAudit.data, createAudit.data);

  const isLoading =
    (!!auditIdParam && existingAudit.isLoading) ||
    (allowScan && !!urlParam && !auditIdParam && (createAudit.isPending || !audit)) ||
    (allowScan && !!urlParam && !auditIdParam && !createAudit.isError && !audit);

  const isError =
    (!!auditIdParam && existingAudit.isError) ||
    (allowScan && !!urlParam && !auditIdParam && createAudit.isError);

  return {
    audit,
    isLoading,
    isError,
    createAudit,
    existingAudit,
  };
}
