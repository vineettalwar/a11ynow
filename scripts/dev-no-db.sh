#!/usr/bin/env bash
# Web + API with dynamic API port; loads repo .env (e.g. DATABASE_URL) then starts servers.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

exec bash "${ROOT}/scripts/dev-app-servers.sh"
