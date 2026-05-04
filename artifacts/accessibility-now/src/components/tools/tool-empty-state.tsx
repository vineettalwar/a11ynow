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
    <div className={`rounded-2xl border border-border/80 bg-background p-10 sm:p-12 text-center shadow-[0_1px_0_rgba(0,0,0,0.04)] ${className ?? ""}`}>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 mx-auto ring-1 ring-primary/10">
        <Icon className="w-6 h-6 text-primary" aria-hidden />
      </div>
      <p className="text-base font-semibold font-sans text-foreground mb-2 tracking-tight">{title}</p>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{description}</p>
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}
