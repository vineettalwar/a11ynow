#!/usr/bin/env bash
# Create a gzipped SQL backup, then stop the dev Postgres container. Named volume keeps data.
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

COMPOSE=(docker compose -f docker/compose.yaml)
if [[ -f "${ROOT}/docker/.env" ]]; then
  COMPOSE+=(--env-file "${ROOT}/docker/.env")
fi

mkdir -p "${ROOT}/.docker/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${ROOT}/.docker/backups/a11ynow-${STAMP}.sql.gz"

if "${COMPOSE[@]}" ps -q db 2>/dev/null | grep -q .; then
  echo "==> Writing backup to ${OUT} …"
  "${COMPOSE[@]}" exec -T db pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-owner --clean --if-exists \
    | gzip >"${OUT}"
  echo "==> Backup complete."
else
  echo "==> Postgres container is not running — skipping backup."
fi

echo "==> Stopping stack (volume a11ynow_pgdata keeps your data)…"
"${COMPOSE[@]}" down

echo "==> Done."
