# ProxCity Web — Current Status

A fully playable, client-only web port of the ProxCity geography game. No build tools, no frameworks, no npm — vanilla HTML/CSS/JS deployed to GitHub Pages.

## Quick Start

```sh
python3 -m http.server 8000
# Open http://localhost:8000
```

## Project Structure

```
proxcity-web/
├── index.html            # Single page — 3 screens (Home, Game, Game Over) + dialog
├── css/
│   └── style.css         # Dark theme, responsive, animations (519 lines)
├── js/
│   ├── engine.js         # GameEngine — H3 + Haversine round generation (171 lines)
│   ├── game.js           # State machine, scoring, timer, UI orchestration (451 lines)
│   ├── map.js            # MapLibre GL JS — markers, polylines, camera (114 lines)
│   ├── audio.js          # Web Audio API — programmatic sound effects (49 lines)
│   └── countries.js      # Flag emoji mapping for 243 countries (72 lines)
├── cityData/
│   └── cityData.json     # Git submodule — 13,453 cities with H3 indices (4.3 MB)
├── test.html             # Engine unit tests (browser-based)
├── STATUS.md             # This file
├── AGENTS.md             # Agent guide for development
├── PLAN.md               # Original implementation plan
├── SPECS.md              # Technical specifications (Android reference)
├── DESIGN.md             # Design system (colors, typography, components)
├── GAMEPLAY.md           # UX walkthrough
└── GAPS.md               # Parity gaps vs. Android app
```

## What's Implemented

### Game Features

| Feature | Status |
|---|---|
| All Cities mode (13,453 cities, resolution 1) | Done |
| Quick Game mode (499 cities, pop ≥ 1M) | Done |
| H3 hexagonal ring question generation | Done |
| 12-second countdown timer | Done |
| 3 hearts, lose 1 on wrong answer / timeout | Done |
| Score +1 per correct, streak tracking | Done |
| 2 answer options with km distances after reveal | Done |
| Country flag emojis (243 countries) | Done |
| Delta-based timer (no `setInterval` drift) | Done |
| Tab visibility pause/resume | Done |
| Browser back button with leave dialog | Done |
| `localStorage` high scores per mode | Done |
| Daily goal tracking | Done |

### Map (MapLibre GL JS)

| Feature | Status |
|---|---|
| Dark tile source (openfreemap.org) | Done |
| Blue marker on question city before answer | Done |
| Green/red markers + polylines after answer | Done |
| Camera fly-to / fit-bounds transitions | Done |
| Click marker to zoom to city pair | Done |
| Navigation controls (zoom +/-) | Done |

### Audio (Web Audio API)

| Event | Sound |
|---|---|
| Correct answer | Ascending tone (440→880 Hz) |
| Wrong / Time up | Descending tone (440→220 Hz) |
| Button click | White noise burst |
| Game over | Long descending tone (440→110 Hz) |

### Animations (CSS)

| Trigger | Effect |
|---|---|
| Score increase | Bounce 1→1.4→1 |
| Heart lost | Shake 1→1.35→1 |
| Correct button | Pulse scale 1.06 |
| Status text | Pop-in 0.5→1.15→1 |
| Game over screen | Slide in from right |
| Streak ≥ 3 | Gold border on top bar |
| Streak ≥ 10 | Pulsing gold border |
| Confetti on correct | 30-75 colored particles |

### Playable from

**Home Screen** → Play All Cities or Quick Game
**Game Screen**   → Read question, choose answer via click or 1/2 keys
**Game Over**     → See score, high score, play again or go home

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Vanilla JS (ES6) |
| Map | MapLibre GL JS v4 (CDN) |
| H3 | h3-js v4.4.0 (CDN) |
| Styling | Plain CSS |
| Data | 13,453 cities with pre-computed H3 indices |
| Deployment | Static files — any HTTP server |

## Remaining Gaps (from GAPS.md)

### P0 — Should have for full parity

| Gap | Notes |
|---|---|
| Loading states | Basic spinner exists, could be polished |
| Error states | Basic retry exists, could be polished |
| MapLibre style.load error handling | Not implemented |

### P1 — Noticeable if missing

| Gap | Notes |
|---|---|
| Responsive desktop landscape layout | Works but not optimized |
| Screen reader support (ARIA) | Not implemented |

### P2 — Nice to have

| Gap | Notes |
|---|---|
| Light theme (prefers-color-scheme) | Not implemented |
| Service worker for offline | Not implemented |
| URL hash routing | Not implemented |
| Pack / Adventure / Continent modes | Data exists but not wired |
| Haptic feedback (navigator.vibrate) | Not implemented |
