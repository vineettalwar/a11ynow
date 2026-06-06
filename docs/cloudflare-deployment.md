# Cloudflare deployment (scan worker)

The accessibility scanner can run browser automation on **Cloudflare Browser Rendering** instead of in-process Playwright on the API host.

## 1. Deploy the scan worker

```bash
cd artifacts/scan-worker
pnpm install
npx wrangler login
pnpm deploy
```

Set secrets (optional but recommended):

```bash
npx wrangler secret put SCAN_AUTH_TOKEN
```

## 2. Configure the API server

Add to `.env`:

```env
SCAN_WORKER_URL=https://accessibility-now-scan.<your-subdomain>.workers.dev
SCAN_WORKER_TOKEN=<same token as worker secret>
```

When `SCAN_WORKER_URL` is set, `POST /api/audit` delegates to the worker. Local Playwright remains the fallback when unset.

## 3. BITV 2.0 / BFSG reporting

All scans (local or Cloudflare) now include:

- axe-core WCAG 2.1/2.2 AA rules
- Supplemental checks (lang, title, skip link, Barrierefreiheitserklärung, focus sample, zoom)
- `complianceReport` mapped to EN 301 549 / BITV 2.0

## 4. Whole-site scanning

Homepage and `POST /api/audit/batch` accept `wholeSite: true` with a seed `url`. The API discovers up to 10 same-origin pages from `sitemap.xml` or homepage links.
