import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function A11yFixToolkitLinks({ scannedUrl }: { scannedUrl: string }) {
  const toolTargetUrl = encodeURIComponent(scannedUrl);

  return (
    <div className="rounded-2xl border border-border bg-background p-6 space-y-3">
      <h3 className="font-bold font-sans text-sm">Continue in toolkit</h3>
      <p className="text-xs text-muted-foreground">
        Deep-dive on the scanned URL with browser-based tools — no install required.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold [box-shadow:none]">
          <Link href={`/tools/focus-order?url=${toolTargetUrl}`}>Focus order</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold [box-shadow:none]">
          <Link href={`/tools/screen-reader-preview?url=${toolTargetUrl}`}>Screen reader</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold [box-shadow:none]">
          <Link href={`/tools/colour-blindness?url=${toolTargetUrl}`}>Colour blindness</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold [box-shadow:none]">
          <Link href={`/tools/low-vision?url=${toolTargetUrl}`}>Low vision</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-9 text-xs font-semibold [box-shadow:none]">
          <Link href="/tools/contrast-checker">Contrast checker</Link>
        </Button>
      </div>
    </div>
  );
}
