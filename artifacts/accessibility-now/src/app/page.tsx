const quickLinks = [
  {
    href: "/api/healthz",
    label: "Health route",
    detail: "Minimal Route Handler proving the Next + OpenNext API path.",
  },
  {
    href: "http://127.0.0.1:5180",
    label: "Legacy Vite app",
    detail: "The existing Vite SPA remains unchanged during Phase 0.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <section className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Phase 0 foundation
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Next.js 16 + OpenNext scaffold
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            This route exists only to prove the new App Router shell, styling,
            providers, and Cloudflare Worker preview path while the Vite app
            stays intact.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((item) => (
            <div
              key={item.href}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold">{item.label}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.detail}
              </p>
              <a
                href={item.href}
                className="mt-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                Open
              </a>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
