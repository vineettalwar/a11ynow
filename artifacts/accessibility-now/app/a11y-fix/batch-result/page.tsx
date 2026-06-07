import { Suspense } from "react";
import A11yFixBatchResult from "@/views/a11y-fix/batch-result";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <A11yFixBatchResult />
    </Suspense>
  );
}
