# Verification record — 3 November 2026

This records local checks on the `prod` restructure. It is not a production release certification.

## Passed

- Frontend strict TypeScript checking and Vite production build.
- Frontend ESLint with no errors/warnings and Prettier formatting check.
- Eight Vitest tests covering malformed auth state, current-account headers, expired sessions, login failure, late responses after account switching, empty delete responses, and safe service errors.
- Go tests across the AI adapter, configuration, and workspace packages; SQL tests cover private-resource access, malformed IDs, provider failure without partial writes, and atomic chat commit/rollback.
- `go vet ./...`, Go formatting, and compiled server binary.
- Production npm audit: **zero vulnerabilities**. Full dependency audit: **12 moderate, zero high/critical**, all in the development lint/minimatch dependency chain. Compatible fixes were applied; forced downgrades were not used.
- Production bundle split into React, Material UI, query, Markdown, and app chunks; largest JavaScript chunk is approximately 302 kB before gzip.

Observed Go statement coverage: AI adapter about 89.6%, settings 100%, workspace about 41%. The process composition root has no direct test coverage. These are focused boundary tests rather than comprehensive product integration coverage.

## Not verified here

- Browser rendering, responsive layout, keyboard behavior, and UI interactions. The in-app browser timed out reaching localhost. Computer Use then stopped because it could not determine the Windows browser URL confidently enough to continue. No visual screenshots or browser acceptance pass are claimed.
- Real PostgreSQL migration or database CRUD. Docker/PostgreSQL command-line tooling was not available. No existing or remote database was modified.
- Live Gemini generation/embedding, account quota, or configured model access. Provider behavior is covered by transport fakes.
- Container build/Compose startup and deployed HTTPS/CSP behavior. Container definitions are provided for rehearsal in an environment with Docker.
- GitHub Actions execution; the workflow is authored, but has not been run on GitHub as part of this local change.
- Linux race-detector execution locally; the CI workflow includes it.

Follow the manual acceptance pass in `DEVELOPMENT.md` and the migration/deployment guides before releasing. `tools/preview-api.mjs` supplies disposable fixtures for that UI pass and must never be used as the production API.
