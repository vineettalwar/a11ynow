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
- **Pages**: Home, Services (Audits/Remediation/Monitoring), EAA, Work, Resources (WCAG Guide/EAA Checklist/Blog), About, Contact, Audit Result, Legal, `/monitor/:token` (score history + trend chart)
- **Monitoring UI**: Audit result page has a "Monitor this site." card (email + frequency) that calls `POST /api/monitor` and redirects to the unique results page

### API Server (`artifacts/api-server`)
- **Type**: Express 5 REST API
- **Preview path**: `/api`
- **Key routes**:
  - `GET /api/healthz` — health check
  - `POST /api/audit` — submit URL for WCAG accessibility scan
  - `GET /api/audit/:auditId` — retrieve cached audit result
  - `GET /api/audit/:auditId/pdf` — download PDF report
  - `POST /api/leads` — capture lead contact
  - `POST /api/monitor` — register URL for periodic accessibility re-scanning
  - `GET /api/monitor/:token` — retrieve monitoring history (scans, score, violations)
- **Audit engine**: Playwright + axe-core (Chromium), fallback to JSDOM + axe-core; shared via `src/lib/scan.ts`
- **Scheduler**: `node-cron` hourly job in `src/lib/scheduler.ts` — re-scans due URLs and emails summaries
- **Email**: `nodemailer` via `src/lib/email.ts` — sends confirmation + scan summaries; gracefully skips if SMTP env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`) are not set
- **DB schema**: `audits`, `leads`, `monitored_urls`, `monitoring_scans` tables (Drizzle ORM + PostgreSQL)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Notes

- Orval zod config uses `mode: "single"` (not split) to avoid TypeScript naming conflicts between Zod schemas and TS interfaces
- `lib/api-zod/src/index.ts` exports only from `./generated/api` (single file)
- Audit results and monitoring data are persisted in PostgreSQL via Drizzle ORM
- Monitoring tokens are 48-char hex strings (24 random bytes); validated as such on the GET endpoint
- Email sending is no-op (logged only) when SMTP env vars are absent — configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` for real delivery
- Score trend chart on `/monitor/:token` uses recharts `LineChart` with orange (#FF4D1C) accent line

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
