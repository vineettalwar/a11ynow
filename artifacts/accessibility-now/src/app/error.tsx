"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="max-w-xl rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Scaffold error
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          The Next.js foundation route failed.
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {error.message || "Unknown error"}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
