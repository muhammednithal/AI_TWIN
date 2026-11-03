# Twin

**Remember what matters. Decide with perspective.**

A personal decision workspace that connects your saved context to useful tasks and a journal of what happened afterward. Built with React 19, TypeScript, Material UI 9, Go, PostgreSQL, and Gemini. This `prod` branch evolves the original AI Twin application; it is not an indication that a public production deployment has been performed. Read the [product guide](docs/PRODUCT.md) for the user journey and exact feature boundaries.

## What you can do

- Organize projects with goals, standing instructions, and typed memories: facts, preferences, research, instructions, and decisions.
- Pin essential constraints, track provenance/review dates, and explicitly choose which memories to use in a task.
- Preview the exact context before running an analyze, compare, plan, or draft task. Changed context requires a fresh preview.
- Review saved results alongside immutable memory snapshots. Copy/download results or export a portable context pack.
- Keep a decision journal with your choice, reasoning, assumptions, review date, and eventual outcome.
- Explicitly save an edited task excerpt as memory, or copy selected existing twin memories into a project.

The original companion tools remain under **Twin studio**:

- Create multiple twins with distinct purposes, writing samples, languages, and tone controls.
- Have saved conversations with Markdown replies, retrieved context references, rename/delete, copy, and Markdown export.
- Curate an editable memory library with per-twin context, tags, and search.
- Use a responsive workspace with overview, recent activity, light/dark themes, and mobile navigation.
- Export your account's twins, memories, and complete conversation history as JSON.

Private API resources are scoped to the authenticated account. AI requests have deadlines; failed generation does not save a partial conversation turn. Memories are saved only when you explicitly add them.

## Start locally

Requirements: Node.js 24, Go 1.25.1+, PostgreSQL, and a Gemini API key.

1. Configure `backend/.env` using `backend/.env.example`. Use a disposable local database and a random JWT secret of at least 32 characters. Preserve any existing environment file.
2. In `backend`: `go mod download`, then `go run ./cmd/server -migrate`, then `go run ./cmd/server`.
3. In `ai-twin-frontend`: `npm ci`, then `npm run dev`. Open the printed URL.

Create an account and your first project. Add a few memories, open Task studio, choose context, preview, and run. The frontend's development proxy forwards API requests to port 8080. For a container-based local setup, see [Deployment](docs/DEPLOYMENT.md). For an isolated UI fixture preview without credentials, see [Development](docs/DEVELOPMENT.md#disposable-visual-preview).

**Existing database? Read [Migration](docs/MIGRATION.md) before running the migration command.** The old API and new frontend must be upgraded together.

## Repository

```text
ai-twin-frontend/
  src/app/                   Providers, routing, theme, workspace shell
  src/features/              Projects, tasks, journal, auth, and retained twin tools
  src/components/            Reusable UI primitives
  src/lib/                   Typed API client, queries, contracts, tests
  src/styles/                Design tokens and responsive layout
backend/
  cmd/server/                Composition, migration command, graceful shutdown
  internal/platform/         Validated settings and Gemini adapter
  internal/workspace/        Account-scoped API, models, retrieval, tests
docs/                        Architecture, API, migration, operations, agent context
tools/preview-api.mjs        Disposable, local-only UI fixtures
.github/workflows/ci.yml     Frontend and backend quality checks
compose.yaml                PostgreSQL + migration + API + nginx
```

## Quality checks

Frontend: `npm run lint`, `npm run format:check`, `npm test`, `npm run build`.

Backend: `go vet ./...`, `go test ./...`, `go build ./cmd/server`. CI additionally runs Go's race detector and a disposable PostgreSQL integration suite on Linux. The real-database suite skips locally unless `TWIN_TEST_DATABASE_URL` names an explicitly local `*_test` database. Provider behavior is mocked; live Gemini verification remains separate.

## Documentation

| Document | Purpose |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Required starting point for coding agents |
| [Product guide](docs/PRODUCT.md) | Features, user journey, and what is deliberately not automated |
| [AI context](docs/AI_CONTEXT.md) | Product behavior, boundaries, and source map |
| [Architecture](docs/ARCHITECTURE.md) | Modules, data model, chat lifecycle, tradeoffs |
| [API](docs/API.md) | Routes, payloads, validation, errors |
| [Development](docs/DEVELOPMENT.md) | Setup, fixtures, checks, acceptance pass |
| [Migration](docs/MIGRATION.md) | Legacy data compatibility and release rehearsal |
| [Deployment](docs/DEPLOYMENT.md) | Containers, HTTPS, secrets, operational limits |
| [Verification](docs/VERIFICATION.md) | Checks performed and remaining verification |
| [Roadmap](docs/ROADMAP.md) | Explicitly unshipped work and beta requirements |

## Privacy and scope

Project memories are stored without AI processing. When you run a task, Gemini receives the previewed project brief, objective, and memory context. Legacy twin chat separately uses embeddings and recent conversation context. Password hashes, secrets, and embedding vectors are excluded from exports. Auth is tab-scoped with a 12-hour JWT; sign-out clears this browser tab and does not revoke an issued token. Use HTTPS for public deployment.

The initial architecture targets a single API instance. Live web/market research, external execution tools, email verification/recovery, billing, streaming, document ingestion, distributed rate limits, and vector indexing are future work. Review the deployment guide before exposing signup publicly.
