import { Suspense } from "react";
import AltTextChecker from "@/views/tools/alt-text-checker";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AltTextChecker />
    </Suspense>
  );
}
