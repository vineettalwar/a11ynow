"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { GsapProvider } from "@/components/gsap-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <GsapProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </GsapProvider>
    </QueryClientProvider>
  );
}
