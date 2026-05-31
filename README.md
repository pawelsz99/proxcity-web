# ProxCity Web

A geography guessing game. See two cities on a map and guess which is closer to a third. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools.

## Play

Open `index.html` in a browser, or serve locally:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Data

City data comes from a git submodule:

```sh
git submodule update --init --recursive
```

## Project

| Path | What |
|---|---|
| `index.html` | Single page with all screens |
| `css/style.css` | Dark/light theme, responsive |
| `js/engine.js` | Game logic (H3 + Haversine) |
| `js/game.js` | State machine, routing, scoring |
| `js/map.js` | MapLibre GL JS map |
| `js/countries.js` | Flag emoji helpers |
| `js/icons.js` | SVG icons (star, heart, medals) |
| `js/audio.js` | Sound effects |
| `test.html` | Test page for `engine.js` (open in browser, no server needed) |
| `cityData/` | Git submodule with city data |
