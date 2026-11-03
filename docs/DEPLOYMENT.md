# Deployment and operations

## Container setup

Copy root `.env.example` to `.env` without overwriting an existing file. Set a cryptographically random, URL-safe `POSTGRES_PASSWORD`, a random `JWT_SECRET` of at least 32 characters, and your Gemini API key. For example, generate a secret with Node's `crypto.randomBytes(32).toString('hex')` and store it privately. Do not commit the result.

```powershell
docker compose up --build -d
docker compose ps
docker compose logs api
```

Compose starts a new persistent PostgreSQL volume, applies the schema in a one-off migration container, starts the API, then serves the frontend at `http://localhost:3000`. The web port binds to loopback. This is a self-contained local deployment recipe; it does not replace the existing database. Docker must be installed separately.

For public deployment, put an HTTPS reverse proxy/load balancer in front of nginx, set `ENV=production` and `CORS_ALLOWED_ORIGINS=https://your-host`, and choose intentional image versions/digests for the deployment. Managed PostgreSQL should use TLS (`sslmode=require` or stronger) and a restricted role. The API itself is not exposed by the Compose recipe.

## HTTP and secrets

- Same-origin nginx forwards `/api/*` and `/auth/*` to the Go service, and falls back to `index.html` for SPA routes.
- `VITE_API_URL` is public build-time configuration. Runtime provider/database secrets belong only in the API environment or secret store.
- nginx adds content security, referrer, and frame policies. Inline styles are allowed for Material UI/Emotion. Google Fonts are the only external UI requests.
- The Go API limits bodies to 1 MiB, uses explicit origins, validates token algorithm/issuer/expiry, applies authentication/AI rate limits, and stops treating proxies as implicitly trusted.
- In the provided nginx topology the API sees nginx's address. Auth IP limits consequently aggregate behind that proxy. Before public traffic, enforce rate limiting at the edge and configure trusted proxy IP ranges deliberately; never trust arbitrary forwarded headers.
- Query logs omit SQL parameters. Do not add prompt, token, sample, or memory contents to logs/metrics.

## Operational limits

Start with one API instance. The in-process rate limiter and account/twin overlap guard are not distributed. Multiple instances need shared rate limiting plus persisted idempotency/concurrency controls before they provide consistent behavior. A completed reply is saved atomically, but ambiguous network disconnects are not idempotent: recheck history before resending.

Project tasks now have persisted request-ID idempotency and immutable context snapshots. Retries return a matching saved result; provider-call deduplication is still process-local. The legacy chat limitation above remains. Apply the additive project schema migration before releasing this version. CI provisions a disposable PostgreSQL service for project integration tests; it does not migrate your deployed database.

Readiness checks PostgreSQL, not Gemini, to avoid spending provider quota during health probes. Monitor provider error rate/latency and quota separately. The API uses a 20-connection database pool, 90-second request context, 45-second provider-call timeout, and graceful shutdown. Adjust only after measuring actual workload.

The conversation index returns the latest 200 records; export includes all records. Retrieval currently loads a twin's context and ranks in process. Set operational account/context quotas before opening unrestricted signup. This initial implementation does not provide verified email, password recovery, token revocation, billing, or an admin console.

## Before a release

Run the documented checks; rehearse the database migration; test a real disposable account with the intended Gemini models; validate HTTPS/CORS/CSP; inspect dependency audit results; verify backup restoration; and check responsive layouts in a browser. The local restructure alone is not evidence that those environment-specific checks have passed.

Frontend runtime dependency audit is part of CI. Some development-only lint dependencies may have upstream advisories without compatible fixes; see `docs/VERIFICATION.md` for the observed result. Do not apply forced downgrades/major overrides without rerunning the suite.
