# Cloudflare deployment

accessibility.now splits across three deploy targets:

| Component | Platform | Artifact |
|-----------|----------|----------|
| **Frontend (SPA)** | Cloudflare Pages | `artifacts/accessibility-now/dist/public` |
| **API (Express + Playwright + Postgres)** | Node host (Fly.io, Railway, VPS, etc.) | `artifacts/api-server` |
| **Scan worker (optional)** | Cloudflare Workers Browser Rendering | `artifacts/scan-worker` |

## 1. Deploy the frontend to Cloudflare Pages

```bash
cd artifacts/accessibility-now
pnpm install
pnpm build   # runs sitemap generation + Vite build
npx wrangler pages deploy dist/public --project-name=accessibility-now
```

Or connect the GitHub repo in the Cloudflare dashboard:

- **Build command:** `pnpm --filter @workspace/accessibility-now run build`
- **Build output directory:** `artifacts/accessibility-now/dist/public`
- **Root directory:** repository root (monorepo)

### Required Pages environment variable

| Variable | Example | Purpose |
|----------|---------|---------|
| `API_ORIGIN` | `https://api.accessibility.now` | Backend for `/api/*` (proxied by `functions/api/[[path]].ts`) |

Without `API_ORIGIN`, tool scans and audits return `503 api_not_configured`.

### What ships with the frontend

- `public/_redirects` — SPA fallback (`/* → /index.html`)
- `public/_headers` — security and cache headers
- `functions/api/[[path]].ts` — proxies `/api/*` to `API_ORIGIN`
- `wrangler.toml` — Pages project config
- Auto-generated `public/sitemap.xml` (55+ URLs) on each build

## 2. Deploy the API server

The API needs Node.js 20+, Playwright Chromium, and PostgreSQL:

```bash
cd artifacts/api-server
pnpm install
pnpm exec playwright install chromium --with-deps   # Linux servers
pnpm run build
# Set DATABASE_URL, PORT, APP_BASE_URL=https://accessibility.now
node dist/index.mjs
```

Point `APP_BASE_URL` at your public frontend URL so monitor links and PDFs use correct permalinks.

## 3. Deploy the scan worker (optional)

Offload browser scans to Cloudflare Browser Rendering:

```bash
cd artifacts/scan-worker
pnpm install
npx wrangler login
pnpm deploy
npx wrangler secret put SCAN_AUTH_TOKEN
```

On the API host:

```env
SCAN_WORKER_URL=https://accessibility-now-scan.<subdomain>.workers.dev
SCAN_WORKER_TOKEN=<same token as worker secret>
```

When `SCAN_WORKER_URL` is set, `POST /api/audit` delegates to the worker. Local Playwright remains the fallback.

## 4. DNS (recommended)

| Record | Target |
|--------|--------|
| `accessibility.now` | Cloudflare Pages |
| `api.accessibility.now` | API host |

Set `API_ORIGIN=https://api.accessibility.now` on Pages.

## 5. BITV 2.0 / BFSG reporting

All scans (local or Cloudflare worker) include:

- axe-core WCAG 2.1/2.2 AA rules
- Supplemental checks (lang, title, skip link, Barrierefreiheitserklärung, focus sample, zoom)
- `complianceReport` mapped to EN 301 549 / BITV 2.0

## 6. Whole-site scanning

Homepage and `POST /api/audit/batch` accept `wholeSite: true` with a seed `url`. The API discovers up to 10 same-origin pages from `sitemap.xml` or homepage links.
