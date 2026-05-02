#!/bin/bash
set -e

pnpm install --frozen-lockfile
pnpm --filter db push

# ── GitHub sync ──────────────────────────────────────────────────────────────
if [ -n "$GITHUB_TOKEN" ]; then
  git push \
    "https://${GITHUB_TOKEN}@github.com/vineettalwar/a11ynow.git" \
    HEAD:main \
    --force-with-lease 2>&1 | grep -v "GITHUB_TOKEN" || \
  git push \
    "https://${GITHUB_TOKEN}@github.com/vineettalwar/a11ynow.git" \
    HEAD:main \
    --force 2>&1 | grep -v "GITHUB_TOKEN"
  echo "Pushed to github.com/vineettalwar/a11ynow"
else
  echo "GITHUB_TOKEN not set — skipping GitHub push"
fi
