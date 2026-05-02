import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useCreateAudit, useCreateLead, getAudit, getGetAuditQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, Loader2, CheckCircle2, Mail } from "lucide-react";
import { Link } from "wouter";

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
        <h1 className="text-display-md font-extrabold mb-4">No URL provided</h1>
        <p className="text-muted-foreground mb-8">Please provide a URL to run the audit.</p>
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
      <div className="hero-gradient min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-6" />
          <h1 className="text-display-md font-extrabold mb-4">
            Scanning<br />
            <span className="heading-accent">your site.</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Running automated WCAG 2.1 AA checks against{" "}
            <span className="font-mono text-foreground">{displayUrl}</span>.<br />
            This typically takes 15–30 seconds.
          </p>
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

  if (!result) return null;

  const scannedDate = new Date(result.scannedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <section className="hero-gradient pt-16 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-display-md font-extrabold mb-3">
            Audit <span className="heading-accent">result.</span>
          </h1>
          <p className="font-mono text-sm text-muted-foreground bg-muted inline-block px-3 py-1 rounded-lg mb-2">
            {result.url}
          </p>
          <p className="text-xs text-muted-foreground font-mono">Scanned {scannedDate}</p>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          {/* Score + stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

          {/* Violations */}
          <h3 className="text-xl font-extrabold font-sans mb-5">Top violations found</h3>
          <div className="space-y-3 mb-12">
            {result.violations.map((violation, i) => (
              <Card key={i} className="border-l-4 border-l-destructive">
                <CardContent className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Badge
                        variant={violation.impact === "critical" ? "destructive" : "default"}
                        className="uppercase text-xs"
                      >
                        {violation.impact}
                      </Badge>
                      <span className="font-mono text-xs font-medium text-muted-foreground">
                        {violation.wcagCriteria}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold font-sans">{violation.description}</h4>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-extrabold font-sans">{violation.affectedElements}</div>
                    <div className="text-xs text-muted-foreground font-mono">affected elements</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Lead Capture */}
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
                    send a summary of what a full manual audit would uncover — no obligation.
                  </p>
                </div>
                <div className="md:col-span-3">
                  <LeadCaptureForm auditId={result.auditId} />
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
            screen readers will reveal 3–5× more issues — and is required for legal sign-off.
          </p>
          <Button asChild className="h-12 px-8 text-sm font-bold">
            <Link href="/contact">Get a full audit</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
