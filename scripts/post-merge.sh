#!/bin/bash
set -e

pnpm install --frozen-lockfile

# Sync DB schema — push-force is idempotent (safe to run against an already-up-to-date DB).
# We use push-force rather than migrate because the live database was bootstrapped via push
# before versioned migrations were introduced. The __drizzle_migrations table is now seeded
# with the initial migration hash so migrate will work correctly for any future migrations.
pnpm --filter @workspace/db run push-force

# Ensure Playwright Chromium browser is present (needed by page-screenshot endpoint)
pnpm --filter @workspace/api-server exec playwright install chromium

# ── GitHub sync ──────────────────────────────────────────────────────────────
if [ -n "$GITHUB_PAT" ] && [ -n "$GITHUB_REPO" ]; then
  # Ensure origin points to the configured repo (token-free URL)
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$GITHUB_REPO"
  else
    git remote add origin "$GITHUB_REPO"
  fi

  # Authenticate via Authorization header — token never stored in remote URL
  ENCODED=$(printf 'x-access-token:%s' "${GITHUB_PAT}" | base64 -w0 2>/dev/null \
            || printf 'x-access-token:%s' "${GITHUB_PAT}" | base64)

  git -c "http.https://github.com/.extraheader=Authorization: Basic ${ENCODED}" \
    push --force origin HEAD:main

  echo "Pushed to ${GITHUB_REPO}"
else
  [ -z "$GITHUB_PAT" ]  && echo "GITHUB_PAT not set — skipping GitHub push"
  [ -z "$GITHUB_REPO" ] && echo "GITHUB_REPO not set — skipping GitHub push"
fi
