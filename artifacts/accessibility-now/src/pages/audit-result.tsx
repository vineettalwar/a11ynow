import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCreateAudit, getAudit, getGetAuditQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function AuditResult() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const urlParam = searchParams.get("url") || "";
  const auditIdParam = searchParams.get("auditId") || "";

  const createAudit = useCreateAudit();

  const existingAudit = useQuery({
    queryKey: getGetAuditQueryKey(auditIdParam),
    queryFn: () => getAudit(auditIdParam),
    enabled: !!auditIdParam,
    retry: false,
  });

  useEffect(() => {
    if (urlParam && !auditIdParam && !createAudit.data && !createAudit.isPending && !createAudit.isError) {
      createAudit.mutate(
        { data: { url: urlParam } },
        {
          onSuccess: (data) => {
            const params = new URLSearchParams({ auditId: data.auditId, url: data.url });
            navigate(`/audit-result?${params.toString()}`, { replace: true });
          },
        }
      );
    }
  }, [urlParam, auditIdParam]);

  if (!urlParam && !auditIdParam) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">No URL provided</h1>
        <p className="text-muted-foreground mb-8">Please provide a URL to run the compliance snapshot.</p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    );
  }

  const isPending = createAudit.isPending || (!!auditIdParam && existingAudit.isLoading);
  const isError = createAudit.isError || (!!auditIdParam && existingAudit.isError);
  const result = auditIdParam ? existingAudit.data : createAudit.data;
  const displayUrl = result?.url || urlParam;

  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-2xl">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Scanning {displayUrl}</h1>
        <p className="text-muted-foreground">
          Running automated WCAG 2.1 AA checks. This typically takes 15–30 seconds.
          <br />Note: Automated scans only catch ~30% of accessibility issues.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-2xl">
        <AlertOctagon className="w-12 h-12 text-destructive mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Scan failed</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't complete the automated scan for {displayUrl}. The site might be blocking our scanner or unreachable.
        </p>
        <Button asChild>
          <Link href="/">Try another URL</Link>
        </Button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Compliance Snapshot</h1>
        <p className="text-xl text-muted-foreground font-mono bg-muted inline-block px-3 py-1 rounded-md">
          {result.url}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="col-span-1 border-2">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
            <div className="relative w-40 h-40 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90" aria-hidden="true">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-muted" />
                <circle
                  cx="80" cy="80" r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * result.score) / 100}
                  className={result.score >= 90 ? "text-secondary" : result.score >= 50 ? "text-yellow-500" : "text-destructive"}
                />
              </svg>
              <div className="absolute text-4xl font-bold">{result.score}</div>
            </div>
            <h2 className="text-2xl font-bold mb-2 capitalize">{result.level}</h2>
            <p className="text-muted-foreground">Automated Score</p>
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-destructive mb-2">{result.criticalViolations}</div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Critical Violations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">{result.seriousViolations}</div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Serious Violations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-4xl font-bold mb-2">{result.totalViolations}</div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Violations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-secondary mb-2">{result.passedChecks}/{result.totalChecks}</div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Passed Checks</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-6">Top Violations Found</h3>
      <div className="space-y-4 mb-16">
        {result.violations.map((violation, i) => (
          <Card key={i} className="border-l-4 border-l-destructive">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={violation.impact === "critical" ? "destructive" : "default"} className="uppercase">
                    {violation.impact}
                  </Badge>
                  <span className="font-mono text-sm font-medium">{violation.wcagCriteria}</span>
                </div>
                <h4 className="text-lg font-semibold">{violation.description}</h4>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold">{violation.affectedElements}</div>
                <div className="text-sm text-muted-foreground">affected elements</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-foreground text-background rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-bold mb-4">This is only an automated snapshot.</h2>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Automated tools only detect roughly 30% of WCAG violations. A full manual audit with screen readers will reveal 3–5x more issues.
        </p>
        <Button asChild className="h-14 rounded-full px-10 text-lg font-bold">
          <Link href="/contact">Get a full audit</Link>
        </Button>
      </div>
    </div>
  );
}
