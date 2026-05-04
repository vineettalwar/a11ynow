# Project Memory: accessibility.now

This is a living document. Add decisions here as they are made so any future developer or agent can onboard without reading every commit.

Last updated: May 2026

---

## Architecture overview

```
pnpm monorepo
├── artifacts/
│   ├── accessibility-now/    React + Vite frontend (port $PORT / preview /)
│   └── api-server/           Express 5 API (port 8080 / preview /api)
├── lib/
│   ├── api-spec/             OpenAPI YAML spec + Orval codegen config
│   ├── api-client-react/     Generated TanStack Query hooks (do not hand-edit)
│   ├── api-zod/              Generated Zod schemas (do not hand-edit)
│   └── db/                   Drizzle ORM schema, migrations, db client
└── scripts/
    └── post-merge.sh         Runs after every task merge
```

---

## Key decisions

### Why Drizzle ORM?
Lightweight, type-safe, works natively with `pg` (no connection-pool overhead for a low-traffic site). The `drizzle-zod` integration auto-generates insert/select schemas from table definitions: one source of truth for types and validation.

### Why `drizzle-kit push` initially?
During early development, push is faster than generating and running migrations. Now that the schema is stable, versioned migration files live in `lib/db/migrations/` and `post-merge.sh` calls `drizzle-kit migrate` automatically. **Do not use `push` in production**: it can silently drop constraints.

### Orval `mode: "single"`
Orval normally generates one TypeScript file per tag (split mode). With split mode, the Zod schema file exports types named `Audit`, `Lead`, etc.: identical to the TypeScript interface names Drizzle generates, causing `TS2300 Duplicate identifier` errors across the monorepo.

Switching to `mode: "single"` puts all generated code in one file (`api.ts`), which avoids the collision. `lib/api-zod/src/index.ts` re-exports only from `./generated/api`.

**Do not change back to split mode** without auditing all generated names against the Drizzle schema type names.

### Why a separate `lib/api-zod` and `lib/api-client-react`?
The API spec is the single source of truth. Keeping generated code in dedicated lib packages means:
- The frontend imports `@workspace/api-client-react` (hooks) without touching codegen internals
- The API server imports `@workspace/api-zod` for request validation without React dependencies
- `pnpm --filter @workspace/api-spec run codegen` regenerates both in one command

### Monitoring token format
Tokens are 48-character lowercase hex strings (24 random bytes via `crypto.randomBytes(24).toString("hex")`).
The `GET /api/monitor/:token` endpoint validates format with the regex `/^[0-9a-f]{48}$/` before hitting the DB, returning 400 for malformed tokens. This prevents SQL injection and invalid DB lookups.

### Email no-op fallback
`lib/email.ts` checks for all five SMTP env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`) at call time. If any are absent, it logs `[email no-op]` and returns without throwing. This means the app is fully functional in development without SMTP configuration. Real delivery requires all five vars.

### Playwright scan stack
The audit engine in `artifacts/api-server/src/lib/scan.ts` uses two strategies:
1. **Playwright + Chromium** (primary): full browser render, catches JS-rendered content, most accurate
2. **JSDOM + axe-core** (fallback): fires if Playwright fails (e.g., browser binary absent, timeout). Less accurate: misses visibility and focus issues.

Playwright binaries are installed in `post-merge.sh` via `playwright install chromium`. The binary path is within the pnpm store and survives normal process restarts.

### pnpm monorepo package boundary rationale
- `lib/*` packages have no dev-server or build artefact: they are TypeScript source imported by other packages via `exports` fields
- `artifacts/*` packages each have their own workflow (dev server) and are independently deployable
- Shared types live in the package that owns the data (`@workspace/db` for DB types, `@workspace/api-zod` for API contract types)
- Never import `@workspace/db` directly from the frontend: go through the API

### Score trend chart
Uses Recharts `LineChart` on `/monitor/:token`. The chart is conditionally rendered only when `scans.length >= 2` to avoid a single-point line. The orange accent line colour is `#FF4D1C` passed as a `stroke` prop. Tooltip uses a custom formatter that shows the date as `"DD MMM YYYY"`.

### GSAP hook rule
`useSectionReveal` calls `useRef` and `useEffect` internally: it **must** be called at the top level of a React component. Never call it inside `.map()`. If you need per-item animations in a list, extract a named sub-component (e.g., `PourSection` in `wcag-guide.tsx`) and call the hook inside that.

### EAA Checklist localStorage key
`"eaa-checklist-v2"`: the `v2` suffix was added when the checklist was rewritten with 5 sections (the old key used a different data shape). If the checklist is restructured again, increment to `v3` to avoid stale data bugs.

### Media and audio asset policy
Static assets served at runtime belong in `artifacts/accessibility-now/public/`. The `attached_assets/` directory is for optional local working references (screenshots, branding notes) and is **not** served by the app.

For audio or video files: any file over **1 MB** must be hosted on a remote CDN (e.g. Cloudflare R2, AWS S3, Cloudinary) and referenced via an HTTPS URL: do not commit binary media files over 1 MB to the repo. Files under 1 MB may be committed to `public/` if genuinely needed at runtime.

### CSS variable / Tailwind interaction
The site uses Tailwind v4 (CSS-first config). Custom brand colours are NOT in a `tailwind.config.js`: they are used as arbitrary values: `text-[#FF4D1C]`, `bg-[#F7F7F5]`. If a colour is used more than ~5 times, add it to the Tailwind theme in `tailwind.css` using `@theme`.

---

## Gotchas

- **`pnpm --filter db push`** in `post-merge.sh` uses the short package name form; the full name is `@workspace/db`. Both work.
- **drizzle.config.ts uses `__dirname`** which requires CJS-style path resolution. The db package uses `"type": "module"` but drizzle-kit handles this correctly when run via the `push`/`generate`/`migrate` scripts.
- **`zod/v4` import**: the project uses Zod v4 (`import { z } from "zod/v4"`) not `"zod"`. Using the wrong import path causes type mismatches with `drizzle-zod`.
- **Orval-generated files must not be hand-edited.** Run `pnpm --filter @workspace/api-spec run codegen` after any change to `lib/api-spec/openapi.yaml`. Edits to generated files are wiped on the next codegen run.
- **Port collisions**: the API server reads `process.env.PORT` (defaults 8080). The Vite dev server also reads `PORT` (defaults 5173). If both workflows share one `PORT` env var, set distinct values per terminal (e.g. API `8080`, frontend `5173`).
