import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Router as WouterRouter } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { getAppBasePath } from "@/lib/api-base";

function splitPath(asPath: string) {
  const qIndex = asPath.indexOf("?");
  if (qIndex === -1) {
    return { path: asPath || "/", search: "" };
  }

  return {
    path: asPath.slice(0, qIndex) || "/",
    search: asPath.slice(qIndex + 1),
  };
}

export default function LegacyPagesApp({
  Component,
  pageProps,
}: AppProps) {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());
  const { path, search } = useMemo(
    () => splitPath(router.asPath),
    [router.asPath],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter
          base={getAppBasePath()}
          ssrPath={path}
          ssrSearch={search}
        >
          <Component {...pageProps} />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
