import { Suspense } from "react";
import WebsiteScannerPage from "@/views/tools/website-scanner";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <WebsiteScannerPage />
    </Suspense>
  );
}
