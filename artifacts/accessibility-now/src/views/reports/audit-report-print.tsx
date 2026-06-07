"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAudit } from "@workspace/api-client-react";
import type { AuditResult } from "@workspace/api-client-react";
import { AutoPrint } from "@/components/reports/auto-print";
import { AuditReportDocument } from "@/components/reports/audit-report-document";
import { ReportPrintToolbar } from "@/components/reports/report-print-toolbar";
import { auditRowIsPending, auditRowLooksUsable } from "@/lib/audit-row-status";

function AuditReportPrintInner() {
  const params = useParams();
  const auditId = typeof params?.auditId === "string" ? params.auditId : "";
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auditId) {
      setError("Missing audit ID.");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const load = async () => {
      try {
        const row = await getAudit(auditId);
        if (cancelled) return;
        if (auditRowLooksUsable(row)) {
          setAudit(row);
          return;
        }
        if (auditRowIsPending(row) && attempts < 120) {
          attempts += 1;
          window.setTimeout(load, 1000);
          return;
        }
        setAudit(row);
      } catch {
        if (!cancelled) setError("Could not load audit data for this report.");
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  if (error) {
    return <p className="p-8 text-sm text-destructive">{error}</p>;
  }

  if (!audit) {
    return <p className="p-8 text-sm text-muted-foreground">Loading report…</p>;
  }

  return (
    <>
      <AutoPrint />
      <ReportPrintToolbar title="Accessibility audit report" />
      <AuditReportDocument audit={audit} />
    </>
  );
}

export default function AuditReportPrintPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Loading…</p>}>
      <AuditReportPrintInner />
    </Suspense>
  );
}
