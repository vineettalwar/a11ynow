import { Suspense } from "react";
import ColourBlindnessPage from "@/views/tools/colour-blindness";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ColourBlindnessPage />
    </Suspense>
  );
}
