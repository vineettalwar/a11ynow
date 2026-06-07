#!/usr/bin/env bash
# Run Drizzle migrations with DATABASE_URL from repo .env (or Docker dev defaults).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
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
fi

pnpm --filter @workspace/db run migrate
