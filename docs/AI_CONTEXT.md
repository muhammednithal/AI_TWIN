# AI context: Twin workspace

## Product

Twin is a private personal AI workspace: a place to think through ideas, draft in your own voice, and retain useful context. It is an AI companion, not an autonomous impersonation service. A user creates one or more twins with a name, language, purpose, tone controls, and writing samples. Each twin has its own curated memories and saved conversations.

## Implemented on `prod`

- Email/password authentication, bcrypt password hashes, 12-hour issuer-bound HS256 JWTs, account-scoped resources, request limits.
- Overview with real twin/session counts, recent conversations, and quick actions.
- Multiple twins: create, edit, delete, search; three purpose presets; humor/formality/empathy controls; 1–10 writing samples.
- Persistent conversations: history, title generation from the first message, rename/delete, Markdown replies, copy, Markdown download, mobile history selector.
- Context retrieval: cosine ranking of the twin's samples and memories, top five context references, last 12 messages. References are visible as retrieved context, not claims of attribution.
- Memories: explicit create/edit/delete, tags, per-twin browsing, text/tag search. Nothing is inferred and saved automatically.
- Light/dark theme, responsive navigation, pending states, retry/error handling, account data export.
- Additive schema migration command, container definitions, CI, tests, and package-specific agent guides.

## Source map

| Concern | Start here |
| --- | --- |
| Routing, providers, theme | `ai-twin-frontend/src/app/App.tsx` |
| Navigation | `ai-twin-frontend/src/app/Shell.tsx` |
| Browser/API boundary | `ai-twin-frontend/src/lib/api.ts` and `types.ts` |
| UI screens | `ai-twin-frontend/src/features/<feature>/` |
| Design tokens and responsive rules | `ai-twin-frontend/src/styles/tokens.css`, `responsive.css`; `global.css` imports the feature styles |
| Backend composition / migration | `backend/cmd/server/main.go` |
| HTTP contracts / middleware | `backend/internal/workspace/api.go` |
| Models / table compatibility | `backend/internal/workspace/models.go` |
| Chat retrieval and persistence | `backend/internal/workspace/chat.go` |
| Gemini transport | `backend/internal/platform/ai/gemini.go` |
| Environment validation | `backend/internal/platform/settings/settings.go` |

## Boundaries and limitations

No email verification, password recovery, refresh tokens, billing, file ingestion, voice, tools, autonomous actions, streaming, vector database, or automatic memory extraction. Token sign-out clears this tab; it does not revoke an already issued token. Production uses HTTPS at an external reverse proxy. Rate limiting and request deduplication are in-process and require shared infrastructure before multiple API replicas. The conversation index currently returns the latest 200 sessions; workspace export includes all conversations. Search filters loaded records. Retrieval scans the selected twin's vectors in memory.

Existing databases require backup and migration rehearsal. The restructure changes API routes and memory JSON casing; old clients must be upgraded together. Live Gemini behavior and real database migration need separate integration verification. Consult `docs/ROADMAP.md` for planned improvements rather than describing them as shipped.

## Documentation order

`AGENTS.md` → this file → `ARCHITECTURE.md` → package guide → `API.md` / `DEVELOPMENT.md`. For releases, read `MIGRATION.md` and `DEPLOYMENT.md`.
