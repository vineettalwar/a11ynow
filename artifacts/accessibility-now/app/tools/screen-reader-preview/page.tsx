import { Suspense } from "react";
import ScreenReaderPreviewPage from "@/views/tools/screen-reader-preview";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScreenReaderPreviewPage />
    </Suspense>
  );
}
