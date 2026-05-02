# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### accessibility.now (`artifacts/accessibility-now`)
- **Type**: react-vite web app
- **Preview path**: `/`
- **Purpose**: B2B digital accessibility agency website under the sometech.work brand
- **Brand**: #F7F7F5 bg, #FF4D1C orange accent, Inter Tight + JetBrains Mono fonts
- **Lead gen**: Homepage URL audit tool → `/audit-result` with real compliance scan
- **Pages**: Home, Services (Audits/Remediation/Monitoring), EAA, Work, Resources (WCAG Guide/EAA Checklist/Blog), About, Contact, Audit Result, Legal

### API Server (`artifacts/api-server`)
- **Type**: Express 5 REST API
- **Preview path**: `/api`
- **Key routes**:
  - `GET /api/healthz` — health check
  - `POST /api/audit` — submit URL for WCAG accessibility scan (returns score, violations, WCAG criteria)
  - `GET /api/audit/:auditId` — retrieve cached audit result
- **Audit engine**: Fetches target URL, parses HTML with cheerio, checks 11 WCAG 2.1 criteria (missing alt, unlabelled inputs, missing lang, empty buttons, missing title, autocomplete, skip links, duplicate IDs, empty links, table headers, pixel fonts)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Notes

- Orval zod config uses `mode: "single"` (not split) to avoid TypeScript naming conflicts between Zod schemas and TS interfaces
- `lib/api-zod/src/index.ts` exports only from `./generated/api` (single file)
- Audit results are cached in-memory on the API server (no DB persistence — by design for first build)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
