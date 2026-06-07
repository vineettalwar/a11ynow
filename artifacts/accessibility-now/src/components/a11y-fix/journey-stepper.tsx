import Link from "next/link";
import { Check } from "lucide-react";
import { A11Y_FIX_JOURNEY_STEPS, type A11yFixJourneyStep } from "@/lib/a11y-fix";
import { cn } from "@/lib/utils";

const STEP_INDEX: Record<A11yFixJourneyStep, number> = {
  choose: 0,
  scan: 1,
  plan: 2,
  act: 3,
};

export function A11yFixJourneyStepper({
  current,
  planHref,
}: {
  current: A11yFixJourneyStep;
  planHref?: string;
}) {
  const currentIdx = STEP_INDEX[current];

  return (
    <nav aria-label="A11y Fix journey progress" className="w-full">
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {A11Y_FIX_JOURNEY_STEPS.map((step, idx) => {
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          const isPlan = step.id === "plan";
          const content = (
            <>
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-sans border shrink-0",
                  done && "bg-primary border-primary text-primary-foreground",
                  active && !done && "border-primary bg-primary/10 text-primary",
                  !done && !active && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" aria-hidden /> : idx + 1}
              </span>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-semibold font-sans mt-1.5",
                  active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </>
          );

          return (
            <li key={step.id} className="flex flex-1 flex-col items-center min-w-0 relative">
              {idx < A11Y_FIX_JOURNEY_STEPS.length - 1 && (
                <span
                  className={cn(
                    "hidden sm:block absolute top-3.5 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-px",
                    idx < currentIdx ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
              {isPlan && planHref && (done || active) ? (
                <Link
                  href={planHref}
                  className="flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-1"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex flex-col items-center px-1">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
