import { Suspense } from "react";
import ShopifyEaaChecklist from "@/views/resources/checklists/shopify-eaa";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ShopifyEaaChecklist />
    </Suspense>
  );
}
