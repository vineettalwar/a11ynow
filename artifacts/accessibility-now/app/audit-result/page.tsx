import { Suspense } from "react";
import AuditResultPage from "@/views/audit-result";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AuditResultPage />
    </Suspense>
  );
}
