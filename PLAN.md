# ProxCity Web — Implementation Plan

A **client-only, single-page web game** deployed to GitHub Pages. Players see a map with 3 city markers, guess which of two cities is closer to a target city, and score points. Zero backend, zero build tools, zero frameworks — just static files.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | Vanilla JS (ES6) | Zero tooling, runs everywhere |
| Map | MapLibre GL JS (CDN) | Same tile source as Android, free, no API key |
| H3 | `h3-js` (CDN) | Official Uber port, `gridDiskDistances()` is all we need |
| Styling | Plain CSS | Dark theme matches Android app |
| Deployment | GitHub Pages | Free, instant, static-only |

**No npm, no webpack, no React, no build step.** Three CDN `<script>` tags in the HTML.

---

## 2. Project Structure

```
proxcity-web/
├── index.html            # Single page — contains all screens as <div> sections
├── css/
│   └── style.css         # Dark theme, responsive, game UI
├── js/
│   ├── engine.js         # Ported GameEngine — H3 + Haversine + round generation
│   ├── game.js           # State machine, scoring, timer, screen transitions
│   └── map.js            # MapLibre GL JS setup, markers, polylines, camera
├── data/
│   └── cityData.json     # 13,453 cities (4.4 MB, ~1.2 MB gzipped)
└── README.md
```

Rationale for separate JS files:

- **`engine.js`** — pure logic, no DOM, no map. Testable independently. Identical algorithm to Android's `GameEngine.kt`.
- **`game.js`** — orchestrates everything: loads data, creates engine, manages round lifecycle, updates DOM.
- **`map.js`** — encapsulates all MapLibre GL JS code. If you ditch MapLibre later, only this file changes.

---

## 3. Data

`cityData.json` is a direct copy from the Android app with H3 indices pre-computed at resolutions 1, 2, 3. Each city:

```json
{
  "id": 3040051,
  "name": "les Escaldes",
  "latitude": 42.50729,
  "longitude": 1.53414,
  "countryName": "Andorra",
  "continent": "Europe",
  "population": 15853,
  "h3Indexes": { "1": "81397ffffffffff", "2": "823967fffffffff", "3": "833962fffffffff" }
}
```

Loaded once at startup via `fetch()` and held in memory as an array. 4.4 MB raw, ~1.2 MB gzipped over the wire — well within reason for a static site.

---

## 4. Game Engine (`js/engine.js`)

Direct port of `GameEngine.kt` (~250 lines). Exports:

```
class GameEngine(cities)
  .generateQuestion(filteredCities, allCities, resolution) → { questionCity, optionA, optionB }
  .checkAnswer(round, selectedCity) → boolean
  .getCorrectAnswer(round) → city
  .calculateDistance(city1, city2) → km
```

Key points:
- Uses `h3.gridDiskDistances(cell, maxK)` from `h3-js` to find candidate pools by ring distance
- Haversine formula for distances (identical math)
- Same "≥10% distance difference" validation between options
- `resolution` parameter determines hex ring sizes (1 = global, 2 = continent, 3 = country)
- No DOM references, no side effects — pure functions

The H3 indices are already in the data, so `latLngToCell()` is only needed as a fallback.

---

## 5. Map Integration (`js/map.js`)

Uses MapLibre GL JS loaded from CDN. Exports:

```
class GameMap(containerId)
  .init()
  .showRound(questionCity, optionA, optionB)
  .clear()
```

Internal:
- Creates `maplibregl.Map` with `tiles.openfreemap.org/styles/liberty` (same as Android)
- Adds 3 `GeoJSON` sources + layers for markers (blue for question, red for options)
- Adds 2 polyline layers (question → optionA, question → optionB) with dashed styling
- `fitBounds()` to frame all 3 cities with padding
- Map is **read-only** — no clicks, no interaction beyond pinch/zoom
- `clear()` removes markers and polylines between rounds

The map code should be ~60-80 lines total.

---

## 6. UI / Screens

All defined in `index.html` as `<section>` or `<div>` elements. `game.js` toggles visibility:

**Screen: Home**

```
┌─────────────────────────┐
│                         │
│     PROXCITY            │
│  (globe icon)           │
│                         │
│  [▶ Play All Cities]    │
│  [▶ Quick Game]         │
│                         │
└─────────────────────────┘
```

**Screen: Game**

```
┌─────────────────────────┐
│ ❤ ❤ ❤    Score: 5    ⏱12│
├─────────────────────────┤
│                         │
│    [MAPLIBRE MAP]       │
│    with 3 markers       │
│    + 2 distance lines   │
│                         │
├─────────────────────────┤
│ Which city is closer    │
│ to Paris?               │
│                         │
│  ┌──────────────────┐   │
│  │    London, UK     │   │
│  └──────────────────┘   │
│                         │
│  ┌──────────────────┐   │
│  │   Berlin, DE      │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

**Screen: Game Over**

```
┌─────────────────────────┐
│                         │
│     GAME OVER           │
│                         │
│   Final Score: 12       │
│   Best: 8 streak        │
│                         │
│  [▶ Play Again]         │
│  [← Home]               │
│                         │
└─────────────────────────┘
```

Styling:
- Dark background (`#1a1a2e` or similar to match Android)
- Cards with rounded corners, subtle shadows
- Buttons with hover/active states
- Mobile-first responsive (portrait-friendly)
- Everything in a single `style.css`

---

## 7. Game Flow / State Machine

`game.js` manages states via a simple enum:

```
MENU → LOADING → PLAYING → ANSWERED → (next round or GAME_OVER) → MENU
```

| State | Behavior |
|---|---|
| **LOADING** | Fetch cityData.json, init MapLibre, show spinner |
| **MENU** | Show home screen, "Play" transitions to PLAYING |
| **PLAYING** | Engine generates round, map shows markers, 12s timer starts, wait for click or timeout |
| **ANSWERED** | Stop timer, check answer, update score/hearts, highlight correct answer on map, 2s pause → next round or GAME_OVER |
| **GAME_OVER** | Show final score + streak, "Play Again" → PLAYING, "Home" → MENU |

**Timer:** `setInterval` at 1s, decrements display. At 0 → auto-submit as wrong answer.

**Scoring:** Same as Android: +1 per correct, 3 hearts, lose a heart on wrong/time-up, game over at 0 hearts. Consecutive correct streak tracked and displayed on game over.

**No persistence** for the demo — scores are session-only.

---

## 8. Game Modes

Ship with **two modes** for the demo:

| Mode | Filter | Resolution |
|---|---|---|
| All Cities | No filter | 1 (global rings) |
| Quick Game | Population ≥ 1,000,000 | 1 (global rings) |

Quick Game filters the city list on startup. If the filtered list is too small, fall back to "All."

Mode expansion (continent, country, packs) is trivial later — just pass a different filter + resolution to `engine.generateQuestion()`.

---

## 9. Deployment

1. Push `proxcity-web` to a new GitHub repo
2. Settings → Pages → Source: "Deploy from branch" → `main` → `/ (root)`
3. Done. Live at `https://<user>.github.io/proxcity-web/`

No build step, no config, no CI.

Performance:
- `cityData.json` cached by browser after first load
- Map tiles cached by MapLibre internally
- First visit: ~2-3s load (MapLibre CSS/JS + data)
- Subsequent visits: instant (cached)

---

## 10. Implementation Order

| Phase | Files | What | Time |
|---|---|---|---|
| 1 | `engine.js` | Port GameEngine to JS. Pure logic, fully testable via console. | 30 min |
| 2 | `index.html` + `style.css` | Page skeleton, screens as divs, dark theme, responsive layout | 45 min |
| 3 | `game.js` | State machine, data loading, screen transitions, scoring, timer | 60 min |
| 4 | `map.js` | MapLibre init, markers, polylines, camera | 30 min |
| 5 | Integration | Wire engine → game → map → UI together, test full loop | 30 min |
| 6 | Polish | Home screen, game over screen, animations, edge cases | 30 min |
| | **Total** | | **~3.5 hours** |

Phase 1 is independent and can be done first. Phases 2-4 can be done in any order since they're separate files. Phase 5 ties it all together.

---

## 11. What's Out of Scope (for the demo)

| Feature | Reason |
|---|---|
| Sound effects | Adds complexity, no CDN-free audio library needed for demo |
| Medal/Trophy system | Tied to packs, needs persistence |
| Packs / Adventures | Data exists in `packs.json` but adds UI complexity |
| Continent/Country modes | Easy to add later — just pass different filters |
| Explore-the-world mode | Different game loop entirely |
| Score persistence | `localStorage` is trivial to add later |
| MapLibre offline tiles | Complex, not needed for demo |

All of these are **additive** — the core game loop doesn't depend on them, so you can launch the demo fast and iterate.

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| H3-js CDN goes down | Pin a version in the URL, fallback message if library fails to load |
| cityData.json is 4.4 MB | Gzip on GitHub Pages makes it ~1.2 MB. Single request, loaded once. Fine. |
| MapLibre GL JS loads slow | Show loading spinner until map is ready. Map is non-blocking for gameplay. |
| Browser compatibility | MapLibre GL JS supports all modern evergreen browsers. ES6 is fine for 2026. |
