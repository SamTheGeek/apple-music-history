[![Netlify Status](https://api.netlify.com/api/v1/badges/8b888380-b867-4870-91c8-04ebdf823036/deploy-status)](https://app.netlify.com/sites/awesome-agnesi-2f5b8f/deploys)

# [Apple Music History](https://music.samthegeek.net)

A client-side React app that analyzes your Apple Music listening history from Apple's privacy export. **Your data never leaves your browser** — parsing and stats run locally.

**Stack:** Node.js 24, **Vite 8**, **React 19**, Bootstrap 5, Chart.js, Vitest. Originally by Pat Murray; maintained by [Sam Gross](https://samthegeek.net).

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

1. Open [the live site](https://music.samthegeek.net) or run locally (see below).
2. Optionally set a **start date** to limit the report.
3. Upload **Apple Music Play Activity.csv** or the **full Apple Media Services ZIP** (select all parts if Apple split the download).
4. Optionally leave **“Resolve missing artists via iTunes Search”** enabled (default) so tracks without an artist in the CSV can be labeled from Apple’s public search API (see [docs/apple-export-format.md](docs/apple-export-format.md)).
5. Wait for parsing and stats — large exports may take a minute.

## Documentation

All guides live under **[docs/](docs/)** (start at [docs/README.md](docs/README.md)):

- [docs/apple-export-format.md](docs/apple-export-format.md) — schema version, ZIP + CSV behavior, nested `Apple_Media_Services.zip`, enrichment
- [docs/play-activity-columns.md](docs/play-activity-columns.md) — 2026 column reference
- [docs/roadmap.md](docs/roadmap.md) — future ideas and maintenance

## Getting started (development)

Requires **Node.js 24** (Active LTS). See `.nvmrc`.

**Local dev:** `npm run dev` starts Vite with [`--host`](https://vite.dev/config/server-options.html#server-host) so you can open the app from other devices on your LAN. Use `npm start` for the same dev server bound only to localhost (no LAN). Stop the server with **Ctrl+C** in the terminal.

### Using NVM

```bash
cd apple-music-history
nvm install    # reads .nvmrc → installs Node 24 if needed
nvm use        # switches your shell to Node 24
node -v        # should print v24.x.x
npm install
npm run dev
```

If `nvm use` says the version is not installed, run `nvm install 24` once, then `nvm use` again. Add a [shell hook](https://github.com/nvm-sh/nvm#calling-nvm-use-automatically-in-a-directory-with-a-nvmrc-file) to auto-switch when you `cd` into this repo.

```bash
git clone https://github.com/SamTheGeek/apple-music-history.git
cd apple-music-history
nvm use
npm install
npm run dev
```

### Local testing

The dev server listens on **[http://localhost:5173](http://localhost:5173)** by default (Vite’s default port). With `npm run dev`, Vite also prints a **Network** URL you can use from phones or other machines on the same Wi‑Fi. Press **Ctrl+C** in the terminal to stop the dev server.

```bash
npm test              # Vitest unit tests
npm run build         # production bundle → dist/
npm run preview       # after build: serve dist/ locally (default http://localhost:4173)
```

Deploy the contents of **`dist/`** (for example Netlify builds from this repo and publishes `dist/`).

### Deploying to Netlify

1. In the [Netlify dashboard](https://app.netlify.com), open your **Site** for this repo.
2. Go to **Site configuration** → **Environment variables** (or **Build & deploy** → **Environment**).
3. Add **`VITE_SENTRY_DSN`** with your Sentry project’s **browser DSN** as the value. Scope it to **Production** and, if you use them, **Branch deploy** previews where you want error reporting.
4. **Deploy** → **Trigger deploy** → **Clear cache and deploy site** (or push a commit) so Netlify runs a fresh `npm run build`. Vite replaces `import.meta.env.VITE_*` at **build time**; changing env vars without rebuilding leaves the old bundle unchanged.

See also [.env.example](.env.example) for local copies of the same variables.

### Local export testing

Put your privacy export ZIP parts under `test-data/apple-media-services/` (recommended; that path is gitignored), or directly under `test-data/` if you prefer. Then:

```bash
node scripts/inspect-export-headers.mjs test-data/apple-media-services
node scripts/verify-local-export.mjs test-data/apple-media-services
```

`inspect-export-headers` lists columns and validates headers. `verify-local-export` expands nested ZIPs, parses Play Activity, and runs the same stats path as the app — useful before opening the browser.

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SENTRY_DSN` | Optional Sentry DSN; omit to disable client error reporting |
| `VITE_PUBLIC_URL` | Base URL for deployed assets (default `/`) |
