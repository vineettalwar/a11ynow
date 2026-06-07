import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="max-w-xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          404
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Route not found in the Next scaffold.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The legacy Vite app is still the primary runtime while App Router
          routes are migrated phase by phase.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Back to scaffold home
        </Link>
      </div>
    </main>
  );
}
