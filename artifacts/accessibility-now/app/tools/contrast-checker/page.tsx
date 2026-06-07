import { Suspense } from "react";
import ContrastCheckerPage from "@/views/tools/contrast-checker";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ContrastCheckerPage />
    </Suspense>
  );
}
