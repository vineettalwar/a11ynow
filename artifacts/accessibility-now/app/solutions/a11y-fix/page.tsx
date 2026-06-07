import { Suspense } from "react";
import A11yFixLanding from "@/views/solutions/a11y-fix";

export const dynamic = "force-dynamic";

function A11yFixLandingFallback() {
  return (
    <div className="flex flex-col w-full animate-pulse">
      <section className="hero-gradient pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl space-y-6">
          <div className="h-10 bg-muted/40 rounded-lg max-w-md mx-auto" />
          <div className="h-4 bg-muted/30 rounded max-w-xs mx-auto" />
          <div className="h-12 bg-muted/40 rounded-lg max-w-lg mx-auto" />
          <div className="h-4 bg-muted/30 rounded max-w-2xl mx-auto" />
        </div>
      </section>
      <section className="py-12 px-4 bg-white border-b">
        <div className="container mx-auto max-w-3xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted/30 rounded-2xl" />
            ))}
          </div>
          <div className="h-14 bg-muted/30 rounded-xl" />
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<A11yFixLandingFallback />}>
      <A11yFixLanding />
    </Suspense>
  );
}
