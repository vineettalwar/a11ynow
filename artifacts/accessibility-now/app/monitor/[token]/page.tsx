import { Suspense } from "react";
import MonitorPage from "@/views/monitor";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MonitorPage />
    </Suspense>
  );
}
