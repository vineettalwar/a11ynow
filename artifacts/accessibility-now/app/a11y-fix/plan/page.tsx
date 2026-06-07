import { Suspense } from "react";
import A11yFixPlan from "@/views/a11y-fix/plan";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <A11yFixPlan />
    </Suspense>
  );
}
