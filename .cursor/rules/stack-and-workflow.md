# Stack, tooling, deploy, and workflow

Use this rule when changing build config, scripts, CI, deployment, or editor-facing workflow.

## Runtime and stack

- **Node.js:** 24+ (`engines` in `package.json`, `.nvmrc`). Not Create React App — this is a **Vite 8** SPA with **React 19**.
- **Bundler / dev:** Vite (`vite.config.js`). **Vitest 4** for unit tests (`vite.config.js` `test` block).

## npm scripts (from repo root)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server with `--host` (LAN-friendly). |
| `npm start` | Vite dev server, localhost only. |
| `npm run build` | Production bundle → `dist/`. |
| `npm run preview` | Serve `dist/` locally after a build. |
| `npm test` | `vitest run` (CI-style). |
| `npm run test:watch` | Vitest watch mode. |

## Deploy and env

- **Output:** `npm run build` writes **`dist/`** — that is what gets published (e.g. Netlify builds from this repo and publishes `dist/`).
- **Vite env (build-time):**
  - `VITE_SENTRY_DSN` — optional client Sentry DSN; omit to disable error reporting.
  - `VITE_PUBLIC_URL` — asset base URL (see `vite.config.js` `base`; default `/`).

## Git and signing

- **Do not create git commits** unless the user explicitly asks (project/user convention).
- Commits signed with **GPG via 1Password** (or similar) may fail in restricted or sandboxed environments that lack the full signing agent. If signing errors appear, the user may need to run the commit locally outside the sandbox with their normal shell environment.

## Change style

- Match existing file patterns, naming, and formatting in touched areas.
- Prefer **minimal, focused diffs** unless the task explicitly calls for a broader refactor.

## Human-oriented docs

- Repo overview and setup: [README.md](../../README.md).
- Export format, columns, roadmap: [docs/](../../docs/) (index: [docs/README.md](../../docs/README.md)).
