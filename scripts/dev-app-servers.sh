#!/usr/bin/env bash
# Start Vite + API with a free API port and matching /api proxy (no Docker / migrations).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# Do not source .env here: `dev-local.sh` exports DATABASE_URL before calling this script;
# use `dev-no-db.sh` when you want .env loaded first.

pick_free_tcp_port() {
  node -e "
    const net = require('net');
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => {
      const port = s.address().port;
      s.close(() => process.stdout.write(String(port)));
    });
  "
}

if [[ -n "${A11YNOW_API_PORT:-}" ]]; then
  API_PORT="${A11YNOW_API_PORT}"
  echo "==> API port from A11YNOW_API_PORT: ${API_PORT}"
else
  API_PORT="$(pick_free_tcp_port)"
  echo "==> Picked free API port: ${API_PORT}"
fi

PROXY_URL="http://127.0.0.1:${API_PORT}"

echo "==> Starting web + API (proxy /api → ${PROXY_URL})…"
echo "    Press Ctrl+C to stop."
echo ""

cleanup() {
  # shellcheck disable=SC2046
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

(
  unset PORT
  export VITE_DEV_API_PROXY="${PROXY_URL}"
  exec pnpm --filter @workspace/accessibility-now dev
) &
PORT="${API_PORT}" pnpm --filter @workspace/api-server run dev &
wait
