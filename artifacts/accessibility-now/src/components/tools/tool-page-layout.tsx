import type { ReactNode } from "react";

const mainPyClasses = {
  comfortable: "py-20 md:py-24",
  compact: "py-16 md:py-20",
} as const;

export interface ToolPageLayoutProps {
  /** Small label above the display title */
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  /** Tailwind max-width on the hero + main inner container */
  contentMaxWidth?: string;
  /** Classes on the main inner wrapper (e.g. space-y-8) */
  innerClassName?: string;
  mainPy?: keyof typeof mainPyClasses;
  mainSectionClassName?: string;
}

/**
 * Shared chrome for /tools/* pages: hero gradient + catalog-style main section.
 */
export function ToolPageLayout({
  eyebrow = "Free tool · In-browser",
  title,
  description,
  children,
  contentMaxWidth = "max-w-4xl",
  innerClassName,
  mainPy = "compact",
  mainSectionClassName,
}: ToolPageLayoutProps) {
  return (
    <div className="flex flex-col w-full">
      <section className="hero-gradient pt-24 pb-16 md:pb-20 px-4">
        <div className={`container mx-auto ${contentMaxWidth}`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-5 font-sans">
            {eyebrow}
          </p>
          <h1 className="text-display font-extrabold tracking-tight mb-6">{title}</h1>
          <div className="text-muted-foreground text-base max-w-xl leading-relaxed">{description}</div>
        </div>
      </section>
      <section
        className={`tools-catalog-section border-t border-border/40 px-4 ${mainPyClasses[mainPy]} ${mainSectionClassName ?? ""}`}
      >
        <div className={`container mx-auto ${contentMaxWidth} ${innerClassName ?? ""}`}>{children}</div>
      </section>
    </div>
  );
}
