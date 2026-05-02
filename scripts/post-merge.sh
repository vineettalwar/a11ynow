#!/bin/bash
set -e

pnpm install --frozen-lockfile
pnpm --filter db push

# Ensure Playwright Chromium browser is present (needed by page-screenshot endpoint)
pnpm --filter @workspace/api-server exec playwright install chromium

# ── GitHub sync ──────────────────────────────────────────────────────────────
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_REPO" ]; then
  # Ensure origin points to the configured repo (token-free URL)
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$GITHUB_REPO"
  else
    git remote add origin "$GITHUB_REPO"
  fi

  # Authenticate via Authorization header — token never stored in remote URL
  ENCODED=$(printf 'x-access-token:%s' "${GITHUB_TOKEN}" | base64 -w0 2>/dev/null \
            || printf 'x-access-token:%s' "${GITHUB_TOKEN}" | base64)

  git -c "http.https://github.com/.extraheader=Authorization: Basic ${ENCODED}" \
    push origin HEAD:main

  echo "Pushed to ${GITHUB_REPO}"
else
  [ -z "$GITHUB_TOKEN" ] && echo "GITHUB_TOKEN not set — skipping GitHub push"
  [ -z "$GITHUB_REPO"  ] && echo "GITHUB_REPO not set — skipping GitHub push"
fi
