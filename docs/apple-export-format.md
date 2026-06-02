# Apple Music Play Activity export format

This app reads **Apple Music Play Activity.csv** from Apple's privacy export (**Apple Media Services information**). When the same ZIP also contains **`Apple Music - Play History Daily Tracks.csv`**, that file drives **top songs, artists, yearly breakdowns, and headline play totals** (see below). **Play Activity** still powers **skip reasons, hour-of-week heatmap, and day/month charts** built from event timestamps.

## Schema version

**Play Activity:** `2026.2` (`SCHEMA_VERSION` in [`src/data/schema/playActivity.js`](../src/data/schema/playActivity.js)).

**Play History Daily Tracks (optional):** `2026.2` (`DAILY_TRACKS_SCHEMA_VERSION` in [`src/data/schema/playHistoryDailyTracks.js`](../src/data/schema/playHistoryDailyTracks.js)).

When Apple changes column names, update `FIELD_ALIASES` in the matching schema file and bump the version.

## Required columns

CSV headers must include the fields below (after alias resolution). `Artist Name` may be **missing** in newer exports; `Container Artist Name` is then mapped onto the canonical artist field when present. Normalization always fills **`Artist Name`** on each row (see [`normalizePlayRow.js`](../src/data/normalizePlayRow.js)) — using `Container Artist Name` when available, otherwise `Unknown Artist` until optional enrichment runs.

| Column | Used for |
|--------|----------|
| Song Name | Track identity |
| Artist Name | Track identity (legacy exports); derived when absent |
| Container Artist Name | Artist fallback in 2026+ exports when `Artist Name` is omitted |
| Play Duration Milliseconds | Listen time |
| Media Duration In Milliseconds | Skip / partial play |
| Event End Timestamp | Day / month / year buckets |
| Event Start Timestamp | Optional date filter |
| UTC Offset In Seconds | Local hour heatmap |
| End Reason Type | Skip reasons breakdown |
| End Position In Milliseconds | Pause stitching |
| Start Position In Milliseconds | Pause stitching |
| Item Type | Filter non-music |
| Media Type | Filter video |

## How files are loaded (`loadExport.js`)

- **CSV:** A single `Apple Music Play Activity.csv` (any path when unzipped; matching is by filename, case-insensitive).
- **One ZIP:** Unzipped in memory; `expandNestedZips` in [`loadExport.js`](../src/data/loadExport.js) unwraps nested `.zip` entries (for example **`Apple_Media_Services.zip`**) recursively up to **5** levels, then finds Play Activity by path.
- **Multiple ZIP parts:** Entries from each part are merged, then the same lookup runs — use this when Apple splits **Apple Media Services Information Part 1 of N.zip**, etc.

Parsing uses Papa Parse; rows are normalized then validated. See [`loadExport.js`](../src/data/loadExport.js).

### Play History Daily Tracks (optional, in the same ZIP)

If present at `…/Apple Music Activity/Apple Music - Play History Daily Tracks.csv`, the app parses it and uses it for **headline metrics** that align better with **Apple Music Replay**–style “how many times did I play this?” counting than raw Play Activity rows alone:

| Column | Role |
|--------|------|
| Date Played | Bucket by year; optional start-date filter (supports `YYYYMMDD` and ISO dates) |
| Play Duration Milliseconds | Listening time for that daily row |
| Track Description | Parsed into **Song Name** and **Artist Name** (same `Artist - Title` heuristics as common community tools) |
| Play Count | **Plays attributed to that row** (often &gt; 1). Summed into totals and per-song play counts. If missing, each row counts as **1** play. |

**Replay caveat:** Apple Music Replay is a product metric; the privacy export is a separate dataset. Totals should be closer to Replay when **Play Count** is present, but they may still differ.

**Charts caveat:** Calendar month/day views and the hour heatmap still use **Play Activity** semantics (event stream, 8s threshold, filters, pause stitching). They may not sum to the headline **Total plays** from Daily Tracks.

## Inspecting your export

After downloading from [privacy.apple.com](https://privacy.apple.com), place files under `test-data/apple-media-services/` (gitignored) and run:

```bash
node scripts/inspect-export-headers.mjs test-data/apple-media-services
node scripts/list-export-zip-contents.mjs test-data/apple-media-services
```

The first script lists columns, flags missing required fields for Play Activity files, and exits non-zero if the primary CSV is incompatible. **`list-export-zip-contents`** prints every path after nested ZIP expansion (add `--count` for CSV row counts) so you can see which Apple Music CSVs are present.

## ZIP uploads

The browser app accepts:

- A single **Apple Music Play Activity.csv**
- One or more **ZIP parts** from the same export request (merged in memory; see above). The app also reads **`Apple Music - Play History Daily Tracks.csv`** from the expanded archive when present (no extra upload step).

The CSV must appear at any path ending with `Apple Music Play Activity.csv` (case-insensitive).

Apple often nests the real archive as **`Apple_Media_Services.zip`** inside the top-level privacy ZIP. The app unwraps nested ZIPs automatically (up to 5 levels).

### January 2026 export note

Recent exports may **omit the `Artist Name` column** entirely (e.g. 143 columns, tens of thousands of rows). Before enrichment, the app:

1. Uses `Container Artist Name` when present (often sparse on individual plays)
2. Otherwise uses **Unknown Artist** so aggregates still compute

Top songs and play counts stay accurate; artist charts improve when **optional enrichment** runs.

### Optional artist resolution (iTunes Search)

The **“Resolve missing artists via iTunes Search”** checkbox in the upload banner (on by default) calls [`enrichArtists`](../src/data/enrichArtists.js), which:

1. Builds a frequency map of rows whose artist is still `Unknown Artist`
2. Takes the **500** most-played unique `(Song Name, Album Name)` keys (configurable via `maxLookups`)
3. For each key not already in cache, calls the public **iTunes Search API** (with ~**120 ms** delay between network lookups)
4. Persists results in **`localStorage`** (see `artistCache.js`) and rewrites matching **Play Activity** rows before stats (Daily Tracks artists come from **Track Description** when that file is used for totals)

Unmatched or failed lookups stay **Unknown Artist**. Results are best-effort (search ambiguity, rate limits). See [play-activity-columns.md](play-activity-columns.md) for why the CSV often lacks a per-track artist.

## Exporting computed stats (in the browser)

After the report loads, the dashboard includes **JSON** and **CSV** export buttons. Files contain **aggregated** top songs and artists (and optional “this year” summaries), reflecting the same exclusions you set in the **All Songs** table. Row lists are capped (currently **500** per list) to keep downloads small.

**Privacy:** Export files are built entirely in your browser from data already in memory — nothing is uploaded when you download them.

## Tests

Synthetic fixtures live in [`fixtures/play-activity/`](../fixtures/play-activity/) (no real listening data). Run:

```bash
npm test
```
