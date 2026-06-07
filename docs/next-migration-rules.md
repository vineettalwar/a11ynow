# Next migration rules

This document defines the repo rules for the Next.js 16 + Cloudflare migration.

## Scope

Use these rules for all migration work that touches:

- `artifacts/accessibility-now/src/app/**`
- new Cloudflare route handlers
- new D1 / Queue / R2 / KV adapters
- shared domain logic extracted from the legacy API

## Runtime strategy

During the migration, the repo intentionally supports two runtimes in the same package:

- **Legacy runtime:** Vite SPA + Cloudflare Pages config + external API assumptions
- **Migration runtime:** Next.js 16 App Router + OpenNext + Cloudflare Worker preview

Rules:

- do not remove the Vite runtime until cutover phase
- do not repurpose `wrangler.toml` for the new worker
- use `wrangler.jsonc` for the OpenNext runtime
- keep the legacy `/api` proxy path intact until the corresponding route handler exists

## Folder responsibilities

Because the repo already has a legacy `src/pages/` tree for Wouter components, the App Router scaffold lives under `src/app/` during the migration. This keeps Next's `app` and `pages` directories under the same `src/` root without moving the legacy page components yet.

### `artifacts/accessibility-now/src/app/`

Owns:

- App Router pages
- layouts
- loading / error / not-found boundaries
- route handlers in `app/api/**`

Does not own:

- business rules
- persistence rules
- queue orchestration logic

### Shared domain / application code

Use extracted modules for:

- scan rules
- job orchestration
- lead handling
- monitor scheduling
- compliance mapping

These modules must remain framework-agnostic.

## Architectural rules

1. Route handlers stay thin.
2. Domain code imports no `next/*`, `react`, `wrangler`, or storage-specific APIs.
3. Use cases depend on ports, not adapters.
4. Adapters translate to Cloudflare primitives such as D1, R2, KV, and Queues.
5. React components do not contain business rules or persistence logic.

## Migration sequencing rules

1. Foundation first.
2. Lead capture and pricing form next.
3. SEO-critical routes before the scan engine rewrite.
4. Async jobs before batch parity.
5. Monitoring after single-audit async flow is proven.
6. Delete legacy runtime pieces only at the final cutover.

## Testing rules

For migration PRs:

- `pnpm run typecheck` must pass
- changed package builds must pass
- add targeted tests for new domain logic and route handlers
- prefer terminal-driven verification for foundation slices
- use staging runtime verification before deleting legacy code

## Documentation rules

Each migration PR should update:

- this file when repo-level migration rules change
- `docs/prd-next-cloudflare-migration.md` when the plan materially changes
- `docs/development.md` when commands or local workflows change
- deployment docs when runtime steps change
