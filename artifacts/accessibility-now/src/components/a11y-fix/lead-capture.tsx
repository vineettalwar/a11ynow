import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCreateLead } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function A11yFixLeadCapture({ auditId }: { auditId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    createLead.mutate(
      { data: { name: name.trim(), email: email.trim(), auditId } },
      { onSuccess: () => setSubmitted(true) },
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="font-bold font-sans text-sm">We will be in touch.</p>
        <p className="text-xs text-muted-foreground">
          Your report context goes to <span className="font-medium text-foreground">{email}</span> within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="a11y-fix-lead-name" className="text-xs font-semibold font-sans block mb-1.5">
            Your name
          </label>
          <Input
            id="a11y-fix-lead-name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="a11y-fix-lead-email" className="text-xs font-semibold font-sans block mb-1.5">
            Work email
          </label>
          <Input
            id="a11y-fix-lead-email"
            type="email"
            placeholder="jane@company.de"
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
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending…
          </>
        ) : (
          "Get the full report →"
        )}
      </Button>
      {createLead.isError && (
        <p className="text-xs text-destructive text-center">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
