# Frontend guide

Read the root `AGENTS.md` first.

- React 19, strict TypeScript, Vite 8, Material UI 9, TanStack Query 5, Lucide icons, react-markdown. The lockfile records exact resolved versions.
- `src/app`: providers, routing, theme, shell. `src/features`: product screens and their local components. `src/lib`: API transport, types, query hooks, formatting. `src/components`: small reusable UI primitives. `src/styles`: shared visual tokens and responsive layout.
- The API client in `src/lib/api.ts` is the only HTTP boundary. API response contracts live in `types.ts`; keep these in sync with Go JSON tags and `docs/API.md`.
- Query keys: `['twins']`, `['sessions']`, `['session', id]`, `['memories', twinId]`. Invalidate the affected keys after mutations. Clear all cached account data when auth changes.
- Auth lives in sessionStorage for this tab; theme is the only account-independent localStorage setting. Never reintroduce the old shared `ai_twin_personality_id`/`ai_twin_session_id` keys.
- Material UI 9 uses `slotProps.htmlInput` for DOM input attributes and `slotProps.input` for component props. Do not use removed `inputProps` or `InputProps` APIs.
- Prefer CSS variables over hardcoded light-only colors. Style files are grouped by screen, with shared tokens in `tokens.css` and breakpoints in `responsive.css`; `global.css` is the import entry point. All screens must work at narrow widths; saved history remains accessible in the mobile conversation picker.
- Do not enable raw HTML in Markdown. Preserve escaping and the renderer's URL safeguards.
- Tests run in Node via Vitest; API tests stub browser storage/fetch. Use the disposable fixture API for visual QA, never real personal data.
- TypeScript 6.0 is pinned to the newest range supported by typescript-eslint. Recheck peer compatibility when upgrading; do not use `--force` or `--legacy-peer-deps`.

Run `npm run format`, then lint, test, and build after changes. `API_PROXY_TARGET` only controls the development proxy; production uses the nginx same-origin API proxy or `VITE_API_URL` at build time.

The primary project workflow lives in `features/projects`, `features/tasks`, and `features/decisions`, with contracts/queries in `lib/workbench-types.ts` and `lib/workbench.ts`. Keys are `['projects']`, `['project', id]`, `['project-memories', id]`, `['tasks', projectId|'all']`, `['task', id]`, and `['decisions', projectId|'all']`. Clear a preview when the objective, task type, or selected IDs change; preserve the request ID after ambiguous failures. A 409 requires refreshed context and a new preview. Pinned memories cannot be unchecked in the task picker. Model output promotion must remain an explicit editable draft, with source-task provenance.
