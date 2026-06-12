#!/usr/bin/env bash
set -euo pipefail

# Provision Cloudflare resources for accessibility.now.
# Run from repo root after: npx wrangler login

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/artifacts/accessibility-now"
WRANGLER="$APP/wrangler.jsonc"

echo "Creating D1 database..."
D1_OUT=$(cd "$APP" && npx wrangler d1 create accessibility-now 2>&1)
echo "$D1_OUT"
D1_ID=$(echo "$D1_OUT" | grep -Eo '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)

echo "Creating KV namespace..."
KV_OUT=$(cd "$APP" && npx wrangler kv namespace create accessibility-now-job-cache 2>&1)
echo "$KV_OUT"
KV_ID=$(echo "$KV_OUT" | grep -Eo '[0-9a-f]{32}' | head -1)

echo "Creating R2 bucket..."
cd "$APP" && npx wrangler r2 bucket create accessibility-now-artifacts || true

echo "Creating queue..."
cd "$APP" && npx wrangler queues create accessibility-now-scan-jobs || true

if [ -n "${D1_ID:-}" ] && [ -f "$WRANGLER" ]; then
  echo "Patching D1 database_id in wrangler.jsonc..."
  sed -i.bak "s/\"database_id\": \"00000000-0000-0000-0000-000000000001\"/\"database_id\": \"$D1_ID\"/" "$WRANGLER"
fi

if [ -n "${KV_ID:-}" ] && [ -f "$WRANGLER" ]; then
  echo "Patching KV id in wrangler.jsonc..."
  sed -i.bak "s/\"id\": \"00000000-0000-0000-0000-000000000002\"/\"id\": \"$KV_ID\"/" "$WRANGLER"
fi

rm -f "${WRANGLER}.bak"

cat <<EOF

Next steps:
1. Review patched IDs in artifacts/accessibility-now/wrangler.jsonc
2. cd artifacts/accessibility-now && pnpm run d1:migrate:remote
3. Set secrets: wrangler secret put CRON_SECRET
   Optional email: RESEND_API_KEY + FROM_EMAIL, or SMTP_* via wrangler secret put
4. pnpm run deploy
5. bash scripts/smoke-test.sh https://accessibility.now

Staging deploy: cd artifacts/accessibility-now && pnpm run deploy:cf:staging

EOF
