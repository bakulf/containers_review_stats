# Container Reviews Dashboard

Interactive, client-only dashboard to explore user reviews for Mozilla’s Multi‑Account Containers browser extension. The UI loads a trimmed `data.json` dataset and renders charts and lists using Chart.js and Bootstrap (via CDN). A small Node-based toolchain can scrape the source site and normalize data.

## Quick Start

1) Install tool dependencies (crawler only):

```bash
npm install
```

2) Serve the static site (so `fetch()` works):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/
```

You should see summary cards, charts, a tag cloud, and a paginated list of review messages. The UI expects a `data.json` file at the repo root (already included). You can regenerate it using the data pipeline below.

## Data Pipeline

- Source: Add-on review pages on AMO for the Multi‑Account Containers extension.
- Crawler: `tools/crawler.js` (Node 18+ for global `fetch`). Scrapes reviews across pages and writes a raw dump to `output.json`.
- Normalizer: `tools/normalizer.js` reduces the raw dump to the minimal fields used by the UI and writes `data.json`.

Commands:

```bash
# Scrape (writes output.json at project root)
node tools/crawler.js

# or via npm script
npm run crawl

# Normalize (reads output.json -> writes data.json)
node tools/normalizer.js
# or
npm run data
```

Normalized schema written to `data.json`:

```json
[
  {
    "body": "string | null",
    "created": "YYYY-MM-DDTHH:mm:ssZ",
    "score": 1
  }
]
```

Notes:
- `output.json` is ignored by git; do not commit raw dumps.
- Respect the target site’s Terms of Service. Scraping can change/break.
- If you rerun the crawler often, consider adding backoff or pauses.

## Project Structure

- Root UI: `index.html`, `main.css`, `main.js` (client-only; Chart.js + Bootstrap via CDN)
- Data assets: `data.json` (UI input), `stopwords_en.json` (tag cloud)
- Tools (Node): `tools/crawler.js`, `tools/normalizer.js`
- Node config: `package.json`, `node_modules/`

## Scripts

```bash
# Start static server on :8000 (recommended for local dev)
npm run start
# or
npm run serve

# Scrape and normalize data
npm run crawl
npm run data

# Placeholder tests
npm test
```

## Development

- Runtime: Client-only, no bundler/build. Keep front-end deps via CDN.
- Language: Modern ES modules; prefer `const`/`let` and 2-space indentation.
- Browser support: Tested with modern Chromium/Firefox.
- Node version: 18+ (crawler relies on global `fetch`).
- Static hosting: Any static host works (ensure `data.json` is present at site root).

## Charts & Features

- Review by rate: Bar chart of counts by score.
- Reviews by time: Line chart, switchable day/month/year scale.
- Messages by language: Heuristic classifier using tiny stopword lists.
- Tag cloud: Frequency-based sizing with English stopwords (`stopwords_en.json`).
- Messages list: Filter by score, paginate, and export CSV.

## Testing

`npm test` is currently a placeholder. If adding tests, prefer Jest or Vitest under `tools/__tests__/` with `*.test.js`, focusing on the normalizer and any parsing helpers.

## Contributing

- Commits: Keep short, imperative, and scoped (e.g., “Filter by score”).
- PRs: Describe rationale, how to verify, and include screenshots for UI changes. Keep diffs small and focused.

## Security & Data Hygiene

- Avoid committing raw scraped dumps; only commit trimmed `data.json`.
- Do not add secrets or API keys. Keep paths relative for static hosting.

## Troubleshooting

- Blank UI or network errors: Ensure you’re serving via `http://localhost:8000/` rather than opening `index.html` with `file://`.
- Missing charts/data: Confirm `data.json` exists at the repo root and is valid JSON.
- Crawler errors: Use Node 18+; site structure may change.

