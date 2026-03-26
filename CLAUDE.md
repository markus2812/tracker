# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev mode (run both in parallel)
npm run api          # starts Node.js API on port 3210
npm run dev:host     # starts Vite frontend on port 5173 (proxies /api → 3210)

# Dev with auto-restart
npm run api:watch    # node --watch variant

# Production (single process)
npm run build        # tsc + vite build → dist/
npm run serve        # serves API + static dist on port 3210

# Lint
npm run lint
```

No test suite exists in this project.

## Architecture

This is a **PWA habit/state tracker** with two runtimes that share one SQLite database.

### Frontend (`src/`)

- **React 19 + TypeScript + Vite**, single-page app, no router — tabs are managed via `useState` in `App.tsx`.
- **Four screens**: `today`, `dashboard`, `heatmap`, `settings` — each is a feature folder under `src/features/`.
- **Local-first**: all state is persisted to **IndexedDB** via Dexie (`src/lib/db.ts`, table name `reset-db`). Writes go to IndexedDB first; server sync is best-effort.
- **Drafts**: edits are immediately saved as drafts in IndexedDB (`drafts` table) and auto-persisted to the server after 850ms debounce (when `settings.autosave` is on). Drafts are cleared once successfully persisted.
- **Sync flow** (`src/lib/sync.ts`): on hydration, `App.tsx` calls `syncWithServer()` which merges local + remote entries using last-write-wins by `updatedAt`. Entries only in local → uploaded; entries only in remote → downloaded. Settings merge: local wins.
- **Schema** (`src/lib/schema.ts`): single source of truth for `DailyEntry`, `Settings`, `AppSession` types — defined with Zod, shared with `server/schema.mjs` (duplicated, not imported across).
- **API base URL** is stored in `localStorage` via `src/lib/api-config.ts`; defaults to `/api` (relative, works through Vite proxy in dev or through the unified server in prod).

### Backend (`server/`)

Plain **Node.js `http.createServer`**, no framework. Uses `node:sqlite` (Node ≥22 built-in).

- `db.mjs` — SQLite operations. Entries stored as JSON blobs in `payload` column, indexed by `date TEXT PRIMARY KEY`. WAL mode enabled.
- `schema.mjs` — same Zod schemas as frontend (duplicated intentionally for zero shared build step).
- `index.mjs` — HTTP router + static file serving. In prod, serves `dist/` for non-`/api` paths (SPA fallback to `index.html`).
- `telegram.mjs` — optional Telegram bot via long-polling, activated when `TELEGRAM_BOT_TOKEN` env var is set. Reads/writes the same SQLite DB. Bot commands: `/today`, `/checkin`, `/set`, `/stats`, `/missed`.

### Key computed functions in `src/lib/stats.ts`

- `buildDashboardMetrics` — aggregates last 7/30 days for the Dashboard screen
- `buildWeeklyGoalsProgress` — compares current calendar week against `Settings.weeklyGoals`
- `buildCorrelationInsights` — finds statistically meaningful patterns (workout→energy, sleep→focus, etc.) from all entries; requires ≥10 entries to return anything
- `buildWeeklyReview` — trend summary for last 7 days
- `buildHeatmapWeeks` — 12-week grid for the Heatmap screen

### Data model

`DailyEntry` (keyed by `date: YYYY-MM-DD`):
- Numeric 1-10: `energy`, `mood`, `focus`, `craving`, `stress`
- Minutes: `deepWork` (0-1440)
- Hours: `sleep` (0-14)
- Booleans: `workout`, `webcam`, `mj`, `alcohol`, `nicotineBefore12`
- `notes: string` (max 2000 chars)

**Level formula** (`computeLevel`): starts at 10, `webcam` -6, `mj`/`alcohol` -2 each, `workout` +1, deep work bonus up to +2. Weights are configurable in `Settings.formulaWeights`.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `TRACKER_HOST` | `0.0.0.0` | Server bind host |
| `TRACKER_PORT` | `3210` | Server port |
| `TRACKER_DB_PATH` | `data/tracker.sqlite` | SQLite file path |
| `VITE_API_BASE_URL` | (none, uses `/api`) | Frontend API base |
| `TELEGRAM_BOT_TOKEN` | (none) | Enables Telegram bot |
