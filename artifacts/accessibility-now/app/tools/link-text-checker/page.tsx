import { Suspense } from "react";
import LinkTextChecker from "@/views/tools/link-text-checker";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LinkTextChecker />
    </Suspense>
  );
}
