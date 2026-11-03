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

- `GET /api/export`: `{version:2,user,twins,sessions,memories,projects,project_memories,tasks,decisions}`; includes all records, task input snapshots, and conversation messages; omits password hashes, context signing tokens, and embedding vectors. Context-pack file import is not implemented.
- `GET /health`: liveness, no auth.
- `GET /ready`: database readiness with a two-second deadline, no auth.

The old `/api/personalities` and `/api/memory` routes are retired. Deploy the new frontend and API together. See the migration guide.

## Projects and typed memories

| Method | Path | Request / response |
| --- | --- | --- |
| GET | `/api/projects` | `{projects}`; includes active-memory and all-task counts |
| POST | `/api/projects` | `{name,purpose,instructions,archived}` → `{project}` |
| GET | `/api/projects/:id` | `{project}` |
| PUT | `/api/projects/:id` | full editable fields → `{project}` |
| GET | `/api/projects/:id/memories` | `{memories}`, including archived notes |
| POST | `/api/projects/:id/memories` | memory input → `{memory}` |
| PUT | `/api/projects/:id/memories/:memoryID` | full memory input → `{memory}` |
| POST | `/api/projects/:id/import-twin-memories` | `{twin_id,memory_ids,kind}` → `{imported,already_present_or_empty}` |

Project name: 100 characters, purpose: 3,000, standing instructions: 4,000. Archiving preserves history and blocks task previews/new runs, memory changes/imports, and journal writes until restored. Existing task results can still be reviewed and matching completed requests replayed. No project hard-delete endpoint.

Memory input: `{title,kind,content,tags,source,source_task_id?,pinned,archived,review_on}`. Title: 120 characters; kind: `fact|preference|research|instruction|decision`; content: nonblank, maximum 4,000; tags: 200; source: 500; review date: empty or `YYYY-MM-DD`. Every edit increments `version`. Source-task IDs must refer to a task owned by the same account in this project. Source URLs are recorded text, never fetched. Memory storage does not call Gemini.

Import accepts 1–30 IDs belonging to an owned twin and a valid memory kind. It copies rather than moves, preserves source provenance, and never overwrites an existing imported project copy on retry. Oversized legacy content must be shortened before import.

## Task context and execution

`POST /api/projects/:id/context` accepts:

```json
{"objective":"Compare the supplied options using my criteria.","kind":"compare","memory_ids":["<selected-project-memory-uuid>"]}
```

Returns `{context,preview_token}`. Kinds: `analyze|compare|plan|draft`. Objective: nonblank, maximum 12,000 characters. The manifest includes the project brief/instructions, labeled selected memories, all active pinned memories, source text, versions, timestamps, and freshness warnings. At most 30 total memories; unavailable/archived/foreign selections or oversized pinned context are rejected rather than silently dropped. Empty selection is allowed and explicitly warns that the project brief is the only context.

`POST /api/projects/:id/tasks` accepts the same input plus `preview_token` and a nonzero UUID `request_id`. Generation requires a matching context preview; changes return 409. After generation, a parent-row-locked transaction revalidates the context before writing. Provider failures return 502 without saving a task. Runs are limited to 20/minute/account and one active run/project/account/process.

Success: `{task}` (201 for new runs; 200 for idempotent replay). Reusing the request ID with a different project, objective, kind, or confirmation token returns 409. Preserve the request ID on network retries. The result and `context_snapshot` are immutable; only the review fields change. The provider has no live browsing, market data, or external execution tools.

| Method | Path | Request / response |
| --- | --- | --- |
| GET | `/api/tasks?project_id=:id` | `{tasks}`, latest 200 summaries; project filter optional |
| GET | `/api/tasks/:taskID` | `{task}` with full result and context snapshot |
| PUT | `/api/tasks/:taskID/review` | `{status,review_notes}` → `{task}` |

Review status: `needs_review|accepted|dismissed`; notes: maximum 4,000 characters. An accepted result is a user review marker, not execution authorization or verified factual status.

## Decision journal

| Method | Path | Request / response |
| --- | --- | --- |
| GET | `/api/decisions?project_id=:id` | `{decisions}`, latest 200; project filter optional |
| POST | `/api/projects/:id/decisions` | decision input → `{decision}` |
| PUT | `/api/projects/:id/decisions/:decisionID` | full decision input → `{decision}` |

Input: `{title,choice,reasoning,assumptions,outcome,status,review_on,task_id?}`. Title: 120 characters; choice required; text fields: maximum 4,000 each. Status: `considering|decided|closed`; review date: empty or `YYYY-MM-DD`. A supporting task must belong to the same account/project. Outcomes are user-recorded and are never silently promoted into memory. Review dates are UI flags, not scheduled reminders.
