#!/usr/bin/env bash
# One-command local dev: Docker Postgres + migrations + Next.js (scans work).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

unset DATABASE_URL
unset PORT

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

echo "==> Ensuring Playwright Chromium browser (headless WCAG scans via axe)…"
pnpm --filter @workspace/accessibility-now exec playwright install chromium

bash "${ROOT}/scripts/stop-stale-next-dev.sh"

echo "==> Starting Next.js (web + API route handlers)…"
echo "    Press Ctrl+C to stop."
echo ""

export ENABLE_LOCAL_SCHEDULER=1
exec pnpm --filter @workspace/accessibility-now run dev
