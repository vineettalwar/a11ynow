#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-}"

echo "Smoke testing $BASE_URL"

health=$(curl -sf "$BASE_URL/api/healthz")
echo "healthz: $health"
echo "$health" | grep -q '"status"'
echo "$health" | grep -q '"scanEngineReady":true'

lead_status=$(curl -s -o /tmp/lead.json -w "%{http_code}" -X POST "$BASE_URL/api/leads" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test","email":"smoke@example.com","source":"pricing","company":"Acme","service":"audit","message":"CI smoke test"}')
echo "leads status: $lead_status"
test "$lead_status" = "201"

monitor_status=$(curl -s -o /tmp/monitor.json -w "%{http_code}" -X POST "$BASE_URL/api/monitor" \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","email":"monitor-smoke@example.com","frequency":"monthly"}' || true)
echo "monitor status: $monitor_status"
if [ "$monitor_status" = "201" ]; then
  token=$(grep -o '"token":"[^"]*"' /tmp/monitor.json | head -1 | cut -d'"' -f4)
  if [ -n "${token:-}" ]; then
    echo "$token" | grep -Eq '^[0-9a-f]{48}$'
    dash_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/monitor/$token")
    echo "monitor dashboard status: $dash_status"
    test "$dash_status" = "200"
  fi
fi

if [ -n "$CRON_SECRET" ]; then
  cron_status=$(curl -s -o /tmp/cron.json -w "%{http_code}" -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/monitoring")
  echo "cron status: $cron_status"
  test "$cron_status" = "200"
else
  echo "Skipping cron test (CRON_SECRET not set)"
fi

echo "Smoke tests passed."
