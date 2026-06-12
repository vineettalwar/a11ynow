"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Legacy route — forwards to canonical /audit-result with the same query string. */
export default function A11yFixResultRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("profile")) {
      params.set("profile", "strict");
    }
    router.replace(`/audit-result?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}
