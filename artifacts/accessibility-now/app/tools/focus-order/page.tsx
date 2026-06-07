import { Suspense } from "react";
import FocusOrderPage from "@/views/tools/focus-order";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FocusOrderPage />
    </Suspense>
  );
}
