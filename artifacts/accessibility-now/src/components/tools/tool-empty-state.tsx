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
      className={`tool-empty-state rounded-2xl text-center p-10 sm:p-14 md:px-16 md:py-14 ${className ?? ""}`}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-6 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" strokeWidth={2} aria-hidden />
      </div>
      <p className="text-lg sm:text-xl font-bold font-sans text-foreground mb-3 tracking-tight max-w-md mx-auto leading-snug">
        {title}
      </p>
      <div className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed font-sans tracking-tight">
        {description}
      </div>
      {children ? (
        <div className="mt-10 pt-10 border-t border-border/45 max-w-2xl mx-auto">{children}</div>
      ) : null}
    </div>
  );
}
