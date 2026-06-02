# Apple Music Play Activity export format

This app reads **Apple Music Play Activity.csv** from Apple's privacy export (**Apple Media Services information**).

## Schema version

**Current in-app value:** `2026.2` (`SCHEMA_VERSION` in [`src/data/schema/playActivity.js`](../src/data/schema/playActivity.js)).

When Apple changes column names, update `FIELD_ALIASES` in that file and bump `SCHEMA_VERSION`.

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

## Inspecting your export

After downloading from [privacy.apple.com](https://privacy.apple.com), place files under `test-data/apple-media-services/` (gitignored) and run:

```bash
node scripts/inspect-export-headers.mjs test-data/apple-media-services
```

The script lists columns, flags missing required fields for Play Activity files, and exits non-zero if the primary CSV is incompatible.

## ZIP uploads

The browser app accepts:

- A single **Apple Music Play Activity.csv**
- One or more **ZIP parts** from the same export request (merged in memory; see above)

The CSV must appear at any path ending with `Apple Music Play Activity.csv` (case-insensitive).

Apple often nests the real archive as **`Apple_Media_Services.zip`** inside the top-level privacy ZIP. The app unwraps nested ZIPs automatically (up to 5 levels).

### January 2026 export note

Recent exports may **omit the `Artist Name` column** entirely (e.g. 143 columns, tens of thousands of rows). Before enrichment, the app:

1. Uses `Container Artist Name` when present (often sparse on individual plays)
2. Otherwise uses **Unknown Artist** so aggregates still compute

Top songs and play counts stay accurate; artist charts improve when **optional enrichment** runs.

### Optional artist resolution

The **“Resolve missing artists via iTunes Search”** checkbox in the upload banner (on by default) calls [`enrichArtists`](../src/data/enrichArtists.js), which:

1. Builds a frequency map of rows whose artist is still `Unknown Artist`
2. Takes the **500** most-played unique `(Song Name, Album Name)` keys (configurable via `maxLookups`)
3. For each key not already in cache, calls the public **iTunes Search API** (with ~**120 ms** delay between network lookups)
4. Persists results in **`localStorage`** (see `artistCache.js`) and rewrites matching rows before stats

Unmatched or failed lookups stay **Unknown Artist**. Results are best-effort (search ambiguity, rate limits). See [play-activity-columns.md](play-activity-columns.md) for why the CSV often lacks a per-track artist.

## Tests

Synthetic fixtures live in [`fixtures/play-activity/`](../fixtures/play-activity/) (no real listening data). Run:

```bash
npm test
```
