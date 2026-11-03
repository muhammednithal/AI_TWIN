# Verification record — 3 November 2026

This records checks for the decision-workspace evolution on `prod`. It is not a production release certification.

## Passed locally

- Locked frontend dependency installation (`npm ci`), strict TypeScript checking, Vite production build, ESLint, and Prettier check. The sandboxed install encountered a Windows permission error; reinstalling with the approved normal executor completed successfully.
- Eleven Vitest tests: the existing authenticated transport tests plus selected-context payloads, preserved confirmation/request IDs across retries, and HTTP 409 handling for re-preview.
- Go unit and SQL-mock tests across the AI adapter, configuration, and workspace. New coverage includes pinned/selected context, unavailable/foreign/archived selections, hard size bounds, freshness warnings, deterministic signing, changed-content detection, project/task ownership, idempotent replay, confirmed-context commit/rollback, provider failure, and context changes during generation.
- Go formatting, `go vet ./...`, and server build.
- Synthetic fixture smoke through the development proxy: HTTP page response, login, project memories, pinned-plus-selected preview, task execution/replay, journal creation, and version-2 export. These checks verify fixture/proxy wiring, not browser rendering, PostgreSQL, or Gemini.
- Existing `.env` files and dependency manifests/lockfile are unchanged. No new runtime packages were needed. The previous production dependency audit reported zero vulnerabilities; it was not rerun for this feature-only change. Previously recorded development-only lint/minimatch advisories remain separate from runtime dependencies.

## Added, but not verified locally

`TestProjectTaskJournalPostgres` performs real additive schema creation, project/memory/task/journal writes, ownership rejection, input snapshot preservation, idempotent retries, export, provider failure, and context edits during generation. It requires `TWIN_TEST_DATABASE_URL` pointing to a disposable local `*_test` database and owns only a random schema.

The test was **explicitly skipped locally** because no disposable PostgreSQL instance/tooling was available. GitHub Actions now provisions PostgreSQL 17 and supplies the test URL; the updated CI workflow must run on GitHub before claiming that integration pass.

## Remaining release verification

- Browser rendering, responsive layouts, keyboard navigation, and full interactive acceptance. Earlier Computer Use attempts in this environment timed out or could not confidently identify the Windows browser URL. No visual acceptance pass is claimed by the HTTP fixture checks.
- Live Gemini model access, quota, latency, and result quality. Provider tests use doubles; no real API calls were made during verification.
- Existing-data migration rehearsal on a backup/clone. No existing or remote application database was modified.
- Container builds, Compose startup, deployed HTTPS/CSP, and Linux race-detector execution. CI includes race tests; local Windows checks do not substitute for that run.

Follow `DEVELOPMENT.md` for the manual journey and `MIGRATION.md` before applying the new schema. Use the synthetic preview only for local QA, never as a production API.
