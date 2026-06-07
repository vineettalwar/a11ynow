"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/** Triggers the browser print dialog once report content has rendered. */
export function AutoPrint({ enabled = true }: { enabled?: boolean }) {
  const sp = useSearchParams();
  const fired = useRef(false);
  const shouldPrint = enabled && sp.get("print") === "1";

  useEffect(() => {
    if (!shouldPrint || fired.current) return;
    fired.current = true;
    const id = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(id);
  }, [shouldPrint]);

  return null;
}
