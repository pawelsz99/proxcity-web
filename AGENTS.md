# ProxCity Web — Agent Guide

## Project

A static-client web port of the ProxCity Android geography game. **No build tools, no frameworks, no npm** — vanilla HTML/CSS/JS deployed to GitHub Pages.

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Vanilla JS (ES6) |
| Map | MapLibre GL JS (CDN) |
| H3 | `h3-js` (CDN) |
| Styling | Plain CSS |
| Deployment | GitHub Pages |

CDN scripts loaded via `<script>` tags in `index.html`. No bundling.

## Key Documents (read before coding)

- `PLAN.md` — implementation plan, project structure, state machine, game flow
- `SPECS.md` — game engine algorithm (H3 gridDiskDistances + Haversine), game modes, data schema, scoring
- `DESIGN.md` — colour palette, typography, component specs, map styling, animations
- `GAMEPLAY.md` — full UX walkthrough of every screen and interaction
- `GAPS.md` — parity gaps vs. Android app, organized P0/P1/P2 priority

## Project Structure

```
proxcity-web/
├── index.html           # Single page, all screens as <div> sections
├── css/style.css        # Dark theme, responsive, game UI
├── js/
│   ├── engine.js        # Pure logic: H3 + Haversine + round generation (no DOM)
│   ├── game.js          # State machine, scoring, timer, screen transitions
│   └── map.js           # MapLibre GL JS setup, markers, polylines, camera
├── data/cityData.json   # 13,453 cities (4.4 MB, ~1.2 MB gzipped)
└── cityData/            # Git submodule — contains cityData.json, packs.json, adventures.json
```

## Git Submodule

`cityData/` is a submodule at `git@github.com:pawelsz99/city-data.git`. Initialize with:

```sh
git submodule update --init --recursive
```

`cityData/cityData.json` is the canonical data source. Copy it to `data/cityData.json` for the app.

## Game Engine (engine.js)

Pure logic — no DOM, no map references. Ported from Android `GameEngine.kt`:

1. Pick random question city from filtered pool
2. Get H3 cell at game-mode resolution
3. `h3.gridDiskDistances(cell, maxK)` → ring-distances
4. Build hex→ring map, find candidate cities
5. Pick 2 options with ≥10% distance difference
6. Haversine distance for correctness check

API: `h3-js` functions needed — `gridDiskDistances`, `latLngToCell` (fallback only).

## State Machine (game.js)

```
MENU → LOADING → PLAYING → ANSWERED → (NEXT_ROUND or GAME_OVER) → MENU
```

- **Timer**: 12s. Use delta-based (`Date.now()`) not `setInterval` drift.
- **Tab visibility**: `visibilitychange` listener pauses/resumes timer.
- **Browser back**: `popstate` handler shows leave-game confirmation dialog.
- **Scoring**: +1 correct, 3 hearts, stop at 0 hearts. Streak resets on wrong.

## Map (map.js)

- Tile source: `https://tiles.openfreemap.org/styles/liberty` (light) / `dark` (dark)
- Before answer: center on question city, zoom 4, blue marker only
- After answer: fit bounds around all 3 cities, show markers + dashed geodesic polylines
- Marker click after reveal: `map.fitBounds([questionCity, clickedCity])`

## Game Mode Config

| Mode | Resolution | Filter | Options Pool |
|---|---|---|---|
| All Cities | 1 | None | All cities |
| Quick Game | 1 | population >= 1,000,000 | Filtered subset |
| By Continent | 2 | continent == X | All cities |
| By Country | 3 | countryName == X | All cities |
| By Pack | 2 | id in pack list | Filtered subset |

## Development Workflow

```sh
# Serve locally (any static server)
python3 -m http.server 8000

# No build step — just edit files and refresh.
```

No lint, test, or typecheck config exists. Game engine logic in `engine.js` can be exercised in browser console.

## Design Conventions

- Dark theme (`#171717` bg) with system `prefers-color-scheme` support
- Primary: `#5B9DFF` (light), `#FF7700` (dark)
- Correct: `#52C697`, Wrong: `#E83634`
- Font stack: `system-ui, -apple-system, sans-serif`
- Rounded corners (12px buttons, 40px topbar), 24dp horizontal padding
- Mobile-first responsive: phone portrait → landscape → desktop (centered 600px max)
- Keyboard: Tab/Enter, Escape (back), 1/2 (quick-select options)
