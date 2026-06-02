# App icon (source)

The only committed artwork for favicons / PWA / MS tiles is **`app-icon.svg`** (1024×1024 viewBox).

`npm run dev`, `npm start`, and `npm run build` run `scripts/rasterize-app-icons.mjs` first, which writes matching PNGs, `favicon.ico`, and a copy as `public/favicon.svg`.
