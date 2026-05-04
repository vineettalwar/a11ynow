#!/usr/bin/env bash
# One-command local dev: Docker Postgres + migrations + Vite + API (scans work).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

# dev-db-up migrates using the local Docker URL (ignore any remote DATABASE_URL in .env)
unset DATABASE_URL

echo "==> Ensuring local database (Docker)…"
bash "${ROOT}/scripts/dev-db-up.sh"

if [[ -f "${ROOT}/docker/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/docker/.env"
  set +a
fi

DB_USER="${A11YNOW_DB_USER:-a11ynow}"
DB_NAME="${A11YNOW_DB_NAME:-a11ynow}"
DB_PASS="${A11YNOW_DB_PASSWORD:-a11ynow_local_dev_only}"
DB_PORT="${A11YNOW_DB_PORT:-5432}"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:${DB_PORT}/${DB_NAME}"

# API audits use Playwright Chromium + @axe-core/playwright (artifacts/api-server/src/lib/scan.ts).
# `pnpm install` pulls the npm packages; this pulls the browser binary Playwright launches.
echo "==> Ensuring Playwright Chromium browser (headless WCAG scans via axe)…"
pnpm --filter @workspace/api-server exec playwright install chromium

bash "${ROOT}/scripts/dev-app-servers.sh"
