import { Suspense } from "react";
import LowVisionPage from "@/views/tools/low-vision";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LowVisionPage />
    </Suspense>
  );
}
