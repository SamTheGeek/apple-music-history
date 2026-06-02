# Local test data (gitignored except this file)

Use this folder for **real** Apple privacy exports while developing. **Do not commit** ZIPs or CSVs — they contain personal listening history.

## Layout

Recommended (also gitignored via `test-data/apple-media-services/`):

```text
test-data/
  apple-media-services/
    Apple Media Services Information Part 1 of 2.zip
    Apple Media Services Information Part 2 of 2.zip
```

You can instead place ZIP parts **directly under `test-data/`**; the helper scripts take a directory and scan for `.zip` files in that directory only (not subfolders).

Apple nests the real archive as **`Apple_Media_Services.zip`** inside the privacy ZIP — the app and `verify-local-export` unwrap that automatically.

## Verify without the browser

From the **repository root** (Node 24):

```bash
node scripts/inspect-export-headers.mjs test-data/apple-media-services
node scripts/list-export-zip-contents.mjs test-data/apple-media-services
node scripts/verify-local-export.mjs test-data/apple-media-services
```

Use `test-data` instead of `test-data/apple-media-services` if your ZIPs sit at the top level.

- **inspect-export-headers** — walk directories, print `SCHEMA_VERSION`, validate Play Activity headers.
- **list-export-zip-contents** — merge ZIP parts like the app, list expanded paths, peek CSV headers (optional `--count` for row counts).
- **verify-local-export** — merge ZIP parts, expand nested ZIPs, parse Play Activity and optional Daily Tracks, run `Computation` and print activity-only vs merged totals.

See [docs/apple-export-format.md](../docs/apple-export-format.md) and the main [README](../README.md).
