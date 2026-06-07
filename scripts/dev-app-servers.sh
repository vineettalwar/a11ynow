#!/usr/bin/env bash
# Start Next.js with DATABASE_URL from environment (no Docker / migrations).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +a
fi

bash "${ROOT}/scripts/stop-stale-next-dev.sh"

echo "==> Starting Next.js (web + API route handlers)…"
echo "    Press Ctrl+C to stop."
echo ""

export ENABLE_LOCAL_SCHEDULER=1
exec pnpm --filter @workspace/accessibility-now run dev
