# Repository Guidelines

## Project Structure & Module Organization
- Root UI: `index.html`, `main.css`, `main.js` (client-only, uses Chart.js + Bootstrap via CDN).
- Data assets: `data.json` (review data), `stopwords_en.json`.
- Tools (Node): `tools/crawler.js` (scrapes), `tools/normalizer.js` (reduces fields). Output expected at project root.
- Node config: `package.json`, `node_modules/`.

## Build, Test, and Development Commands
- Install deps (tools only): `npm install` — installs `dom-parse` for the crawler.
- Run local server: `python3 -m http.server 8000` then open `http://localhost:8000/` (recommended over `file://` so `fetch()` works).
- Scrape reviews: `node tools/crawler.js` (Node 18+ for global `fetch`). Writes progress to `output.json` in the repo root.
- Normalize data: `npm run data` or `node tools/normalizer.js` — reads `output.json` and produces `data.json` used by the UI.
- Tests: `npm test` (currently placeholder).

## Coding Style & Naming Conventions
- Language: modern ES modules; prefer private class fields and `const/let`.
- Indentation: 2 spaces; include semicolons; single quotes or consistent quotes.
- Naming: camelCase for JS, lowercase filenames (e.g., `main.js`), JSON keys in lowerCamelCase.
- Dependencies: front-end via CDN only; avoid bundlers unless discussed.

## Testing Guidelines
- Framework: none yet. If adding tests, use Jest/Vitest for `tools/` and place under `tools/__tests__/` with `*.test.js`.
- Coverage: aim for core logic in normalizer and any new parsing helpers.
- Run: `npm test` once configured.

## Commit & Pull Request Guidelines
- Commits: short, imperative, and scoped (e.g., “Better time chart”, “Filter by score”). Group related changes.
- PRs: clear description, rationale, and steps to verify. Include before/after screenshots for UI changes and link related issues. Keep diffs small and focused.

## Security & Configuration Tips
- Respect target site ToS when scraping; avoid committing raw scraped dumps. Only commit `data.json` (trimmed fields: `body`, `created`, `score`).
- Do not introduce secrets or API keys. Keep paths relative for static hosting.
