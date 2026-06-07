"use client";

import { registerScrollTrigger } from "@/lib/register-scroll-trigger";

registerScrollTrigger();

export function GsapProvider({ children }: { children: React.ReactNode }) {
  return children;
}
