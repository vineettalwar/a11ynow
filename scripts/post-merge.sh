#!/bin/bash
set -e

pnpm install --frozen-lockfile
pnpm --filter db push

# ── GitHub sync ──────────────────────────────────────────────────────────────
if [ -n "$GITHUB_TOKEN" ]; then
  REPO_URL="https://github.com/vineettalwar/a11ynow.git"

  # Ensure remote exists and points to the correct URL (token-free)
  if git remote get-url github >/dev/null 2>&1; then
    git remote set-url github "$REPO_URL"
  else
    git remote add github "$REPO_URL"
  fi

  # Build Basic-auth header — token never appears in the remote URL or git log
  ENCODED=$(printf 'x-access-token:%s' "${GITHUB_TOKEN}" | base64 -w0 2>/dev/null \
            || printf 'x-access-token:%s' "${GITHUB_TOKEN}" | base64)

  git -c "http.https://github.com/.extraheader=Authorization: Basic ${ENCODED}" \
    push github HEAD:main

  echo "Pushed to github.com/vineettalwar/a11ynow"
else
  echo "GITHUB_TOKEN not set — skipping GitHub push"
fi
