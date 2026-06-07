"use client";

import { useEffect, useState } from "react";

/**
 * Elapsed seconds counter for long-running scans.
 */
export function AuditScanElapsed({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;
    setSeconds(0);
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <p className="text-xs text-muted-foreground font-sans tabular-nums">
      Elapsed: {seconds}s
      {seconds > 45 ? " — large pages and multi-viewport scans can take a minute or more" : ""}
    </p>
  );
}
