# Apple Music Play Activity export format

This app reads **Apple Music Play Activity.csv** from Apple's privacy export (**Apple Media Services information**).

## Schema version

Current in-app schema: see `SCHEMA_VERSION` in [`src/data/schema/playActivity.js`](../src/data/schema/playActivity.js).

When Apple changes column names, update `FIELD_ALIASES` in that file and bump `SCHEMA_VERSION`.

## Required columns

| Column | Used for |
|--------|----------|
| Song Name | Track identity |
| Artist Name | Track identity (legacy exports) |
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

## Inspecting your export

After downloading from [privacy.apple.com](https://privacy.apple.com), place files under `test-data/apple-media-services/` (gitignored) and run:

```bash
node scripts/inspect-export-headers.mjs test-data/apple-media-services
```

The script lists columns, flags missing required fields for Play Activity files, and exits non-zero if the primary CSV is incompatible.

## ZIP uploads

The browser app accepts:

- A single **Apple Music Play Activity.csv**
- One or more **ZIP parts** from the same export request (merged in memory)

The CSV must appear at any path ending with `Apple Music Play Activity.csv` (case-insensitive).

Apple often nests the real archive as **`Apple_Media_Services.zip`** inside the top-level privacy ZIP. The app unwraps nested ZIPs automatically (up to 5 levels).

### January 2026 export note

Recent exports may **omit the `Artist Name` column** entirely (143 columns, ~57k rows). The app:

1. Uses `Container Artist Name` when present (usually rare on individual plays)
2. Otherwise labels artists as **Unknown Artist** so stats still compute

Top songs and play counts remain accurate; artist leaderboards need **optional enrichment**.

### Optional artist resolution

Enable **“Resolve missing artists via iTunes Search”** on the upload screen (on by default). The app:

1. Finds unique tracks still labeled `Unknown Artist`
2. Looks up the **500 most-played** (by row count in your file) via the public iTunes Search API
3. Caches results in `localStorage` for repeat visits
4. Re-labels matching rows before stats run

This is approximate (search ambiguity, rate limits) but restores meaningful **Top Artists**. See [play-activity-columns.md](play-activity-columns.md) for why the CSV no longer includes artist.

## Tests

Synthetic fixtures live in [`fixtures/play-activity/`](../fixtures/play-activity/) (no real listening data). Run:

```bash
npm test
```
