import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";

/** Preserve query string when redirecting legacy FixPilot URLs to A11y Fix. */
export function LegacyFixPilotRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  const search = useSearch();

  useEffect(() => {
    const qs = search?.trim() ? `?${search.replace(/^\?/, "")}` : "";
    setLocation(`${to}${qs}`);
  }, [setLocation, search, to]);

  return null;
}
