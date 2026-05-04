import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface ToolEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
}

export function ToolEmptyState({ icon: Icon, title, description, children, className }: ToolEmptyStateProps) {
  return (
    <div
      className={`tool-empty-state relative overflow-hidden rounded-2xl border border-[rgba(210,198,178,0.45)] text-center shadow-[0_1px_0_rgba(255,255,255,0.92)_inset,0_2px_4px_rgba(0,0,0,0.03),0_20px_50px_-24px_rgba(0,0,0,0.09)] p-10 sm:p-14 md:px-16 md:py-14 ${className ?? ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5] bg-[radial-gradient(120%_70%_at_50%_-40%,rgba(255,255,255,0.7)_0%,transparent_55%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] bg-linear-to-br from-primary/14 via-primary/8 to-amber-400/12 ring-1 ring-primary/15">
          <Icon className="w-7 h-7 text-primary" strokeWidth={2} aria-hidden />
        </div>
        <p className="text-lg sm:text-xl font-bold font-sans text-foreground mb-3 tracking-tight max-w-md mx-auto leading-snug">
          {title}
        </p>
        {/* div avoids global `p { font-mono }` so body reads as product UI, not code */}
        <div className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed font-sans tracking-tight">
          {description}
        </div>
        {children ? (
          <div className="mt-10 pt-10 border-t border-border/45 max-w-2xl mx-auto">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
