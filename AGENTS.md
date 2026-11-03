# Agent guide

## Start here

Read `docs/AI_CONTEXT.md`, then `docs/ARCHITECTURE.md` and the nearest package's `AGENTS.md` before editing. This is a Go/PostgreSQL + React/TypeScript personal AI workspace. `prod` is the restructure branch; `main` is the legacy application. Do not deploy or merge merely because the branch is called prod.

## Working agreements

- Keep the real API in Go. The browser must never receive `GEMINI_API_KEY`, database credentials, or the JWT signing secret.
- Every query for a private resource must be scoped to the authenticated account, directly or through its owning twin. Cross-account IDs return 404. Never trust a request's user ID.
- Use transactions for related writes. Do AI/network work before acquiring database locks. Preserve the lock order: twin, then session, then child rows.
- Keep feature behavior in its feature directory. Shared UI belongs in `src/components`; API contracts and helpers belong in `src/lib`.
- Handle loading, empty, error, success, and pending states. Preserve chat drafts after failure. Prevent repeated sends while pending.
- Use Material UI components and theme tokens; do not add a second component system. Respect keyboard navigation and reduced motion.
- Memory is intentionally user-curated. Never introduce silent extraction of personal facts, telemetry, or transmission to a new provider without an explicit product decision.
- Preserve `.env` files and unrelated untracked files. Never print secrets. `AI_TWIN.postman_collection.json` and `explain.txt` predate this restructure and are user-owned, untracked files.
- Do not run migrations against an existing/remote database as part of routine tests. Use disposable databases and follow `docs/MIGRATION.md`.
- `tools/preview-api.mjs` is disposable local fixture infrastructure; it is not a production API or a substitute for integration tests.

## Required checks

Frontend: `npm ci`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build` in `ai-twin-frontend`.

Backend: `gofmt -w internal cmd`, `go vet ./...`, `go test ./...`, `go build ./cmd/server` in `backend`. CI also runs the race detector on Linux.

Update the API docs and agent context whenever contracts, persistence, configuration, or product boundaries change. Report tests actually run and distinguish fixture, mocked SQL, and real integration verification.
