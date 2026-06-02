# Data pipeline and privacy

Use this rule when working on parsing, ZIP/CSV handling, play-row shape, artist enrichment, stats, or anything touching user export data.

## Pipeline overview (client-side only)

1. **`src/data/loadExport.js`**
   - Accepts a single CSV, a single ZIP, or **multiple ZIP parts** (Apple sometimes splits downloads). Multi-part uploads **merge ZIP entry maps** then parse with **`parseZipEntries`**.
   - Uses **fflate** to unzip; **`expandNestedZips`** unwraps nested archives (e.g. inner `Apple_Media_Services.zip`) up to a depth cap.
   - Locates every **`Apple Music Play Activity.csv`** (preferring paths under `Apple_Media_Services/Apple Music Activity/`), merges rows if multiple, and optionally **`Apple Music - Play History Daily Tracks.csv`** via `isDailyTracksPath` in `src/data/schema/playHistoryDailyTracks.js`. Parses with PapaParse; validates headers/rows.
2. **`src/data/normalizePlayRow.js`**
   - **`normalizePlayRow` / `normalizePlayRows`** — canonical per-row shape and shared constants (e.g. unknown artist handling).
3. **`src/data/enrichArtists.js`**
   - Optional **iTunes Search API** enrichment for rows missing artist (wired from UI, e.g. `Banner.jsx`).
4. **Heavy stats**
   - **`src/lib/computeTopAsync.js`** — passes **`{ playActivityRows, dailyTrackRows }`** into **`Computation.calculateTop`** on the main thread for smaller datasets; for larger sets uses **`src/workers/computeTop.worker.js`** (Vite `worker.format: 'es'` in `vite.config.js`). When Daily Tracks rows are present, headline totals / top songs / artists / years use **`Play Count`**-weighted daily aggregation; heatmap and skip reasons still use Play Activity.

Related tests live under `src/data/__tests__/` and similar.

## Privacy and repo hygiene

- **Never commit** real Apple privacy exports, personal CSVs, or **`test-data/*.zip`** (or other large binaries from exports). `test-data/` is gitignored except documented placeholders; keep local exports there for manual runs only.
- **Fixtures** for tests and docs belong under **`fixtures/`** (e.g. small CSV samples like `fixtures/play-activity/`) — safe to commit.
- Do not paste **secrets**, **DSNs**, or **user-identifying paths** into rules, commits, or docs.

## Deeper reference

- [docs/apple-export-format.md](../../docs/apple-export-format.md) — schema, ZIP rules, nested archive behavior.
- [docs/play-activity-columns.md](../../docs/play-activity-columns.md) — column reference.
- Local verification scripts (see main [README.md](../../README.md)): `scripts/inspect-export-headers.mjs`, `scripts/list-export-zip-contents.mjs`, `scripts/verify-local-export.mjs`.
