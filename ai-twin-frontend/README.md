# Twin frontend

React 19 + strict TypeScript, Material UI 9, TanStack Query, Vite 8, and Vitest. Read the [repository README](../README.md) and [development guide](../docs/DEVELOPMENT.md) for setup.

```text
npm ci
npm run dev
npm run format
npm run lint
npm test
npm run build
```

`VITE_API_URL` defaults to same-origin. During development, Vite proxies `/api` and `/auth` to `http://localhost:8080`, overridable with `API_PROXY_TARGET`. Never expose private keys through Vite variables.

Read [AGENTS.md](AGENTS.md) before edits. Feature code lives in `src/features`, app composition in `src/app`, shared contracts/transport in `src/lib`, and visual tokens in `src/styles`.
