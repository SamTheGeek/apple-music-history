# Cursor context for this repository

Short index for **Cursor agents** and humans: what to read first and where full documentation lives.

## Rules (`.cursor/rules/`)

| File | Read when |
|------|-----------|
| [rules/stack-and-workflow.md](rules/stack-and-workflow.md) | Node/Vite/Vitest scripts, `dist/` and Netlify deploy, `VITE_*` env vars, git/commit conventions, GPG/sandbox signing notes, minimal-diff style. |
| [rules/data-pipeline-and-privacy.md](rules/data-pipeline-and-privacy.md) | `loadExport.js`, ZIP/multi-part merge, nested ZIPs, Play Activity + optional Daily Tracks, `normalizePlayRow` / `enrichArtists`, `Computation` + `computeTop` worker, fixtures vs `test-data`, privacy. |

Cursor loads these automatically according to your Cursor rules settings; you can also `@`-mention them in chat.

## Repository documentation

- **Project README** (setup, scripts, env table, local export testing): [README.md](../README.md)
- **Guides index** (Apple export format, columns, roadmap): [docs/README.md](../docs/README.md)

## Root pointer for agents

- [AGENTS.md](../AGENTS.md) — one-line convention linking back here.
