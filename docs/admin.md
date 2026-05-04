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

Deployment is host-specific. In general:

1. Build the frontend (`pnpm --filter @workspace/accessibility-now run build`) and API (`pnpm --filter @workspace/api-server run build` if applicable).
2. Run `pnpm --filter @workspace/db run migrate` against production `DATABASE_URL` before or as part of the release.
3. Ensure all required environment variables from `.env.example` are set in production.
4. Optionally run `scripts/post-merge.sh` after merges for install, migrate, and GitHub sync (see script for behavior).

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
[scan] Playwright failed: <error message>: falling back to JSDOM
[scan] JSDOM fallback complete: score: 71
```

JSDOM fallback scores are less accurate (misses JS-rendered content, focus issues, colour contrast). If fallback fires repeatedly, check that Playwright Chromium is installed:
```bash
pnpm --filter @workspace/api-server exec playwright install chromium
```
