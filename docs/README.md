# Documentation

Guides for Apple’s privacy export and this app’s behavior.

| Doc | Purpose |
|-----|---------|
| [apple-export-format.md](apple-export-format.md) | Schema versions, required columns, ZIP/CSV upload rules, nested `Apple_Media_Services.zip`, optional **Play History Daily Tracks** for headline totals, optional artist enrichment |
| [play-activity-columns.md](play-activity-columns.md) | 2026 export column layout and why per-row artist is often missing |
| [roadmap.md](roadmap.md) | Post-revival ideas (v2) and maintenance notes |

Local scripts (from repo root): `node scripts/inspect-export-headers.mjs …`, `node scripts/list-export-zip-contents.mjs …`, `node scripts/verify-local-export.mjs …` — see the main [README](../README.md).
