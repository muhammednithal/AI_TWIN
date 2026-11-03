# AI context: Twin decision workspace

## Product direction

Twin is a **personal decision workspace**. The primary loop is remember → apply → review → decide → reflect. Projects organize durable context; tasks deliberately apply selected memories; the journal preserves choices, assumptions, and outcomes. Read `PRODUCT.md` for the complete user journey and feature boundaries.

The original personality-based twin/chat experience remains available under `/companion`, `/twins`, `/chat`, and `/memory`. It is a separate workflow, not the context source for project tasks unless the user explicitly imports notes.

## Implemented

- Task results render memory citations as buttons opening the immutable input snapshot. Unknown labels are explicitly unavailable; references are model-authored attribution, not independent verification.
- A pre-decision panel surfaces review dates that have passed and the model's assumptions/missing-information section. Older unstructured answers receive a clear fallback. Review dates are checked at viewing time; gaps are AI-generated, not an exhaustive validation.
- Dashboard review inbox and journal due-only filter lead into existing outcome editing and explicit, editable lesson creation. No background notifications or automatic memory writes.

- Authenticated, account-scoped projects with purpose, standing instructions, and archive/restore.
- Typed project memories: fact, preference, research, instruction, decision. Source text, tags, version, pin, archive, review date, optional source-task provenance.
- Copy-only import of selected owned twin memories. Deterministic destination IDs make repeat imports safe; existing project copies are not overwritten.
- Explicit task context selection plus all active pinned notes and standing instructions, with a 30-memory hard bound. Project notes are stored without embedding/model calls.
- Signed, deterministic context preview; no task generation without a matching preview token. A post-generation transaction verifies the context again before saving.
- Analyze/compare/plan/draft tasks, reusable starting prompts, immutable result/input snapshots, persistent history, copy/Markdown/context-pack exports.
- Task review statuses and notes; explicit promotion of a reviewed/edited output excerpt to memory.
- Decision journal: choice, reasoning, assumptions, outcome, review date, status, and optional supporting task.
- Version-2 account export includes all project/task/journal data as well as legacy twin data.
- Legacy twin CRUD, style embeddings, memory management, and persistent chat remain intact.

## Source map

| Concern | Start here |
| --- | --- |
| Product journey and limits | `docs/PRODUCT.md` |
| App routes/providers | `ai-twin-frontend/src/app/App.tsx` |
| Project/task contracts and query hooks | `ai-twin-frontend/src/lib/workbench-types.ts`, `workbench.ts` |
| HTTP/auth boundary | `ai-twin-frontend/src/lib/api.ts` |
| Projects, library, import | `ai-twin-frontend/src/features/projects/` |
| Context preview/results/reviews | `ai-twin-frontend/src/features/tasks/` |
| Journal | `ai-twin-frontend/src/features/decisions/` |
| Project domain/persistence | `backend/internal/workspace/projects.go`, `project_memory.go`, `project_import.go` |
| Context contract | `backend/internal/workspace/task_context.go` |
| Task execution/idempotency | `backend/internal/workspace/tasks.go` |
| Journal | `backend/internal/workspace/decisions.go` |
| Real PostgreSQL integration suite | `backend/internal/workspace/project_integration_test.go` |
| Gemini transport | `backend/internal/platform/ai/gemini.go` |

## Invariants

Every private query is account-scoped, directly or through an owned project/twin. Project child writes lock the parent first. Network generation happens outside database locks. Context tokens cover the task objective/type, project brief/instructions, and exact included memory versions/content/provenance. A changed context must be previewed again. Persisted results and input snapshots are immutable; only review state/notes change.

Task request IDs are supplied by the client and unique in storage. A retry with the same ID/payload returns its saved result. A reused ID for a different task is rejected. The in-process overlap guard reduces duplicate work; multiple replicas may still generate concurrently before the database uniqueness constraint resolves the final write. Preview tokens are not authentication tokens.

Never silently turn a conversation/result into project memory. Import and promotion require explicit user action. Review dates only flag freshness; they do not verify or refresh information. Do not claim autonomous actions, live research, verified market data, deterministic conflict detection, file ingestion, reminders, or context-pack import.

## Verification and rollout

Use `go run ./cmd/server -migrate` only against the intended backed-up development/staging database. The additive schema introduces `projects`, `project_memories`, `task_runs`, and `decisions`; legacy tables remain. Normal startup does not migrate.

Go unit/SQL-mock tests cover context selection, ownership, token changes, and task retries. The real PostgreSQL suite requires `TWIN_TEST_DATABASE_URL` pointing to an explicitly local `*_test` database; it creates and removes only its random schema. GitHub CI provisions that database. A locally skipped integration test is not a pass. Keep `VERIFICATION.md` honest about actual runs.
