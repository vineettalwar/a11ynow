import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getAppBasePath } from "@/lib/api-base";

const BASE = getAppBasePath();

export function A11yFixMonitorSetup({ url, auditId }: { url: string; auditId: string }) {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [token, setToken] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsPending(true);
    try {
      const res = await fetch(`${BASE}/api/monitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email: email.trim(), frequency, auditId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { token: string };
      setToken(data.token);
    } catch (err) {
      toast({
        title: "Monitoring setup failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  }

  const monitorUrl = token ? `${window.location.origin}${BASE}/monitor/${token}` : null;

  if (token && monitorUrl) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-3">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
        <p className="font-bold font-sans text-sm">Monitoring is active</p>
        <p className="text-xs text-muted-foreground">
          Summaries go to <span className="font-medium text-foreground">{email}</span>. Bookmark your dashboard:
        </p>
        <a href={monitorUrl} className="font-mono text-xs text-primary underline underline-offset-2 break-all block">
          {monitorUrl}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-muted/20 p-6 space-y-4">
      <div>
        <h3 className="font-bold font-sans text-sm mb-1">Set up free monitoring</h3>
        <p className="text-xs text-muted-foreground">
          Baseline saved from this scan. Get email summaries when we re-check your site.
        </p>
      </div>
      <div>
        <label htmlFor="a11y-fix-monitor-email" className="text-xs font-semibold font-sans block mb-1.5">
          Email for scan summaries
        </label>
        <Input
          id="a11y-fix-monitor-email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div>
        <span className="text-xs font-semibold font-sans block mb-1.5">Frequency</span>
        <div className="flex gap-2">
          {(["weekly", "monthly"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={[
                "flex-1 h-10 rounded-lg border text-xs font-semibold font-sans capitalize transition-colors",
                frequency === f
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={isPending || !email.trim()}>
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start monitoring →"}
      </Button>
    </form>
  );
}
