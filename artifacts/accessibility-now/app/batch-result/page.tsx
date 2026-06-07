import { Suspense } from "react";
import BatchResultPage from "@/views/batch-result";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BatchResultPage />
    </Suspense>
  );
}
