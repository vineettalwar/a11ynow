"use client";

function parseScanTarget(raw: string): { href: string; host: string; path: string } | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    u.hash = "";
    const path = `${u.pathname}${u.search}` || "/";
    return {
      href: u.href,
      host: u.hostname,
      path: path || "/",
    };
  } catch {
    return null;
  }
}

/**
 * Prominent label for which URL/path is actively being scanned.
 */
export function AuditScanTarget({ pageUrl }: { pageUrl: string }) {
  const target = parseScanTarget(pageUrl);
  if (!target) return null;

  return (
    <div className="mx-auto max-w-xl w-full rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-left shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2 font-sans">
        Page under review
      </p>
      <p className="font-mono text-sm text-foreground break-all leading-relaxed" title={target.href}>
        {target.href}
      </p>
      {target.path !== "/" && (
        <p className="mt-1.5 text-xs text-muted-foreground font-sans">
          Path: <span className="font-mono text-foreground">{target.path}</span>
        </p>
      )}
    </div>
  );
}
