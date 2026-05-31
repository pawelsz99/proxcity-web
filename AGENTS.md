# ProxCity Web — Agent Guide

**Vanilla HTML/CSS/JS** — no build tools, no npm. Deployed to GitHub Pages.

## Script load order matters

`index.html` loads scripts in a specific dependency chain:

1. `<head>` — MapLibre GL JS CDN, h3-js CDN, **`js/engine.js`** (no DOM)
2. End of `<body>` — `js/countries.js`, `js/icons.js`, `js/audio.js`, `js/map.js`, `js/game.js`

`game.js` calls `init()` on `DOMContentLoaded`. If the load order breaks, `h3` or `maplibregl` globals will be undefined and the home screen shows an error state.

## Project layout

| Path | Role |
|---|---|
| `index.html` | Single page — all screens as `<div>` sections |
| `css/style.css` | Dark theme, responsive, game UI |
| `js/engine.js` | Pure logic: `GameEngine` class — H3 + Haversine + round gen. No DOM. **Testable via `test.html`** |
| `js/game.js` | State machine, scoring, timer, screen transitions, router |
| `js/map.js` | MapLibre GL JS setup, markers, polylines, camera |
| `js/countries.js` | `COUNTRY_FLAGS` map + `flagEmoji()` helper |
| `js/icons.js` | SVG icon generators (star, heart, arrow, medals) |
| `js/audio.js` | `Sound` object — wraps Web Audio API click + MP3 playback |
| `sounds/` | `correct.mp3`, `incorrect.mp3`, `warning.mp3`, `gameover.mp3` |
| `test.html` | Standalone test page for `engine.js` — open in browser, click buttons |
| `cityData/` | **Git submodule** (`git@github.com:pawelsz99/city-data.git`) — source of `cityData.json`, `packs.json`, `adventures.json` |

## Submodule

```sh
git submodule update --init --recursive
```

`game.js` fetches data directly from `cityData/cityData.json` (not `data/`). The `data/` directory is unused.

## State machine

```
MENU → LOADING → PLAYING → ANSWERED → (NEXT_ROUND or GAME_OVER) → MENU
```

- Timer: 12s, `setInterval` 1s tick, but uses `Date.now()` inside tick to correct for drift (`game.js:856-869`)
- Tab hide: `visibilitychange` → `pauseTimer()` / `resumeTimer()` save remaining via `timerRemainingBeforePause`
- Browser back: `popstate` shows leave-game dialog if PLAYING or ANSWERED
- Scoring: +1 correct, 3 hearts, stop at 0 hearts. Streak resets on wrong.
- Game state saved to `sessionStorage` (key `proxcity_game`) — restored on refresh via `tryRestoreGame()`

## Map

- Tile source: `https://tiles.openfreemap.org/styles/liberty` (light) / `dark` (dark)
- Before answer: center on question city, zoom 4, blue `#0088FF` pin only
- After answer: `fitBounds` around all 3 cities, correct=green `#52C697`, wrong=red `#E83634` pins, dashed geodesic polylines
- Marker click after reveal: `map.fitBounds([questionCity, clickedCity])`

## Audio

`Sound.correct()`, `Sound.wrong()`, `Sound.click()`, `Sound.gameover()`, `Sound.warning()`. Click uses synthesized Web Audio burst; others play MP3s from `sounds/`. Failures silently caught via `.catch(() => {})`.

## Game modes

| Mode | Resolution | Filter | Options Pool |
|---|---|---|---|
| All Cities | 1 | None | All cities |
| Quick Game | 1 | population >= 1M | Filtered subset |
| By Continent | 2 | continent == X | All cities |
| By Country | 3 | countryName == X | All cities |
| By Pack | 2 | id in pack list | Filtered subset |
| Top N | 2 | by population rank | Filtered subset |

Resolution logic at `game.js:653-657`. Question pool vs. options pool differ for pack/quick modes (`getOptionsPool()` at `game.js:691-696`).

## Routing

Hash-based router (`game.js:1268-1348`). Routes: `#/game/*`, `#/explore/*`, `#/mode/*`, `#/adventure/*`, `#/gameover`. `hashchange` and `popstate` handlers coordinate with `ignoreNextHashChange` / `ignoreNextPopstate` flags to prevent loops.

## Persistence

All via `localStorage`:
- High scores per mode key: `highscore_<mode>_<filter>` (see `getHighScoreKey()`)
- Pack metadata: `pack_meta_<packId>` (JSON with `highScore`, `gamesPlayed`, `lastPlayedAt`)
- Profile: `profile_name`, `total_score`, `games_played`
- Theme: `proxcity_theme` (`'light'` or `'dark'`)
- Daily tracking: `daily_date`, `daily_score`, `daily_streak`, `daily_streak_date`

## Development

```sh
python3 -m http.server 8000
# No build step — edit files and refresh.
```

`test.html` exercises `engine.js` in isolation (Haversine, round generation, batch validation). Open it directly in a browser — no server needed for the test page.

No lint, test runner, or typecheck config exists.

## Key conventions

- Dark theme: `#171717` bg, `#FF7700` primary (light theme: `#FFFFFF` bg, `#5B9DFF` primary)
- Correct: `#52C697`, Wrong: `#E83634`, Gold: `#FFD700`
- Font: `system-ui, -apple-system, sans-serif`
- Buttons: 12px radius, answers: 20px radius, topbar: 40px radius
- 24dp horizontal padding, mobile-first responsive (centered 600px max at 768px)
- Keyboard: Escape=back (or leave dialog), 1/2=quick-select options, Enter/Space=next round
- Theme toggle with `prefers-color-scheme` support; logo swaps between `logo_day.png` / `logo_night.png`
- GoatCounter analytics: `<script data-goatcounter="https://proxcity.goatcounter.com/count" async src="//gc.zgo.at/count.js">`
