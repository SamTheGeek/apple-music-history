# Roadmap

Future work beyond the 2026 revival. Items are sourced from repo history and prior designs, not committed timelines.

## v2 — Data exploration

### SQL explorer

The `database` branch prototyped an in-browser SQL panel using **alasql** and **react-json-view** (`Querier.jsx`). Users could run queries like `SELECT * FROM ? LIMIT 5` against normalized play rows.

**Proposal:** Reintroduce as an optional “Advanced” panel using duckdb-wasm or alasql on normalized rows only. Everything stays client-side.

### Multi-CSV bundle

Apple's export now includes several Apple Music files, for example:

- Apple Music Play Activity.csv (supported today)
- Apple Music - Play History Daily Tracks.csv
- Apple Music - Recently Played Tracks.csv

**Proposal:** Let users pick a primary source or merge complementary fields (e.g. impressions + plays).

### Artist enrichment v2

**v1 (shipped in 2026 revival):** iTunes Search for up to **500** unknown unique `(song, album)` keys (row-weighted by play count), ~**120 ms** between requests, **`localStorage`** cache — see `enrichArtists.js`. Rows that still miss a match remain **Unknown Artist**; there is no permanent “stuck” state beyond opting out or clearing cache.

**Future improvements:**

- Join **Play History Daily Tracks** if Apple adds a shared key to Play Activity
- Batch **MusicKit** / catalog API by `Shelf Content Identifier` when ids are numeric and valid
- Background enrichment for all ~16k unique songs with pause/resume
- User-editable artist overrides for mis-matched search results

### Genre and discovery analytics

Pat Murray's [Medium write-up](https://medium.com/swlh/apple-music-activity-analyser-part-1-dd02173f095f) planned enrichments from `Source Type`, `Feature Name`, and related columns already present in Play Activity.

**Proposal:** Charts for “how you find music” without requiring extra CSVs first.

## v2 — Export and integrations

### ListenBrainz / Last.fm export

Community tools such as [Apple-Music-Play-History-Converter](https://github.com/nerveband/Apple-Music-Play-History-Converter) export to scrobble formats.

**Proposal:** Optional “Export top plays” CSV/JSON for external tools.

## Declined / out of scope

### Server-side database

The `database` branch explored server-backed storage. The product positioning is **privacy-first, browser-only** — no upload to a backend.

### Lyrics view counts

`Computation.js` once counted `Event Type === "LYRIC_DISPLAY"`. That path was removed from the UI because lyric events are sparse and not consistently labeled across export versions.

## v2 — UI

- Dark mode (CSS variables + `prefers-color-scheme`)
- Stronger visual identity (reduce Bootstrap dependency)
- Playwright E2E: upload fixture ZIP → assert top song heading

## Maintenance

- After each new Apple export you download, run `scripts/inspect-export-headers.mjs`
- If columns changed, extend `FIELD_ALIASES` and add a fixture row to `fixtures/play-activity/`
- Bump `SCHEMA_VERSION` and note the change in this doc
