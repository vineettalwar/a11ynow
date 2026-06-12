import { Suspense } from "react";
import A11yFixResultRedirect from "@/views/a11y-fix/result-redirect";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <A11yFixResultRedirect />
    </Suspense>
  );
}
