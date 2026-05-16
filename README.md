# MovieMash 2026

Mobile-first pairwise ranking app for fast film taste decisions.

Functional documentation for the current app lives in [`docs/functional-spec.md`](docs/functional-spec.md).

## Commands

- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server.
- `npm run build`: type-check and build the production app.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint.
- `npm run test`: run Vitest unit and integration tests.
- `npm run test:e2e`: build the app and run Playwright browser tests.
- `npm run generate:posters`: regenerate local SVG placeholder poster assets from the frozen catalog.
- `npm run ingest:films`: validate titles and years through TMDb, download local poster files, and update the frozen source. Uses `TMDB_API_KEY` when present, otherwise falls back to TMDb public search pages.

## Current V1 Scope

- Comparison-first route with two film cards and a tie action.
- Drag a card far enough to mark the item as not seen.
- Adaptive Elo-style ranking and short matchup queue.
- IndexedDB persistence through Dexie.
- Separate ranking page with `new`, `settling`, and `stable` tiers.
- Global frozen film catalog with genre metadata and offline poster assets.
- Production service worker for app shell, dataset, and poster caching.

Movie metadata and poster assets are sourced from TMDb during development. This product uses TMDb data but is not endorsed or certified by TMDb.

For GitHub Pages project deployments, set `VITE_BASE_PATH` before building if the app is served from a subpath.

The GitHub Actions Pages workflow sets `VITE_BASE_PATH` automatically from the repository name when deploying from `main`.
