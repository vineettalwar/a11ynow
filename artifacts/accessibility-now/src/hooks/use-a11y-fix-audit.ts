import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCreateAudit, getAudit, getGetAuditQueryKey } from "@workspace/api-client-react";
import {
  auditRefetchIntervalMs,
  auditRowIsFailed,
  auditRowIsPending,
  auditRowLooksUsable,
  mergeAuditRow,
} from "@/lib/audit-row-status";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const createAudit = useCreateAudit();
  const { mutate: createAuditMutate, reset: resetCreateAudit } = createAudit;
  const lastScanIntentKey = useRef<string | null>(null);

  const existingAudit = useQuery({
    queryKey: getGetAuditQueryKey(auditIdParam),
    queryFn: () => getAudit(auditIdParam),
    enabled: !!auditIdParam,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: (query) => auditRefetchIntervalMs(query.state.data),
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
      profile: "strict",
    });
    router.replace(`/audit-result?${params.toString()}`);
  }, [allowScan, auditIdParam, createAudit.data, createAudit.isPending, intent, router, urlParam]);

  useEffect(() => {
    if (!auditIdParam) return;
    if (createAudit.data?.auditId === auditIdParam) {
      resetCreateAudit();
    }
  }, [auditIdParam, createAudit.data?.auditId, resetCreateAudit]);

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

  const waitingForSavedAudit =
    !!auditIdParam &&
    audit === undefined &&
    (existingAudit.isPending || existingAudit.isFetching);
  const scanStillRunning = auditRowIsPending(audit);

  const isLoading =
    createAudit.isPending ||
    waitingForSavedAudit ||
    scanStillRunning ||
    (allowScan && !!urlParam && !auditIdParam && !createAudit.isError && !audit);

  const isError =
    createAudit.isError ||
    auditRowIsFailed(audit) ||
    auditRowIsFailed(existingAudit.data) ||
    (!!auditIdParam &&
      existingAudit.isError &&
      !(createAudit.data?.auditId === auditIdParam));

  return {
    audit,
    isLoading,
    isError,
    createAudit,
    existingAudit,
  };
}
