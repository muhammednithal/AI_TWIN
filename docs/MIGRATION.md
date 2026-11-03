# Migrating from main to prod

This branch is a coordinated frontend/API upgrade. Rehearse on a clone, not the only copy of your database. No existing `.env` file is automatically changed and no live database is migrated by repository checks.

## Preserved data

The tables `users`, `personalities`, `samples`, `memories`, `chat_sessions`, and `messages` retain their names and UUID primary keys. Twin `SliderJSON` maps to the existing `slider_json` column. Existing samples and memory vectors remain usable with `gemini-embedding-001`; changing embedding models requires reindexing every sample/memory, not only changing the query model. User passwords remain bcrypt hashes.

The schema adds conversation titles and indexes. New IDs are generated in Go so fresh databases do not need UUID SQL extensions. Old database UUID defaults may still exist; verify the migration on your engine version. Legacy `emotional` tone values are mapped to `empathy` when a twin is edited in the UI.

## Rehearsal and release

1. Stop writes to the database snapshot being migrated; take and validate a PostgreSQL backup. Restore it to a disposable database or create a database branch.
2. Configure the new API against that clone. Set a fresh random `JWT_SECRET`, a valid `GEMINI_API_KEY`, the desired model names, and exact CORS origins. Ensure the API's role can perform schema changes for the migration step.
3. Run `go run ./cmd/server -migrate` from `backend`. This runs GORM AutoMigrate; it is additive in intent but can alter existing column/default definitions. Review changes and table counts. Do not assume this command is a substitute for reviewed, versioned SQL migrations at a larger deployment scale.
4. Start the API without `-migrate`. Check `/ready`, then sign into an existing account. Confirm twin/sample counts, memory content, conversation history, ownership isolation, and new message writes.
5. Release the new API and frontend together behind HTTPS. Retire the legacy routes and clients at the same time. Preserve a rollback copy of both application images and the database backup.

## Contract changes

- `/api/personalities` → `/api/twins`; response wrapper becomes `{twins}` / `{twin}`.
- `/api/memory` → `/api/memories`; memory JSON now consistently uses snake_case.
- Invalid supplied sessions no longer silently create a different session.
- Missing/foreign twin, memory, and session IDs are rejected.
- New auth uses issuer-bound HS256 tokens and a validated secret; legacy tokens must sign in again. Legacy localStorage auth/selection keys are no longer read.
- Existing conversations may display `New conversation` until renamed; old message content remains unchanged.
- Automatic inferred-memory extraction is removed. Existing memories remain available for review/removal.

## Rollback

Do not drop data to roll back. Return to the previous images and restored database snapshot if the rehearsal shows incompatibility. Once new data has been written under the new schema, plan a reviewed data reconciliation before restoring an older snapshot; otherwise those writes would be lost. The production database migration and release have not been executed as part of this restructure.

## Decision-workspace evolution

The migration now also creates `projects`, `project_memories`, `task_runs`, and `decisions`, plus their indexes. Existing twin tables and records remain unchanged in purpose. Run the explicit migration against your backed-up development/staging database before starting the updated app. Normal API startup still does not migrate.

Existing twin memories are not automatically assigned to projects. In a project's Memories tab, choose **Bring memories from a twin**, select notes and their type, and import. This is copy-only: originals remain, and repeat imports do not overwrite project copies. New project memories use explicit task selection rather than embeddings.

Full account export is now version 2. It adds projects, project memories, task results with immutable context snapshots, and decision journal entries. Export consumers must handle the new keys and retain existing legacy keys. Context-pack import is not implemented.
