"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  localeFromPathname,
  switchLocalePath,
  type Locale,
} from "@/lib/i18n/locale";
import { getSiteMessages } from "@/lib/i18n/site-messages";

type LanguageSwitcherProps = {
  className?: string;
  /** Compact header style vs. footer with visible labels */
  variant?: "compact" | "footer";
};

export function LanguageSwitcher({ className, variant = "compact" }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const messages = getSiteMessages(locale).languageSwitcher;

  const locales: { code: Locale; label: string; short: string }[] = [
    { code: "en", label: messages.english, short: "EN" },
    { code: "de", label: messages.german, short: "DE" },
  ];

  return (
    <nav
      aria-label={messages.label}
      className={cn(
        "flex items-center",
        variant === "compact" ? "gap-0.5 text-xs font-medium" : "gap-2 text-sm",
        className,
      )}
    >
      {locales.map(({ code, label, short }, index) => {
        const href = switchLocalePath(pathname, code);
        const isActive = locale === code;

        return (
          <span key={code} className="inline-flex items-center">
            {index > 0 && (
              <span aria-hidden="true" className="mx-1 text-muted-foreground/60">
                |
              </span>
            )}
            <Link
              href={href}
              lang={code}
              hrefLang={code}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="sr-only">{label}</span>
              <span aria-hidden="true">{short}</span>
            </Link>
          </span>
        );
      })}
    </nav>
  );
}
