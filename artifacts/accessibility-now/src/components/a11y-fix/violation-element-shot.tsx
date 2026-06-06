import type { AuditViolation } from "@workspace/api-client-react";
import {
  primaryInstanceElementScreenshot,
  primaryViolationSelector,
} from "@/lib/violation-element-preview";

export function ViolationElementShot({ violation }: { violation: AuditViolation }) {
  const src = primaryInstanceElementScreenshot(violation);
  if (!src) return null;

  const sel = primaryViolationSelector(violation);

  return (
    <figure className="shrink-0 w-full sm:w-[140px] rounded-lg border border-border bg-muted/20 p-2">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground text-center mb-1.5">
        Element at scan
      </p>
      <div className="overflow-hidden rounded-md border border-border/60 bg-muted/40 flex items-center justify-center min-h-[72px] max-h-[100px]">
        <img
          src={src}
          alt={
            sel
              ? `Viewport crop of element matching: ${sel}`
              : "Viewport crop of the element flagged for this issue"
          }
          className="max-h-[100px] w-full object-contain object-center"
          loading="lazy"
        />
      </div>
    </figure>
  );
}
