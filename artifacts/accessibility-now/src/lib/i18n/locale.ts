export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "a11ynow_locale";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Strip or add the `/de` URL prefix while preserving the rest of the path. */
export function localizedPath(pathname: string, locale: Locale): string {
  const normalized = stripLocalePrefix(pathname);
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? "/de" : `/de${normalized}`;
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === "/de") return "/";
  if (pathname.startsWith("/de/")) return pathname.slice(3) || "/";
  return pathname;
}

export function localeFromPathname(pathname: string): Locale {
  if (pathname === "/de" || pathname.startsWith("/de/")) return "de";
  return DEFAULT_LOCALE;
}

export function switchLocalePath(pathname: string, locale: Locale): string {
  return localizedPath(stripLocalePrefix(pathname), locale);
}
