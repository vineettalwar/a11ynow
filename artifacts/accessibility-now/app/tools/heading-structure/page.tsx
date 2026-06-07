import { Suspense } from "react";
import HeadingStructure from "@/views/tools/heading-structure";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HeadingStructure />
    </Suspense>
  );
}
