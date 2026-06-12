# Cloudflare deployment

accessibility.now runs as a **single Cloudflare Worker** via OpenNext (`@opennextjs/cloudflare`).

| Component | Platform | Artifact |
|-----------|----------|----------|
| **App (Next.js + API)** | Cloudflare Workers | `artifacts/accessibility-now` (OpenNext build) |
| **Scan worker (optional)** | Cloudflare Workers Browser Rendering | `artifacts/scan-worker` |

Local development uses Postgres + Next.js on port 3000. Production uses D1, R2, KV, Queues, and Cron Triggers configured in `wrangler.jsonc`.

## 1. Provision Cloudflare resources

Run once per account (replace placeholder IDs in `wrangler.jsonc`):

```bash
cd artifacts/accessibility-now
npx wrangler login

# D1 database (rename binding to accessibility-now in wrangler.jsonc)
npx wrangler d1 create accessibility-now

# KV namespace for job cache
npx wrangler kv namespace create accessibility-now-job-cache

# R2 bucket for scan artifacts
npx wrangler r2 bucket create accessibility-now-artifacts

# Queue for async scan jobs
npx wrangler queues create accessibility-now-scan-jobs
```

Copy the returned IDs into `wrangler.jsonc`:

- `d1_databases[0].database_id`
- `kv_namespaces[0].id`
- R2 bucket name (already `accessibility-now-artifacts`)
- Queue name (already `accessibility-now-scan-jobs`)

Apply D1 migrations:

```bash
pnpm run d1:migrate:local    # local wrangler dev
pnpm run d1:migrate:remote   # production D1
```

## 2. Build and deploy

```bash
cd artifacts/accessibility-now
pnpm install
pnpm run deploy
```

Or from the repo root:

```bash
pnpm --filter @workspace/accessibility-now run deploy
```

Staging deploy uses the same command with a staging `wrangler.jsonc` env block or separate Worker name.

### Preview locally

```bash
pnpm run d1:migrate:local
pnpm run preview:cf
```

## 3. Required secrets and vars

Set via `wrangler secret put` or the Cloudflare dashboard:

| Name | Required | Purpose |
|------|----------|---------|
| `CRON_SECRET` | Yes (prod) | Bearer token for `/api/cron/monitoring` |
| `APP_BASE_URL` | Yes | Public site URL for monitor emails and PDF links |
| `RESEND_API_KEY` | No* | Resend HTTP API for monitoring emails (recommended on Workers) |
| `FROM_EMAIL` | No* | Sender address (required with Resend or SMTP) |
| `SMTP_HOST` | No* | SMTP for monitoring emails (local / traditional hosts) |
| `SMTP_PORT` | No* | SMTP port |
| `SMTP_USER` | No* | SMTP username |
| `SMTP_PASS` | No* | SMTP password |

*Set `RESEND_API_KEY` + `FROM_EMAIL` on Cloudflare, or all five SMTP vars together for nodemailer delivery.

`wrangler.jsonc` already sets `APP_BASE_URL` as a var; override per environment.

## 4. Smoke test checklist

After deploy, verify:

```bash
# Health (expect scanEngineReady: true when Browser binding works)
curl https://<your-domain>/api/healthz

# Lead capture
curl -X POST https://<your-domain>/api/leads \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","source":"pricing","company":"Acme","service":"audit","message":"Smoke test"}'

# Cron (with secret)
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/monitoring
```

Manual checks:

- `POST /api/audit` creates async job, poll returns result with R2-backed violations
- Cron trigger fires hourly monitoring scans
- Queue consumer in `worker.ts` processes scan jobs

## 5. Optional scan worker

Offload browser scans to a dedicated worker:

```bash
cd artifacts/scan-worker
pnpm install
npx wrangler login
pnpm deploy
npx wrangler secret put SCAN_AUTH_TOKEN
```

## 6. DNS

| Record | Target |
|--------|--------|
| `accessibility.now` | Cloudflare Worker (custom domain on Worker) |

No separate `api.accessibility.now` host — API routes are served from the same Worker.

## 7. Data migration (Postgres → D1)

For cutover from an existing Postgres deployment:

```bash
pnpm tsx scripts/migrate-postgres-to-d1.ts --dry-run
pnpm tsx scripts/migrate-postgres-to-d1.ts
```

See script header for required env vars (`DATABASE_URL`, `CLOUDFLARE_ACCOUNT_ID`, D1 database name).
