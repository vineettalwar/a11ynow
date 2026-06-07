#!/usr/bin/env bash
# Stop a stale Next.js dev server for accessibility-now (reads .next/dev/lock).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="${ROOT}/artifacts/accessibility-now"
LOCK_FILE="${APP_DIR}/.next/dev/lock"

if [[ ! -f "$LOCK_FILE" ]]; then
  exit 0
fi

stale_pid=""
if command -v python3 >/dev/null 2>&1; then
  stale_pid="$(python3 -c "import json; print(json.load(open('${LOCK_FILE}'))['pid'])" 2>/dev/null || true)"
elif command -v node >/dev/null 2>&1; then
  stale_pid="$(node -e "console.log(JSON.parse(require('fs').readFileSync('${LOCK_FILE}','utf8')).pid)" 2>/dev/null || true)"
fi

if [[ -n "$stale_pid" ]] && kill -0 "$stale_pid" 2>/dev/null; then
  echo "==> Stopping existing Next.js dev server (PID ${stale_pid})…"
  kill "$stale_pid" 2>/dev/null || true
  for _ in 1 2 3 4 5; do
    kill -0 "$stale_pid" 2>/dev/null || break
    sleep 0.5
  done
  if kill -0 "$stale_pid" 2>/dev/null; then
    kill -9 "$stale_pid" 2>/dev/null || true
  fi
fi

rm -f "$LOCK_FILE"
