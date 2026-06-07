"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n/locale";

/** Keeps `<html lang>` in sync with the active locale from the URL prefix. */
export function HtmlLang() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = localeFromPathname(pathname);
  }, [pathname]);

  return null;
}
