# ProxCity Android App — Technical Specifications

Reference document for building the web version. All details extracted from the Kotlin codebase.

---

## 1. City Data (`data/city/`)

### JSON Format (`cityData.json`)

Array of 13,453 city objects:

```json
{
  "name": "les Escaldes",
  "latitude": 42.50729,
  "longitude": 1.53414,
  "countryName": "Andorra",
  "continent": "Europe",
  "id": 3040051,
  "population": 15853,
  "isCapital": false,
  "h3Indexes": {
    "1": "81397ffffffffff",
    "2": "823967fffffffff",
    "3": "833962fffffffff"
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `id` | Long | GeoNames city ID |
| `name` | String | City name |
| `latitude` | Double | WGS84 |
| `longitude` | Double | WGS84 |
| `countryName` | String | Full country name (e.g. "Poland") |
| `continent` | String | One of: Africa, Asia, Europe, North America, South America, Oceania |
| `population` | Long? | Null for some cities |
| `isCapital` | Boolean | Not used in game logic |
| `h3Indexes` | Object | Keys are resolution levels 1, 2, 3. Values are H3 cell addresses as hex strings. |

### Cities Table (for reference — Room entity)

In the Kotlin code, H3 indexes are stored as a JSON string column (`h3IndexesJson`). For the web version, the JSON already has them as a nested object, so no transformation needed.

---

## 2. Game Engine (`domain/usecase/GameEngine.kt`)

### Constructor

- Creates `H3Core` instance (Java library). In web, use `h3-js` npm package.

### Constants

| Constant | Value | Notes |
|---|---|---|
| `EARTH_RADIUS_KM` | 6371.0 | Haversine formula |
| `MAX_K_RES_1` | 15 | Max H3 ring distance for resolution 1 |
| `MAX_K_RES_2` | 25 | Max H3 ring distance for resolution 2 |
| `MAX_K_RES_3` | 35 | Max H3 ring distance for resolution 3 |
| `debugKValues` | false | Debug flag, unused in production |

### Resolution → Max K Mapping (`getMaxKForResolution`)

| Resolution | Max K |
|---|---|
| 1 | 15 |
| 3 | 35 |
| else (2) | 25 |

### Resolution → Initial K Neighbors (`getInitialKNeighbours`)

| Resolution | Random range |
|---|---|
| 1 | 2..10 |
| 3 | 3..25 |
| else (2) | 2..15 |

### Question Generation Algorithm

1. **Pick question city** — random from the filtered city list
2. **Get H3 cell** — for the question city at the current resolution
3. **Call `h3.gridDiskDistances(cell, maxK)`** — returns array of rings. Index 0 = ring 0 (the cell itself), index 1 = ring 1 (neighbors), etc. Up to `maxK` rings.
4. **Build hex→ring map** — map each H3 address to its ring distance k
5. **Find candidate cities** — iterate all cities, look up their H3 index in the map. If found, add to `candidatesByK[k]`. Skip the question city itself.
6. **Select Option A** — try to pick from `targetK` ring. If no cities at that ring, pick the closest available ring.
7. **Calculate difficulty range** — `max(1, k-2)` to `k+1`
8. **Select Option B** — randomly pick a city in the `[mink, maxk]` ring range, different from Option A. Retry up to 5 times if the distance difference is < 10%.
9. **Validate ≥10% distance difference** — `(maxDist - minDist) / minDist >= 0.1`
10. **Shuffle options** — randomize which appears as optionA vs optionB
11. **Return Round** with question city and two shuffled options

### Haversine Distance (`calculateDistance`)

```js
function calculateDistance(city1, city2) {
  const R = 6371.0;
  const dLat = toRadians(city2.latitude - city1.latitude);
  const dLon = toRadians(city2.longitude - city1.longitude);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(city1.latitude)) *
    Math.cos(toRadians(city2.latitude)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### Checking Answers

```
checkAnswer(round, selectedCity):
  distSelected = haversine(selectedCity, questionCity)
  distOther = haversine(otherOption, questionCity)
  return distSelected < distOther
```

### Timer Duration

Hardcoded to **12 seconds** (`getTimerDuration()` returns 12).

---

## 3. Game Modes (`domain/model/GameState.kt`)

### All

| Property | Value |
|---|---|
| Resolution | 1 |
| Filter | None (all cities) |
| Options pool | All cities (same as question pool) |

### Quick Game

| Property | Value |
|---|---|
| Resolution | 1 |
| Filter | `population >= 1,000,000` |
| Options pool | Filtered cities only (subset) |

### By Continent

| Property | Value |
|---|---|
| Resolution | 2 |
| Filter | `continent == selected` |
| Options pool | All cities (not just continent) |

Continents: Africa, Asia, Europe, North America, South America, Oceania

### By Country

| Property | Value |
|---|---|
| Resolution | 3 |
| Filter | `countryName == selected` |
| Options pool | All cities (not just country) |

### By Pack

| Property | Value |
|---|---|
| Resolution | 2 |
| Filter | Cities whose `id` is in the pack's city list |
| Options pool | Filtered cities only (subset) |

Packs are defined in `packs.json`. Each pack has a list of city IDs.

### Top Cities

| Property | Value |
|---|---|
| Resolution | 2 (or 3 if Country filter) |
| Filter | Top N cities by population, optional sub-filter by Continent or Country |
| Options pool | All cities |

---

## 4. Game State & Flow (`ui/viewmodel/GameViewModel.kt`)

### GameState

```js
{
  currentRound: Round,
  score: 0,
  heartsRemaining: 3,
  consecutiveCorrect: 0,
  gameStatus: "PLAYING",
  gameMode: GameMode,
  timerDuration: 12
}
```

### Round

```js
{
  questionCity: City,
  optionA: City,
  optionB: City,
  isAnswerRevealed: false,
  selectedAnswer: City | null,
  correctAnswer: City | null
}
```

### GameStatus

Enum: `PLAYING`, `CORRECT`, `WRONG`, `TIME_UP`, `GAME_OVER`

### State Machine (from GameViewModel)

```
startNewGame(gameMode)
  → load cities from data source
  → engine.generateQuestion()
  → set GameState(PLAYING, score=0, hearts=3)
  → start 12s timer

selectAnswer(city)
  → cancel timer
  → engine.checkAnswer()
  → if correct: score++, consecutive++
  → if wrong: hearts--, consecutive=0
  → if hearts <= 0: GAME_OVER
  → set isAnswerRevealed = true

onTimeUp()
  → hearts--
  → if hearts <= 0: GAME_OVER else TIME_UP
  → set isAnswerRevealed = true

nextRound()
  → engine.generateQuestion() with same game mode
  → set GameState(PLAYING)
  → start 12s timer

restartGame()
  → startNewGame(currentGameMode)
```

### Error Handling

If `generateQuestion()` fails (no cities in range), show error message. Fallback: try with `allCities` pool if the primary pool is empty.

---

## 5. Scoring & Medals

### In-Game Scoring

- **Score**: +1 per correct answer. Displayed as star icon + number in top bar.
- **Hearts**: 3 total. -1 on wrong answer or time up. 0 hearts = game over.
- **Consecutive correct**: Tracked. Resets to 0 on wrong answer.
- **Streak display**: Shows fire emoji + count when `consecutiveCorrect >= 2`.
- **Streak visual thresholds**: 3, 5, 10, 25+ (affects animation intensity).

### Medal Thresholds (from `MedalUtils.kt`)

Medal thresholds are per-pack. Pack definitions in `packs.json` contain:

```json
{
  "bronzeThreshold": 10,
  "silverThreshold": 15,
  "goldThreshold": 20
}
```

| Medal | Condition |
|---|---|
| Bronze | `highScore >= bronzeThreshold` (typically 10) |
| Silver | `highScore >= silverThreshold` (typically 15) |
| Gold | `highScore >= goldThreshold` (typically 20) |

Adventure medals require ALL packs in the adventure to meet the threshold.

---

## 6. Timer (`domain/usecase/TimerManager.kt`)

- Counts down from 12 seconds
- Ticks every 1 second
- On finish: calls `onTimeUp()` → loses a heart
- Cancellable when answer is selected

Web implementation: `setInterval` at 1000ms, or recursive `setTimeout`.

---

## 7. Map UI (`ui/screens/GameMapView.kt`)

### Style URLs

| Theme | URL |
|---|---|
| Light | `https://tiles.openfreemap.org/styles/liberty` |
| Dark | `https://tiles.openfreemap.org/styles/dark` |

### Map Behavior

- **Before answer**: Center on question city at zoom 4. Only question city marker visible.
- **After answer**: Fit bounds to show all 3 cities with padding. Show all 3 markers + distance polylines.

### Markers

| City | State | Marker color |
|---|---|---|
| Question city | Always | Blue |
| Correct option | After reveal | Green |
| Wrong option | After reveal | Red |

### Polylines (added after answer reveal)

- Dashed lines from question city to each option city
- Width: 5px
- Color: gray/white
- Route calculated via GeographicLib geodesic interpolation (64 steps)
  - Web alternative: use turf.js `turf.greatCircle()` or MapLibre's built-in geodesic, or just draw straight lines

### Camera

- Before answer: `CameraPosition(target=questionCity, zoom=4)`
- After answer: `LatLngBounds(questionCity, optionA, optionB)` with padding

### City Click (after answer)

When a city is clicked after reveal, zoom to show that city + question city.

---

## 8. Country Emojis (`utils/CountryUtils.kt`)

Mapping of country name → 2-letter country code → flag emoji.

Algorithm:

```js
function getCountryEmoji(countryName) {
  const code = countryNameToCode[countryName]; // e.g. "PL", "US"
  if (!code || code.length !== 2) return countryName.slice(0, 2).toUpperCase();
  const firstChar = 0x1F1E6 + (code.charCodeAt(0) - 65);
  const secondChar = 0x1F1E6 + (code.charCodeAt(1) - 65);
  return String.fromCodePoint(firstChar) + String.fromCodePoint(secondChar);
}
```

Full mapping of ~190 countries is in `CountryUtils.kt` (267 lines). Port the map object as-is to JS.

---

## 9. Pack System (bonus reference)

Defined in `packs.json`:

```json
{
  "id": "europe-capitals",
  "name": "European Capitals",
  "description": "...",
  "cityIds": [3040051, ...],
  "bronzeThreshold": 10,
  "silverThreshold": 15,
  "goldThreshold": 20
}
```

Adventures are groups of packs. Defined in `adventures.json`.

---

## 10. Key H3-js API Usage

From `h3-js` package, only these functions are needed:

| Kotlin (H3Core) | JS (h3-js) | Purpose |
|---|---|---|
| `h3.gridDiskDistances(cell, maxK)` | `h3.gridDiskDistances(cell, maxK)` | Returns array of rings of H3 cells |
| `h3.latLngToCell(lat, lng, res)` | `h3.latLngToCell(lat, lng, res)` | Convert coords to H3 cell (fallback only) |
| `h3.h3ToString(cell)` | N/A | JS uses strings natively |
| `h3.stringToH3(cell)` | N/A | JS uses strings natively |

The data already has pre-computed H3 indexes for all cities. `latLngToCell()` is only needed if a city somehow lacks an H3 index (shouldn't happen with current data).

---

## 11. Data Files (from `app/src/main/assets/`)

| File | Size | Contents |
|---|---|---|
| `cityData.json` | 4.4 MB | 13,453 cities with H3 indexes |
| `packs.json` | Small | Pack definitions with medal thresholds |
| `adventures.json` | Small | Adventure pack groupings |

For the demo, only `cityData.json` is essential. Packs/adventures can be added later.

---

## 12. Android-Specific Code (DO NOT PORT)

These files are Android-only and have no equivalent in the web version:

| File | Purpose | Web alternative |
|---|---|---|
| `AppDatabase.kt` | Room DB setup | None needed (no persistence for demo) |
| All DAOs | SQL queries | None needed |
| `CityRepository.kt` | Context-dependent caching | In-memory array |
| `OfflineTileCacher.kt` | MapLibre offline tiles | Not applicable |
| `SoundPlayer.kt` | Sound effects | Web Audio API (future) |
| `InAppReviewManager.kt` | Google Play review | Not applicable |
| `GameActivity.kt` | Android Activity | HTML page |
| `MainActivity.kt` | Launcher Activity | HTML page |
