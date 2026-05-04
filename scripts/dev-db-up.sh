#!/usr/bin/env bash
# Start the dev Postgres container, wait until it accepts connections, then run Drizzle migrations.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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

COMPOSE=(docker compose -f docker/compose.yaml)
if [[ -f "${ROOT}/docker/.env" ]]; then
  COMPOSE+=(--env-file "${ROOT}/docker/.env")
fi

mkdir -p "${ROOT}/.docker/backups"

echo "==> Starting Postgres (docker compose up -d)…"
"${COMPOSE[@]}" up -d --build

echo "==> Waiting for database to become ready…"
for i in $(seq 1 60); do
  if "${COMPOSE[@]}" exec -T db pg_isready -U "${DB_USER}" -d "${DB_NAME}" &>/dev/null; then
    echo "==> Database is ready."
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "Timed out waiting for Postgres." >&2
    exit 1
  fi
  sleep 1
done

export DATABASE_URL="${DATABASE_URL:-postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:${DB_PORT}/${DB_NAME}}"

echo "==> Running migrations…"
pnpm --filter @workspace/db run migrate

echo ""
echo "Dev database is up. Add or update your repo-root .env:"
echo "  DATABASE_URL=${DATABASE_URL}"
echo ""
echo "Stop + backup:  pnpm db:down"
echo "Backup only:    pnpm db:backup"
