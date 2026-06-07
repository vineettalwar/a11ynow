# PRD: Next.js 16 + Cloudflare Native Migration

Status: Draft  
Owner: Engineering  
Last updated: 2026-06-06

## 1. Summary

Migrate `accessibility.now` from the current split architecture:

- Vite + React SPA on Cloudflare Pages
- Express API on a separate Node host
- PostgreSQL for persistence
- optional Cloudflare scan worker

to a single Cloudflare-native application built around:

- Next.js 16 App Router
- Cloudflare Workers runtime via OpenNext
- D1 for relational state
- R2 for large artifacts
- Queues for async scan and reporting jobs
- Cron Triggers for monitoring schedules
- KV for fast status and short-lived cache data
- optional Durable Objects for coordination where polling alone is not enough

The migration is not a framework swap only. It is a runtime, deployment, and execution-model redesign.

## 2. Why this change

### Current problems

1. SEO-critical pages are rendered as a client-side SPA, and route metadata is applied in the browser after navigation.
2. The frontend depends on an external `API_ORIGIN`, so the product is not actually a single Cloudflare deployment.
3. Core audit flows are synchronous and tied to request lifetime.
4. Monitoring depends on an in-process cron scheduler inside the API server.
5. Audit rows currently store heavy JSON and inline base64 screenshots, which is the wrong long-term shape for D1.
6. The current codebase mixes business logic, HTTP concerns, infrastructure, and runtime assumptions too tightly in the API layer.

### Business outcome

This migration should produce:

- better SEO for blog, resources, services, and pricing pages
- a simpler deployment story on Cloudflare
- cleaner architecture with stronger SRP boundaries
- a durable async job model for audits and monitoring
- a foundation for future content, lead generation, and product expansion

## 3. Goals

### Product goals

- Run the public web app and API from one Cloudflare-hosted application.
- Preserve existing public URLs wherever possible.
- Improve crawlability and metadata quality for all SEO-relevant pages.
- Keep existing lead capture, audit, and monitoring journeys working through the migration.

### Engineering goals

- Port from Wouter/Vite SPA routing to Next.js 16 App Router.
- Replace Express request handlers with thin Next route handlers.
- Move business logic into framework-agnostic modules.
- Move long-running or browser-heavy work off the request path into queues.
- Replace Postgres-first assumptions with a D1-first storage model.
- Keep documentation, linting, type safety, and tests part of the migration, not afterthoughts.

## 4. Non-goals

- Rebuild the product UX from scratch.
- Change core pricing or service packaging.
- Introduce a CMS in phase 1.
- Keep SSE as the long-term transport for batch scans.
- Preserve the current synchronous scan model in production.
- Promise 100% feature parity on day one for heavy secondary features like PDF export or inline element screenshots.

## 5. Current state

## Frontend

- React 19 + Vite 7
- Wouter client-side routing
- Tailwind v4
- TanStack Query via generated API hooks
- SEO metadata injected client-side

## Backend

- Express 5 on a separate Node host
- Playwright-based scan engine
- node-cron monitoring scheduler
- PDFKit report generation
- PostgreSQL via Drizzle and `pg`

## Deployment

- Cloudflare Pages serves the SPA
- Pages Function proxies `/api/*` to `API_ORIGIN`
- API host runs separately
- optional scan worker exists for partial offload

## Key architectural pain points

- request/response lifetime is coupled to scan lifetime
- process-local scheduler and queue behavior
- DB rows contain large JSON and base64 payloads
- client-only head metadata limits SEO quality

## 6. Proposed target architecture

## 6.1 High-level design

One repository, one product deployment target, Cloudflare-native execution:

- Next.js 16 App Router for the web app
- Next route handlers for fast HTTP API endpoints
- queue consumers for scan and reporting jobs
- D1 for relational application state
- R2 for screenshots, PDFs, and large scan artifacts
- KV for job status, short-lived cache, and rate limiting
- Cron Triggers for monitoring schedules

## 6.2 Runtime split

### Request path

Use Next route handlers for:

- lead capture
- monitor registration
- monitor dashboard reads
- audit result reads
- job creation
- job status reads
- health endpoints

### Async path

Use queues for:

- single audit jobs
- batch audit fan-out jobs
- monitoring jobs
- email/report jobs
- optional PDF generation jobs

### Coordination

Use Durable Objects only if needed for:

- concurrency coordination
- stream or session fan-out
- complex multi-step orchestration

Default to simpler queue + DB + polling flows first.

## 6.3 App structure principles

The codebase should follow clean ports-and-adapters boundaries:

- `domain/` or `lib/domain-*`: pure business rules
- `application/` or `use-cases/`: orchestrates workflows
- `adapters/`: D1, R2, Queue, Email, Browser execution adapters
- `app/`: Next App Router pages and route handlers

Rules:

- domain code imports no framework code
- route handlers stay thin
- repositories hide storage details
- mappers translate between storage shape and API shape
- React components do not own business rules

## 7. Data and storage model

## 7.1 D1 as source of truth for relational state

Use D1 for:

- `leads`
- `audits` summary state
- `scan_jobs`
- `batch_jobs`
- `monitored_urls`
- `monitoring_scans`

Use SQLite-friendly column shapes:

- text and integer fields
- JSON serialized as text where needed
- timestamps stored consistently as ISO strings or epoch values

## 7.2 R2 for large artifacts

Move all heavy binary or large JSON payloads out of D1:

- page screenshots
- element screenshots if retained
- PDFs
- optional raw scan detail payloads

D1 stores references, not inline base64 blobs.

## 7.3 KV for short-lived operational data

Use KV for:

- job status cache
- rate limits
- short-lived screenshot and discovery caches
- ephemeral progress snapshots

## 8. API redesign

## 8.1 Keep contract-first development

Continue using the OpenAPI spec as the source of truth.

Workflow:

1. define or update route contract
2. generate Zod and client code
3. implement route handler against generated contract
4. test behavior and shape

## 8.2 Replace synchronous audits with jobs

### New model

- `POST /api/audit` returns `202 Accepted` with `jobId`
- `GET /api/audit/jobs/:jobId` returns status and progress
- `GET /api/audit/:auditId` returns final persisted result

### Batch model

- `POST /api/audit/batch` returns `batchJobId`
- `GET /api/audit/batch/jobs/:batchJobId` returns overall status and per-page progress

### Monitoring model

- `POST /api/monitor` stays synchronous for registration
- cron finds due monitors and enqueues work
- queue consumers run scans and persist results

## 8.3 Intentional changes

These are deliberate product and engineering decisions:

- remove long-lived SSE as the core execution model
- prefer polling over fragile streaming for multi-minute jobs
- keep synchronous request paths for only small, predictable operations

## 9. Migration workstreams

## Workstream A: Next.js platform foundation

Deliverables:

- Next.js 16 app scaffold
- OpenNext Cloudflare runtime configuration
- root layout, providers, loading and error boundaries
- local dev story for Next + API replacement work

## Workstream B: Routing and SEO migration

Deliverables:

- App Router route map covering current public URLs
- metadata generation on the server
- sitemap and robots in Next
- redirect strategy for aliases and legacy routes

## Workstream C: Clean architecture extraction

Deliverables:

- pure scan and compliance modules
- use-case layer for audit, monitor, and lead flows
- storage and infrastructure ports
- adapter implementations for Cloudflare services

## Workstream D: D1 + storage redesign

Deliverables:

- D1 schema
- migration scripts
- artifact storage abstraction backed by R2
- repository layer

## Workstream E: Async jobs and orchestration

Deliverables:

- queue schemas and job tables
- single audit async flow
- batch audit async flow
- monitoring async flow
- retry and failure model

## Workstream F: Frontend feature migration

Deliverables:

- marketing pages
- resources/blog pages
- pricing/contact forms
- audit result pages
- A11y Fix journey
- tools
- monitor dashboard

## Workstream G: Reporting and notifications

Deliverables:

- email provider abstraction
- PDF strategy
- post-scan notification pipeline

## 10. Delivery phases

## Phase 0: Architecture and repo foundation

- add Next.js runtime scaffold
- define target boundaries and folder layout
- document migration rules
- keep current production architecture intact

## Phase 1: Lead-gen first

- migrate contact flow
- add pricing inline contact flow
- validate D1 write path
- prove route handler pattern

Reason: smallest risk, highest business value, strong vertical slice.

## Phase 2: SEO content migration

- migrate marketing pages
- migrate resources/blog pages
- ship server-side metadata, sitemap, robots

Reason: immediate SEO return without blocking scan engine redesign.

## Phase 3: Single audit async flow

- create job endpoint
- queue processing
- result polling
- result persistence

## Phase 4: Batch and A11y Fix async flow

- replace SSE with batch jobs
- fan out scan work
- aggregate results
- migrate UI to polling

## Phase 5: Monitoring and notifications

- cron trigger
- due-scan enqueuing
- monitoring results
- notification delivery

## Phase 6: Tools and advanced features

- focus order
- screen reader preview
- screenshot tooling
- cache strategy
- PDF finalization

## Phase 7: Cutover and cleanup

- switch production to the new stack
- remove Vite/Wouter/Pages proxy assumptions
- update deployment docs
- decommission legacy Express path

## 11. PR plan

## PR 1: Platform skeleton

- Next.js 16 scaffold
- OpenNext config
- root app shell
- docs update

## PR 2: Contracts and storage foundation

- OpenAPI expansion
- D1 schema draft
- repository interfaces
- artifact storage abstractions

## PR 3: Lead capture slice

- `/contact`
- pricing form
- `POST /api/leads`
- D1 persistence

## PR 4: SEO and public content slice

- marketing pages
- resources/blog pages
- metadata and sitemap

## PR 5: Single audit async slice

- job creation
- queue consumer
- audit result polling

## PR 6: Batch async slice

- batch jobs
- aggregation
- A11y Fix migration

## PR 7: Monitoring slice

- cron trigger
- queue jobs
- monitoring dashboard path

## PR 8: Tools and reporting

- browser-heavy tools
- caching
- PDF/reporting strategy

## PR 9: Cleanup and decommissioning

- remove legacy deployment assumptions
- delete obsolete runtime pieces
- documentation refresh

## 12. Quality bar

## 12.1 Engineering standards

- strict SRP at module level
- domain logic isolated from framework code
- clear interfaces between application and infrastructure
- explicit types at boundaries
- no giant god files for new work
- human-readable documentation and commit history

## 12.2 Testing standards

For non-trivial migration PRs:

- workspace typecheck must pass
- build must pass
- changed units or use cases must have targeted tests
- route handlers should have contract-focused integration tests
- queue and storage adapters should have runtime-focused tests

Default test shape:

- domain tests with in-memory adapters
- route handler tests for contract and status codes
- queue consumer tests for async flows
- staging verification for Cloudflare runtime behavior

## 12.3 Documentation standards

Each major PR must update:

- PRD or ADR when architecture changes
- deployment docs if runtime or config changes
- API docs when contracts change
- runbooks when operational behavior changes

## 13. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Browser-heavy work exceeds comfortable free-tier limits | scan cost or throttling | keep request path thin, use queues, limit concurrency, move artifacts out of D1 |
| D1 row growth from audit payloads | performance and write pressure | store summaries in D1, artifacts in R2 |
| Scope creep from trying to port Express 1:1 | delays and poor code quality | redesign around Cloudflare primitives, not handler cloning |
| SEO regression during route migration | traffic loss | preserve URLs, verify server-rendered metadata before cutover |
| PDF generation is not Worker-friendly | feature delay | treat PDF as a later phase or async side-flow |
| Job orchestration becomes too complex | maintenance cost | start with queue + DB + polling, introduce Durable Objects only if justified |

## 14. Acceptance criteria

### Product

- public marketing and resource pages render with correct server-side metadata
- contact and pricing lead capture work on the new stack
- single audit works via async job flow
- batch audit works via async batch flow
- monitoring runs via cron + queue, not in-process cron

### Architecture

- no external `API_ORIGIN` dependency for the main product flow
- route handlers are thin and use-case driven
- domain logic is framework-agnostic
- large artifacts are not stored inline in D1

### Quality

- typecheck and build pass
- targeted tests exist for migrated flows
- docs reflect the new architecture
- production deploy steps are documented and reproducible

## 15. Open questions

1. Should PDF generation remain in scope for the first migration wave or be deferred?
2. Do we keep element-level screenshots in the product, and if yes, where do we store and serve them from?
3. Is polling sufficient for batch progress UX, or do we want a later Durable Object stream layer?
4. Do we migrate directly in `artifacts/accessibility-now`, or use a temporary parallel Next app during transition?
5. Do we want D1 only, or a temporary fallback path while data is migrated?

Current implementation note: Phase 0 uses an **in-place** scaffold inside `artifacts/accessibility-now/src/app/` while the legacy `src/pages/` and Vite runtime stay intact.

## 16. Immediate next step

Start with the smallest production-meaningful slice:

1. create the Next.js 16 foundation
2. implement D1-backed lead capture
3. add the pricing page contact form
4. validate the Cloudflare-native deployment path

That slice proves the architecture with the least runtime risk and the highest business leverage.
