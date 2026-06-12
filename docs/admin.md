# Admin & Ops Runbook: accessibility.now

This document is for developers and operators managing the live application.

---

## Connecting to the database

### Development

`DATABASE_URL` comes from your local `.env` (see `.env.example`). Connect with:

```bash
psql "$DATABASE_URL"
```

### Production

Set `DATABASE_URL` in your host’s secret manager or process environment (never commit it). Connect with:

```bash
psql "$DATABASE_URL"
```

---

## Useful SQL queries

### Check the most recent audits
```sql
SELECT audit_id, url, score, level, total_violations, scanned_at
FROM audits
ORDER BY scanned_at DESC
LIMIT 20;
```

### Check monitoring registrations
```sql
SELECT id, url, email, frequency, is_active, next_scan_at, token
FROM monitored_urls
ORDER BY created_at DESC
LIMIT 20;
```

### Check recent monitoring scans for a URL
```sql
SELECT ms.id, ms.score, ms.level, ms.total_violations, ms.scanned_at
FROM monitoring_scans ms
JOIN monitored_urls mu ON mu.id = ms.monitored_url_id
WHERE mu.url = 'https://example.com'
ORDER BY ms.scanned_at DESC
LIMIT 10;
```

### Find all leads
```sql
SELECT lead_id, name, email, audit_id, created_at
FROM leads
ORDER BY created_at DESC
LIMIT 50;
```

### Count audits per day (last 7 days)
```sql
SELECT date_trunc('day', scanned_at) AS day, count(*) AS scans
FROM audits
WHERE scanned_at > now() - interval '7 days'
GROUP BY 1
ORDER BY 1 DESC;
```

### Deactivate a monitoring registration
```sql
UPDATE monitored_urls
SET is_active = false
WHERE token = '<48-char-hex-token>';
```

---

## Triggering a manual re-scan

The scheduler runs hourly via `node-cron` inside the API server process. To force a scan for a specific monitored URL without waiting:

```bash
# Hit the monitoring endpoint to see current state
curl "https://your-api-host.example/api/monitor/<token>"

# To force re-scan: temporarily set next_scan_at to the past
psql "$DATABASE_URL" -c "
  UPDATE monitored_urls
  SET next_scan_at = now() - interval '1 minute'
  WHERE token = '<token>';
"
# The scheduler will pick it up within the next minute.
```

---

## Running database migrations

### Development and production

```bash
pnpm --filter @workspace/db run migrate
```

This runs `drizzle-kit migrate` against the `DATABASE_URL` in your environment.

### Adding a new migration
1. Edit the schema in `lib/db/src/schema/`
2. Run `pnpm --filter @workspace/db run generate` to produce a new SQL file in `lib/db/migrations/`
3. Review the generated SQL: check for destructive changes (DROP, RENAME)
4. Run `pnpm --filter @workspace/db run migrate` to apply it
5. Commit the new migration file alongside the schema change

### Rolling back a bad migration
Drizzle does not have a built-in rollback command. Options:
1. **Restore from backup**: use snapshots or PITR from your database provider
2. **Manual SQL**: write a reverse migration SQL file in `lib/db/migrations/` prefixed with the next sequence number
3. **Point-in-time restore**: via your database provider's console

**Never delete a migration file that has already been applied to production.**

---

## SMTP configuration for real email delivery

By default the app runs in no-op mode (emails logged, not sent). To enable real delivery:

1. Obtain SMTP credentials from your email provider (e.g. AWS SES, Postmark, SendGrid)
2. Set these in `.env` locally or in your production secret store, then restart the API process:
   - `SMTP_HOST`: e.g. `email-smtp.eu-west-1.amazonaws.com`
   - `SMTP_PORT`: typically `587` (STARTTLS) or `465` (SSL)
   - `SMTP_USER`: SMTP username / access key
   - `SMTP_PASS`: SMTP password / secret key
   - `FROM_EMAIL`: e.g. `noreply@accessibility.now`
3. Trigger a monitoring scan; check the API server logs for `[email sent]` vs `[email no-op]`

---

## Deploying to production

**Cloudflare (recommended):** see [cloudflare-deployment.md](cloudflare-deployment.md). Summary:

1. Run `bash scripts/provision-cloudflare.sh` and apply D1 migrations (`pnpm --filter @workspace/accessibility-now run d1:migrate:remote`).
2. Set secrets: `CRON_SECRET`, `RESEND_API_KEY` (or SMTP vars), optional `SCAN_WORKER_*`.
3. Deploy: `pnpm --filter @workspace/accessibility-now run deploy` (staging: `deploy:cf:staging`).
4. Smoke test: `pnpm run smoke-test https://accessibility.now`

**Local / Postgres dev:** `pnpm dev` uses Docker Postgres. Browser scans need Playwright Chromium:

```bash
pnpm --filter @workspace/accessibility-now exec playwright install chromium
```

After deploy, confirm health:

```bash
curl -s https://accessibility.now/api/healthz
# Expect: {"status":"ok","scanEngineReady":true,...}
```

During rolling deploys, `/api/healthz` may briefly return `"status":"draining"` while SIGTERM handlers finish in-flight scans. Load balancers should treat `scanEngineReady: false` as degraded (static HTML fallback only).

Optional scan tuning env vars (API server):

| Variable | Default | Purpose |
| --- | --- | --- |
| `SCAN_MAX_CONCURRENT` | `2` (max `4`) | Cap simultaneous Playwright scans process-wide |
| `SCAN_TIMEOUT_MS` | `45000` | Base Playwright budget before multi-viewport / strict extras |
| `SCAN_SCROLL_MAX_MS` | `12000` | Wall-clock cap for lazy-load scroll pass |
| `SHUTDOWN_DRAIN_MS` | `120000` | Max wait for in-flight scans on SIGTERM/SIGINT |

---

## Scan engine diagnostics

### static_fallback rate (last 24 hours)

```sql
SELECT scan_engine, count(*) AS scans
FROM audits
WHERE scanned_at > now() - interval '24 hours'
GROUP BY scan_engine
ORDER BY scans DESC;
```

A high `static_fallback` share usually means Chromium is missing, timed out, or blocked — check API logs for `scan_complete` events and `Chromium unavailable` at startup.

### Recent scans by engine

```sql
SELECT audit_id, url, scan_engine, score, scanned_at
FROM audits
ORDER BY scanned_at DESC
LIMIT 20;
```

---

## Rotating secrets

### GitHub token (`GITHUB_TOKEN`)
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Create a new token with `Contents: Read and write` permission on the target repo
3. Update `GITHUB_TOKEN` in `.env` or your production secrets
4. The next `post-merge.sh` run will use the new token automatically

### SMTP credentials
1. Revoke old credentials in your email provider console
2. Issue new credentials
3. Update `SMTP_USER` and `SMTP_PASS` in `.env` or your production secrets
4. Restart the API server process

---

## Interpreting monitoring logs

API server stdout includes structured log lines:

```
[scheduler] tick: checking 12 monitored URLs
[scheduler] scanning https://example.com (id: abc123)
[scheduler] scan complete: score: 84, violations: 3
[email sent] to user@example.com: scan summary for https://example.com
[scheduler] tick complete: 2 scans run, 10 skipped
```

If email is not configured:
```
[email no-op] would send to user@example.com (SMTP not configured)
```

If Playwright fails and the JSDOM fallback fires:
```
Playwright audit failed, falling back to fetch-based scan
Scan complete { event: "scan_complete", scanEngine: "static_fallback", ... }
```

Structured `scan_complete` log fields include `urlHost`, `scanEngine`, `durationMs`, `profile`, `multiViewport`, and optional `failurePhase` / `errorClass` when the browser path failed.

JSDOM fallback scores are less accurate (misses JS-rendered content, focus issues, colour contrast). If fallback fires repeatedly, check that Playwright Chromium is installed:
```bash
pnpm --filter @workspace/api-server exec playwright install chromium
```
