# Local development

## Requirements

Node.js 24 LTS, npm, Go 1.25.1+, PostgreSQL 17 (or a disposable compatible database), and a Gemini API key. Docker Compose is optional. Never use a production database for development.

## API

From `backend`, copy `.env.example` to `.env` only if no local file exists. Set `DATABASE_URL` to a disposable database, `JWT_SECRET` to a random value of at least 32 characters, and `GEMINI_API_KEY`. Placeholder secrets are rejected. The default chat model is configurable; account-level Gemini model availability must be verified separately.

```powershell
cd backend
go mod download
go run ./cmd/server -migrate
go run ./cmd/server
```

The explicit migration command exits after updating the schema. Normal startup does not migrate. `/health` checks liveness; `/ready` checks PostgreSQL. If `DATABASE_URL` is unset, the API accepts the legacy `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, and `DB_SSLMODE` variables. Prefer a properly escaped connection URL for new setups.

## Frontend

```powershell
cd ai-twin-frontend
npm ci
npm run dev
```

Open the printed local URL. Vite proxies `/api` and `/auth` to `http://localhost:8080`. `API_PROXY_TARGET` overrides the dev proxy; `VITE_API_URL` is a build-time browser API origin override. Neither may contain private provider keys. Create an account, create a twin using your own writing samples, add memories, and start a conversation.

## Disposable visual preview

When no database/key is available, the local-only fixture API allows visual/interaction checks. It never calls Gemini or reads `.env`. All changes disappear when it stops; replies explicitly identify themselves as fixture output.

Terminal 1, repository root:

```powershell
node tools/preview-api.mjs
```

Terminal 2:

```powershell
cd ai-twin-frontend
$env:API_PROXY_TARGET='http://127.0.0.1:8081'
npm run dev -- --host 127.0.0.1
```

Use any synthetic email/password in the sign-in form, for example `alex@example.test`. Enter `[fail]` in a chat message to exercise the provider-error/draft-preservation state. Never use real personal data or real credentials with fixtures. The fixture server binds only to loopback; it is not included in production containers. Clear `API_PROXY_TARGET` when returning to the real API.

## Checks

```powershell
# frontend
npm run format
npm run lint
npm test
npm run build

# backend, from backend/
gofmt -w internal cmd
go vet ./...
go test ./...
go build -o ./bin/server.exe ./cmd/server
```

Use `go test -race ./...` on a supported CGO-enabled toolchain; CI runs it on Linux. Frontend tests cover the auth/API boundary. Backend tests cover token validation, private-resource rejection, ID validation, provider response handling, and failure-before-write behavior using SQL mocks. They do not verify live PostgreSQL migrations or Gemini account/model availability.

## Manual acceptance pass

Verify signup/login/logout; create/edit/delete a twin; add/edit/search/delete memories; start/reopen/rename/delete conversations; inspect context references; copy/export messages; export the account; switch themes; keyboard-navigate dialogs; check at 390px, 768px, and desktop widths. Simulate provider/network failure and verify the draft remains. Test two real disposable accounts against each other's IDs before a release.
