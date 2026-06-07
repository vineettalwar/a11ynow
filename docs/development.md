# Developer guide

This document is for engineers working in the repo day to day. For first-time machine setup (Node, pnpm, Postgres, Playwright), start with the root [README](../README.md). For product direction, see [roadmap](roadmap.md). For decisions and pitfalls, see [memory](memory.md). For operations, see [admin](admin.md).

---

## Monorepo layout

| Package | Path | Role |
| --- | --- | --- |
| **App** | `artifacts/accessibility-now` | Next.js 15 App Router + Tailwind v4. Full-stack: UI and `/api/*` route handlers in one process. Deployed to Cloudflare Workers via OpenNext. |
| **OpenAPI** | `lib/api-spec` | `openapi.yaml` is the HTTP contract. Orval generates the client and Zod output. |
| **Generated client** | `lib/api-client-react` | TanStack Query hooks and fetch helpers. **Do not edit by hand.** |
| **Generated Zod** | `lib/api-zod` | Request/response schemas for the server. **Do not edit by hand.** |
| **Database** | `lib/db` | Drizzle schema, migrations, shared DB types. |

**Boundary rule:** the browser app must not import `@workspace/db`. It goes through the REST API only.

---

## Install dependencies

From the **repo root**, a single install pulls dependencies for every workspace package (frontend, API, `lib/*`, `scripts`, and any other path in `pnpm-workspace.yaml`):

```bash
pnpm install
```

You do not need to run install inside individual package folders for normal development.

---

## Local development

### One command (database + both servers)

From the repo root:

```bash
pnpm dev
```

This runs `scripts/dev-local.sh`: starts Docker Postgres (if needed), applies migrations, ensures Playwright Chromium is installed, then starts **Next.js** (`pnpm --filter @workspace/accessibility-now dev`).

- Next.js defaults to port **3000** (or `PORT` if set).
- API routes live at `/api/*` in the same Next.js process (no separate Express server).
- Set `ENABLE_LOCAL_SCHEDULER=1` (enabled by dev scripts) for hourly monitoring scans locally. Production uses Cloudflare Cron → `/api/cron/monitoring`.

### Web without Docker Postgres

Use this when you already have `DATABASE_URL` in `.env`:

```bash
pnpm run dev:no-db
```

This sources `.env` and runs `scripts/dev-app-servers.sh` (Next.js only).

### Cloudflare preview / deploy

From `artifacts/accessibility-now`:

```bash
pnpm preview   # OpenNext build + local Workers runtime
pnpm deploy    # Deploy to Cloudflare
```

Configure `wrangler.jsonc` (Hyperdrive ID, browser binding) before first deploy.

### Legacy note

The former Express `artifacts/api-server` and Vite SPA have been removed. Server logic lives in `artifacts/accessibility-now/src/server/`; HTTP handlers in `app/api/`.

### Next.js migration runtime (Phase 0+)

The migration to Next.js 16 happens **in-place** inside `artifacts/accessibility-now`. During the migration, both runtimes coexist:

- **Legacy:** Vite SPA on port `5180`
- **Migration scaffold:** Next.js App Router on port `5181`

Use the new scaffold locally with:

```bash
pnpm run dev:next
```

This runs `next dev` only. It does **not** start Docker, Postgres, or the legacy API.

Implementation note: the new App Router scaffold lives in `artifacts/accessibility-now/src/app/` so it can coexist with the legacy `src/pages/` tree while the migration is in progress.

To preview the Cloudflare Worker build locally:

```bash
pnpm --filter @workspace/accessibility-now run preview:cf
```

Useful migration commands:

```bash
pnpm --filter @workspace/accessibility-now run build:next
pnpm --filter @workspace/accessibility-now run build:opennext
pnpm --filter @workspace/accessibility-now run cf:typegen
pnpm --filter @workspace/accessibility-now run d1:migrate:local
```

See [next-migration-rules](next-migration-rules.md) for runtime boundaries and sequencing rules.

### Phase 1 note: local D1-backed leads

The new `POST /api/leads` route in the Next/OpenNext runtime writes to a local D1 database. Before testing that slice on `dev:next` or `preview:cf`, apply the local migration once:

```bash
pnpm --filter @workspace/accessibility-now run d1:migrate:local
```

This uses the D1 binding from `artifacts/accessibility-now/wrangler.jsonc`. The checked-in `database_id` is a local placeholder for development and must be replaced with a real Cloudflare D1 database ID before remote deploys.

When a real Cloudflare D1 database has been provisioned, apply the same migrations remotely with:

```bash
pnpm --filter @workspace/accessibility-now run d1:migrate:remote
```

---

## Changing the HTTP API

1. Edit **`lib/api-spec/openapi.yaml`** (paths, schemas, request bodies).
2. Regenerate consumers:

   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

   This refreshes `lib/api-client-react` and `lib/api-zod` and runs `pnpm -w run typecheck:libs`.

3. Implement the route in **`artifacts/accessibility-now/app/api/`** (or a module under `src/server/` imported from there). Validate inputs with schemas from `@workspace/api-zod` where appropriate.
4. Wire the UI with hooks from **`@workspace/api-client-react`** (generated names follow the OpenAPI operation IDs).

Never hand-edit generated files under `lib/api-client-react/src/generated` or `lib/api-zod/src/generated`; the next codegen run will overwrite them. For historical context on Orval **single-file** mode and name collisions with Drizzle types, see [memory.md](memory.md).

---

## Database changes

1. Edit schema in **`lib/db`** (source of truth for tables and relations).
2. Generate a migration:

   ```bash
   pnpm --filter @workspace/db run generate
   ```

3. Apply locally:

   ```bash
   pnpm --filter @workspace/db run migrate
   ```

Avoid `drizzle-kit push` against shared or production databases; it can drop constraints silently. More detail in [memory.md](memory.md) and [admin.md](admin.md).

---

## Scan engine (audits and tools)

Server-side accessibility scans live mainly in **`artifacts/accessibility-now/src/server/scan.ts`**, with concurrency controlled by **`scan-gate.ts`** (local) or **`ScanGateDO`** Durable Object (Cloudflare).

- **Primary path:** Playwright Chromium + `@axe-core/playwright` (full DOM, scripts, visibility).
- **Fallback:** JSDOM + axe when Playwright cannot run (missing browser, hard failures). Results are less representative for layout and focus.
- **Concurrency:** `SCAN_MAX_CONCURRENT` (default 2) caps simultaneous browser scans process-wide.
- **Batch:** `/api/audit/batch` scans URLs **serially** with one reused browser (SSE progress unchanged).
- **Health:** `GET /api/healthz` returns `scanEngineReady`, `scansInFlight`, and `scansQueued`.
- **Shutdown:** SIGTERM/SIGINT drains in-flight scans (`SHUTDOWN_DRAIN_MS`, default 120s) before exit.

Redirects are resolved in-process with per-hop URL validation (SSRF-related checks). Monitoring, scheduled re-scans, and batch flows import helpers such as `runAccessibilityScan` and `validateScanUrl` from `scan.ts` (see `routes/audit.ts`, `routes/audit-batch.ts`, `lib/scheduler.ts`).

Optional integration smoke test (requires Chromium installed):

```bash
SCAN_INTEGRATION=1 pnpm --filter @workspace/api-server run test
```

---

## Frontend conventions

- **Routing:** Next.js App Router under `artifacts/accessibility-now/app/`; view components in `src/views/`.
- **Styling:** Tailwind v4 with CSS-first config; brand tokens and GSAP patterns are described in [design.md](design.md).
- **Motion:** GSAP hooks must follow the rules in [memory.md](memory.md) (e.g. `useSectionReveal` only at component top level, not inside `.map()`).

---

## Tests and typecheck

```bash
pnpm run typecheck    # libs + artifacts + scripts where configured
pnpm run build        # typecheck then build all packages that define build
```

API package tests (Node’s test runner via `tsx`):

```bash
pnpm --filter @workspace/api-server run test
```

Add new test files next to the code under test or under `src/lib/**` following existing `*.test.ts` naming.

---

## pnpm and supply chain

`pnpm-workspace.yaml` sets **`minimumReleaseAge: 1440`** (minutes). Freshly published packages may fail to install until they age in; that is intentional. Do not disable it without security review. Use the documented allowlist only when necessary.

---

## Documentation index

| Doc | Use when |
| --- | --- |
| [README](../README.md) | Clone, install, env vars, high-level structure |
| [development.md](development.md) | Daily workflows (this file) |
| [design.md](design.md) | UI tokens, components, animation |
| [memory.md](memory.md) | Architecture decisions, gotchas |
| [admin.md](admin.md) | Migrations, SMTP, deployment, DB queries |
| [screenshot-capture.md](screenshot-capture.md) | Playwright screenshots and tooling limits |
| [roadmap.md](roadmap.md) | Feature status and priorities |

---

## AI / editor helpers

[AGENTS.md](../AGENTS.md) describes optional **code-review-graph** MCP workflows for exploration and review. If that MCP is not enabled in your environment, use normal search and navigation; the graph is an accelerator, not a build requirement.
