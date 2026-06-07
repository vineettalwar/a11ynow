import { Suspense } from "react";
import A11yFixResult from "@/views/a11y-fix/result";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <A11yFixResult />
    </Suspense>
  );
}
