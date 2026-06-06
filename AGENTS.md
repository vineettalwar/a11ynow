<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

## Cursor Cloud specific instructions

### Prerequisites

- **Node.js 20+** and **pnpm 9+** (repo root uses pnpm workspaces).
- **Docker** is required for the bundled dev Postgres (`pnpm db:up`). On this VM, `dockerd` may not start via systemd — start it manually before `pnpm db:up` or `pnpm dev`:

```bash
sudo dockerd > /tmp/dockerd.log 2>&1 &
sudo chmod 666 /var/run/docker.sock   # if you see "permission denied" on the socket
```

### One-command dev (recommended)

```bash
cp .env.example .env   # if missing; Docker DB URL is pre-filled in the template
pnpm dev               # Docker Postgres + migrations + Playwright Chromium + Vite + API
```

Open **http://localhost:5180**. API health: `curl http://127.0.0.1:8080/api/healthz` — expect `"scanEngineReady": true`.

### Without Docker (existing `DATABASE_URL`)

```bash
pnpm dev:no-db
```

Sources repo `.env` and starts Vite + API only (no migrations). Run `pnpm db:migrate` yourself when the schema changes.

### Services and ports

| Service | Port | Notes |
|---------|------|--------|
| Frontend (Vite) | **5180** | Proxies `/api` via `VITE_DEV_API_PROXY` |
| API (Express) | **8080** when pinned (`A11YNOW_API_PORT` or `PORT` in `.env`); otherwise auto-picked by `pnpm dev` | |
| PostgreSQL (Docker) | **5432** | `postgresql://a11ynow:a11ynow_local_dev_only@127.0.0.1:5432/a11ynow` |

### Verify / lint / test

| Command | Purpose |
|---------|---------|
| `pnpm run typecheck` | Full monorepo typecheck (CI equivalent) |
| `pnpm --filter @workspace/api-server run test` | API unit tests (`tsx --test`) |
| `pnpm run build` | Typecheck + build all packages |

Playwright Chromium is required for real WCAG scans (installed automatically by `pnpm dev`, or run `pnpm --filter @workspace/api-server exec playwright install chromium`).

### Gotchas

- Do not export a single `PORT` for both servers — `scripts/dev-app-servers.sh` unsets `PORT` for Vite and picks a free API port unless `A11YNOW_API_PORT` is set.
- `pnpm dev` **unsets** `DATABASE_URL` from `.env` and uses the Docker Postgres URL; use `pnpm dev:no-db` when pointing at an external database.
- SMTP vars are optional; email runs in no-op/log mode when unset.
