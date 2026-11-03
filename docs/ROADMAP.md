# Next product and engineering steps

These are planned, not implemented features.

## Public beta requirements

1. Verified email and password recovery; account deletion with a documented retention policy.
2. HttpOnly cookie sessions, CSRF protection, refresh/revocation, and server-side session management.
3. Per-account token/context quotas, edge rate limits, and provider-cost observability.
4. Reviewed, versioned SQL migrations and restore drills; expand the new disposable PostgreSQL CI suite with legacy-data upgrade and concurrency tests.
5. Persisted chat idempotency and distributed locking before horizontal scaling.

## Useful product additions

- Conversation folders, pinning, and server-side full-text search with cursor pagination.
- User-approved memory suggestions, with an explicit review queue and provenance.
- Document ingestion with size/type limits, per-file consent, chunking, and a deletion lifecycle.
- Streaming replies with cancellation and explicit partial-message semantics.
- Reusable writing templates and side-by-side tone previews.
- Import of the versioned workspace export after validation and conflict resolution.
- Live research with source retrieval times and evidence snapshots, kept separate from saved memory claims.
- Deterministic memory conflict resolution and user-approved cross-project context suggestions.
- Optional review reminders; current review dates are flags rather than scheduled notifications.

## Scale

Move retrieval to pgvector with measured relevance thresholds and embedding-version metadata. Add reindex jobs before introducing another embedding model. Add metrics/tracing that omit personal content, shared limits, budget controls, and a provider abstraction with verified fallbacks rather than silent model substitution.
