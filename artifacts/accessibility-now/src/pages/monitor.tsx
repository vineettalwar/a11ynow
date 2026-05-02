import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertOctagon, TrendingUp, Calendar, Globe } from "lucide-react";
import { Link } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface MonitorScan {
  id: string;
  score: number;
  level: string;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  passedChecks: number;
  totalChecks: number;
  scannedAt: string;
}

interface MonitorLatest {
  score: number;
  level: string;
  totalViolations: number;
  criticalViolations: number;
  seriousViolations: number;
  violations: Array<{
    id: string;
    wcagCriteria: string;
    description: string;
    impact: "minor" | "moderate" | "serious" | "critical";
    affectedElements: number;
    topSelectors: string[];
  }>;
  passedChecks: number;
  totalChecks: number;
  scannedAt: string;
}

interface MonitorData {
  url: string;
  frequency: string;
  createdAt: string;
  nextScanAt: string;
  scans: MonitorScan[];
  latest: MonitorLatest | null;
}

function levelColor(level: string) {
  switch (level) {
    case "excellent": return "text-emerald-600";
    case "good": return "text-green-500";
    case "moderate": return "text-yellow-500";
    case "poor": return "text-orange-500";
    case "critical": return "text-destructive";
    default: return "text-foreground";
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatFull(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const score = payload[0].value;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-xs font-mono">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-bold text-base" style={{ color: scoreColor(score) }}>
        {score}<span className="text-muted-foreground font-normal">/100</span>
      </p>
    </div>
  );
}

export default function MonitorPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data, isLoading, isError } = useQuery<MonitorData>({
    queryKey: ["monitor", token],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/monitor/${token}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<MonitorData>;
    },
    enabled: !!token,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="hero-gradient min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-6" />
          <h1 className="text-display-md font-extrabold mb-3">
            Loading your<br />
            <span className="heading-accent">monitor.</span>
          </h1>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="hero-gradient min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertOctagon className="w-10 h-10 text-destructive mx-auto mb-6" />
          <h1 className="text-display-md font-extrabold mb-3">
            Monitor <span className="heading-accent">not found.</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            This monitoring token is invalid or has been removed. Double-check the link in your confirmation email.
          </p>
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const chartData = data.scans.map((s) => ({
    date: formatDate(s.scannedAt),
    score: s.score,
    violations: s.totalViolations,
  }));

  const hasScans = data.scans.length > 0;
  const latest = data.latest;

  const latestScore = latest?.score ?? null;
  const previousScore = data.scans.length >= 2 ? data.scans[data.scans.length - 2].score : null;
  const scoreDelta = latestScore !== null && previousScore !== null ? latestScore - previousScore : null;

  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-16 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              <span className="truncate max-w-xs">{data.url}</span>
            </div>
            <h1 className="text-display-md font-extrabold">
              Compliance <span className="heading-accent">monitor.</span>
            </h1>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-mono mt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {data.frequency === "weekly" ? "Weekly" : "Monthly"} scans
              </span>
              <span>
                Next scan: <span className="text-foreground font-medium">{formatFull(data.nextScanAt)}</span>
              </span>
              <span>
                Registered: <span className="text-foreground font-medium">{formatFull(data.createdAt)}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-5xl space-y-10">

          {!hasScans && (
            <Card className="border-2 border-dashed border-muted-foreground/20">
              <CardContent className="p-10 text-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-bold font-sans mb-2">No scans yet</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Your first scan will run automatically on the next scheduled date. Check back soon.
                </p>
              </CardContent>
            </Card>
          )}

          {hasScans && (
            <>
              {/* Latest score + delta */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="md:col-span-1">
                  <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full gap-2">
                    <div
                      className="text-5xl font-extrabold font-sans"
                      style={{ color: latestScore !== null ? scoreColor(latestScore) : undefined }}
                    >
                      {latestScore ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Current score</div>
                    {scoreDelta !== null && (
                      <div className={`text-xs font-bold font-mono ${scoreDelta >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                        {scoreDelta >= 0 ? `▲ +${scoreDelta}` : `▼ ${scoreDelta}`} vs last scan
                      </div>
                    )}
                    {latest && (
                      <Badge variant="outline" className={`capitalize text-xs ${levelColor(latest.level)}`}>
                        {latest.level}
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {latest && (
                  <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { value: latest.criticalViolations, label: "Critical", color: "text-destructive" },
                      { value: latest.seriousViolations, label: "Serious", color: "text-primary" },
                      { value: latest.totalViolations, label: "Total violations", color: "text-foreground" },
                      { value: `${latest.passedChecks}/${latest.totalChecks}`, label: "Passed checks", color: "text-emerald-600" },
                    ].map(({ value, label, color }) => (
                      <Card key={label}>
                        <CardContent className="p-4">
                          <div className={`text-2xl font-extrabold font-sans mb-1 ${color}`}>{value}</div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-sans">{label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Score trend chart */}
              {data.scans.length >= 1 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-base font-extrabold font-sans mb-1">Score trend</h2>
                    <p className="text-xs text-muted-foreground font-mono mb-6">
                      Accessibility score over the last {data.scans.length} scans
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: "Good", position: "right", fontSize: 10, fill: "#10b981", fontFamily: "JetBrains Mono, monospace" }} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#FF4D1C"
                          strokeWidth={2.5}
                          dot={{ fill: "#FF4D1C", r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: "#FF4D1C" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Scan history table */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-base font-extrabold font-sans mb-5">Scan history</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="text-muted-foreground uppercase tracking-wider border-b border-border">
                          <th className="text-left pb-3 pr-4">Date</th>
                          <th className="text-right pb-3 pr-4">Score</th>
                          <th className="text-right pb-3 pr-4">Critical</th>
                          <th className="text-right pb-3 pr-4">Serious</th>
                          <th className="text-right pb-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...data.scans].reverse().map((scan, i) => (
                          <tr key={scan.id} className={`border-b border-border/50 ${i === 0 ? "font-bold" : ""}`}>
                            <td className="py-3 pr-4 text-muted-foreground">{formatFull(scan.scannedAt)}</td>
                            <td className="py-3 pr-4 text-right" style={{ color: scoreColor(scan.score) }}>
                              {scan.score}
                            </td>
                            <td className="py-3 pr-4 text-right text-destructive">{scan.criticalViolations}</td>
                            <td className="py-3 pr-4 text-right text-primary">{scan.seriousViolations}</td>
                            <td className="py-3 text-right">{scan.totalViolations}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Latest violations */}
              {latest && latest.violations.length > 0 && (
                <div>
                  <h2 className="text-xl font-extrabold font-sans mb-5">
                    Latest violations — {formatDate(latest.scannedAt)}
                  </h2>
                  <div className="space-y-3">
                    {latest.violations.map((v, i) => (
                      <Card key={i} className="border-l-4 border-l-destructive">
                        <CardContent className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-2">
                              <Badge
                                variant={v.impact === "critical" ? "destructive" : "default"}
                                className="uppercase text-xs"
                              >
                                {v.impact}
                              </Badge>
                              <span className="font-mono text-xs font-medium text-muted-foreground">
                                {v.wcagCriteria}
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold font-sans">{v.description}</h4>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-extrabold font-sans">{v.affectedElements}</div>
                            <div className="text-xs text-muted-foreground font-mono">affected elements</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="py-16 px-4 bg-foreground text-background">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-display-md font-extrabold text-white mb-4">
            Turn scores into<br />
            <span style={{ color: "#FF4D1C", fontStyle: "italic" }}>real fixes.</span>
          </h2>
          <p className="text-gray-400 text-sm mb-10 max-w-xl mx-auto">
            Monitoring tells you where you are. Our remediation service fixes the issues and keeps
            your site EAA compliant — permanently.
          </p>
          <Button asChild className="h-12 px-8 text-sm font-bold">
            <Link href="/contact?service=remediation">Get remediation support</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
