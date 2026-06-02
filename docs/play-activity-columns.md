# Apple Music Play Activity — column guide (2026 export)

Based on the January 2026 **Apple Media Services** privacy export (~57k rows, **143 columns**). Legacy exports also included a dedicated **`Artist Name`** column; this one does not.

**Related file:** **`Apple Music - Play History Daily Tracks.csv`** (same export folder) includes **`Track Description`** (artist/title text) and **`Play Count`**; the app uses it for headline play totals when you upload the full ZIP. See [apple-export-format.md](apple-export-format.md).

## Where is the artist?

| Field | Role | Useful for track artist? |
|-------|------|-------------------------|
| **Artist Name** | Per-track artist (legacy) | **Absent** in 2026 export |
| **Container Artist Name** | Artist of the *container* (playlist station, artist page) | **Rarely** (~0.02% of rows). When `Container Type` is `ARTIST`, this is the page you browsed, not necessarily the track’s credited artist |
| **Song Name** | Track title | Yes — primary identity |
| **Album Name** | Release title (often `Title - Single`) | Weak — usually does **not** include artist name |
| **Shelf Content Identifier** | Catalog-ish id | **Unreliable** — only ~0.5% of rows; often a playlist label (`Workout`) not a number; numeric ids did not resolve via iTunes `lookup` |
| **Container Name** | Playlist / station name | Context only |
| **Personalized Name** | UI label | Sometimes set; not consistent artist credit |
| **Matched Content** | Empty in samples | No |
| **Play History Daily Tracks → Track Description** | `Artist - Song` in a *different* CSV | **Cannot join** — Play Activity has no `Track Identifier` column |

**Conclusion:** Apple removed per-row artist from Play Activity for many rows. Without extra metadata, those rows show as **Unknown Artist** in the raw CSV path. This app can **optionally** fill many of them via iTunes Search (see [apple-export-format.md](apple-export-format.md)); remaining gaps stay Unknown Artist.

## Column groups (all 143)

### Track & release
Song Name, Album Name, Media Type, Item Type, Media Duration In Milliseconds, Play Duration Milliseconds, Start/End Position In Milliseconds, Grouping, Matched Content, Personalized Name, Pronunciation Displayed, Translation Displayed

### Playback event
Event Type, Event Start/End/Timestamp, Event Received Timestamp, Event ID, End Reason Type, Event Reason Hint Type, Milliseconds Since Play, UTC Offset In Seconds, Offline, Repeat Play, Shuffle Play, Auto Play, Legacy Playback ID

### Container / context (how you reached the track)
Container Type, Container Name, Container Artist Name, Container Album Name, Container ID, Container Playlist ID, Container Origin Type, Container Global Playlist ID, Feature Name, Source Type, Source Model, Source Radio Name/Type, Shelf Content Identifier, Shelf Index, Shelf Type, Referral ID, …

### Device & client
Device Type, Device OS Name/Version, Device App Name/Version, Device Identifier, Client Platform, Client Device Name, Build Version, Bundle Version, Display Type, …

### Location & network
IP City/Region/Country, IP Latitude/Longitude, IP Network, ISO Country, Store Front Name, …

### Subscription & account
Apple ID Number, Apple Music Subscription, Subscription User ID, Subscription Bundle ID, Ownership Type, …

### Audio quality
User’s Audio Quality, User’s Playback Format, Provided Codec, Provided Bit Rate, Provided Playback Format, Is Vocal Attenuation, …

### Radio
Radio Station ID, Radio Format, Radio Type, Is CMA Station, …

### Other telemetry
Evaluation Variant (JSON), Metrics Client ID, Promotion Scenario ID, Report Type, …

## Sample rows

### Typical play (2024, from playlist)

| Field | Value |
|-------|--------|
| Song Name | `stargirl` |
| Album Name | `stargirl - Single` |
| Container Artist Name | *(empty)* |
| Container Type | `PLAYLIST` |
| Container Origin Type | `EDITORIAL_PLAYLIST` |
| Shelf Content Identifier | `6727017221` |
| Play Duration | 174397 ms |

No artist field is populated; album title does not reveal the performer.

### Row with Container Artist Name (2018, artist browse)

| Field | Value |
|-------|--------|
| Song Name | `The Mother We Share` |
| Album Name | `The Bones of What You Believe` |
| Container Artist Name | `CHVRCHES` |
| Container Type | `ARTIST` |

Here **Container Artist Name** matches the band — because you were on CHVRCHES’ artist page, not because Apple stored track-level credit.

## Enrichment in this app

Optional **“Resolve missing artists via iTunes Search”** (checkbox on the upload banner, default on) uses the **iTunes Search API** for up to **500** unique unknown tracks per run (throttled; results cached in `localStorage`). See [apple-export-format.md](apple-export-format.md).
