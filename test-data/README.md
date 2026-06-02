# Local test data (gitignored except this file)

Drop your Apple privacy export ZIP parts here (any filename is fine), for example:

```text
test-data/
  Apple Media Services Information Part 1 of 2.zip
  Apple Media Services Information Part 2 of 2.zip
```

Apple nests the real data inside `Apple_Media_Services.zip` — the app handles that automatically.

## Verify without the browser

```bash
node scripts/inspect-export-headers.mjs test-data
node scripts/verify-local-export.mjs test-data
```

Do **not** commit real exports — they contain personal listening history.
