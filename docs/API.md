# HTTP API

All JSON is snake_case. Private routes require `Authorization: Bearer <token>`. Errors are `{ "error": "safe user-facing message" }`. Foreign private IDs return 404, malformed IDs 400, missing/invalid auth 401, provider failures 502, rate limits 429. Request bodies are limited to 1 MiB.

## Authentication

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| POST | `/auth/signup` | `{email,password,display_name}` | `{user,token}` (201) |
| POST | `/auth/login` | `{email,password}` | `{user,token}` |
| GET | `/api/me` | — | `{user}` |

Signup passwords must be 10–72 characters and fit bcrypt's byte limit. Emails are normalized to lowercase. JWTs expire after 12 hours and must use HS256 and issuer `ai-twin`. No refresh/revoke endpoint is implemented. Auth routes share a 10 requests/minute/IP limiter.

## Twins

| Method | Path | Response |
| --- | --- | --- |
| GET | `/api/twins` | `{twins: Twin[]}` with samples, newest updated first |
| POST | `/api/twins` | `{twin}` |
| PUT | `/api/twins/:id` | `{twin}` |
| DELETE | `/api/twins/:id` | 204; cascades owned twin data |

Create/edit payload:

```json
{
  "name": "Everyday me",
  "language": "English",
  "style_summary": "Warm, direct, and thoughtful.",
  "sliders": {"humor": 0.5, "formality": 0.3, "empathy": 0.8},
  "samples": [{"text": "A real example of my writing."}]
}
```

Name: 80 characters, purpose: 2,000, samples: 1–10, each at most 4,000. Tone values: 0–1 with only the documented keys. Update replaces samples atomically after all new embeddings succeed. Embeddings are omitted from response/export JSON. Twin writes are limited to 10/minute/account.

## Memories

| Method | Path | Request / response |
| --- | --- | --- |
| GET | `/api/memories?twin_id=:id` | `{memories: Memory[]}` |
| POST | `/api/memories` | payload below → `{memory}` |
| PUT | `/api/memories/:id` | payload below → `{memory}` |
| DELETE | `/api/memories/:id` | 204 |

Payload: `{personality_id,content,tags}`. Content: nonblank, maximum 4,000 characters. Tags: comma-separated text, maximum 200. A memory cannot be moved to another twin. Memory JSON has `id`, `personality_id`, `content`, `tags`, and `created_at`. Writes are limited to 20/minute/account.

## Conversations

| Method | Path | Request / response |
| --- | --- | --- |
| GET | `/api/sessions` | `{sessions: Session[]}`, latest 200, without messages |
| GET | `/api/sessions?twin_id=:id` | latest 200 for an owned twin |
| GET | `/api/sessions/:id` | `{session}` including chronological `messages` |
| PUT | `/api/sessions/:id` | `{title}` → `{session}`; maximum 100 characters |
| DELETE | `/api/sessions/:id` | 204; deletes messages too |
| POST | `/api/chat` | payload below → `{reply,session_id,messages,sources}` |

```json
{"personality_id":"<owned-twin-uuid>","session_id":"","message":"Help me think through an idea."}
```

Omit/empty `session_id` starts a conversation; supplied IDs must exist and match the account and twin. Message: nonblank, maximum 12,000 characters. The response contains exactly the newly persisted user/twin messages. Message metadata stores `{sources:[{id,text,kind,score}]}`; `kind` is `sample` or `memory`. References describe retrieved context, not verified evidence of what the model used. Chat is limited to 30 requests/minute/account and one active request/account/twin/process (409 on overlap). Generation is not streamed.

## Data and health

- `GET /api/export`: `{version:1,user,twins,sessions,memories}`; includes all sessions and their messages, omits password hashes and embedding vectors. No import endpoint.
- `GET /health`: liveness, no auth.
- `GET /ready`: database readiness with a two-second deadline, no auth.

The old `/api/personalities` and `/api/memory` routes are retired. Deploy the new frontend and API together. See the migration guide.
