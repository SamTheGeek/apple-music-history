[![Netlify Status](https://api.netlify.com/api/v1/badges/8b888380-b867-4870-91c8-04ebdf823036/deploy-status)](https://app.netlify.com/sites/awesome-agnesi-2f5b8f/deploys)

# [Apple Music History](https://music.samthegeek.net)

A client-side React app that analyzes your Apple Music listening history from Apple's privacy export. **Your data never leaves your browser** — parsing and stats run locally.

Originally by [Pat Murray](https://patmurray.co/projects/apple-music-analyser/); maintained by [Sam Gross](https://samthegeek.net).

## Download your data

1. Go to [privacy.apple.com](https://privacy.apple.com) and sign in.
2. Choose **Request a copy of your data**.
3. Select **Apple Media Services information** (includes Apple Music).
4. Submit the request and wait for Apple's email (often 1–7 days).
5. Download all ZIP parts when ready.

Inside the archive, the file this app uses is:

`Apple_Media_Services/Apple Music Activity/Apple Music Play Activity.csv`

(Exact folder names may vary slightly by export date.)

## Using the app

1. Open the site or run locally (see below).
2. Optionally set a **start date** to limit the report.
3. Upload **Apple Music Play Activity.csv** or the **full Apple Media Services ZIP** (select all parts if split).
4. Wait for parsing and stats — large exports may take a minute.

## Getting started (development)

Requires **Node.js 24** (Active LTS). See `.nvmrc`.

### Using NVM

```bash
cd apple-music-history
nvm install    # reads .nvmrc → installs Node 24 if needed
nvm use        # switches your shell to Node 24
node -v        # should print v24.x.x
npm install
npm start
```

If `nvm use` says the version is not installed, run `nvm install 24` once, then `nvm use` again. Add a [shell hook](https://github.com/nvm-sh/nvm#calling-nvm-use-automatically-in-a-directory-with-a-nvmrc-file) to auto-switch when you `cd` into this repo.

```bash
git clone https://github.com/SamTheGeek/apple-music-history.git
cd apple-music-history
nvm use
npm install
npm start
```

Dev server: [http://localhost:5173](http://localhost:5173)

```bash
npm test          # unit tests
npm run build     # production build → dist/
npm run preview   # preview production build
```

Deploy the **`dist/`** folder (e.g. Netlify).

### Local export testing

Place your privacy export under `test-data/apple-media-services/` (gitignored), then:

```bash
node scripts/inspect-export-headers.mjs test-data/apple-media-services
```

See [docs/apple-export-format.md](docs/apple-export-format.md) for schema details and how to handle column changes.

Column reference for the 2026 export (no `Artist Name`): [docs/play-activity-columns.md](docs/play-activity-columns.md).

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SENTRY_DSN` | Optional Sentry DSN; omit to disable error reporting |
| `VITE_PUBLIC_URL` | Base URL for deployed assets (default `/`) |
