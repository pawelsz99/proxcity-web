# ProxCity — Gameplay Experience

A walkthrough of every screen and interaction in the game.

---

## 1. App Launch

The app opens to the **home screen**. The user sees:

- **Greeting row** — "Good morning / afternoon / evening, [name]"
- **Daily goal ring** — a circular progress indicator showing today's score toward the daily goal (default: 50). If the goal is reached, the ring glows and shows a star. A streak counter (fire emoji + number) appears if the user has hit their goal multiple days in a row.
- **Shortcuts row** — quick-launch cards for the last-played game mode, or for the daily challenge
- **Navigation buttons**:
  - **Play** — enters the game mode selection screen
  - **Explore the World** — opens a browsable map of all cities
  - **Adventures** — themed collections of city packs
  - **Trophy Cabinet** — displays all earned medals

---

## 2. Play Mode Selection

Tapping **Play** opens the mode picker with three options:

| Option | What happens next |
|---|---|
| **Country** | A list of continents appears. Tapping a continent shows its countries. Tapping a country starts a game limited to cities in that country. |
| **Continent** | A list of continents appears. Tapping one starts a game limited to cities on that continent. |
| **World** | Starts immediately with all ~13,000 cities. |

Each mode has a back arrow in the top-left to return to the previous screen.

---

## 3. Game Screen — Before Answering

When the game starts, the screen shows:

```
┌─────────────────────────────┐
│  ←  ⭐ 5     🔥 3     ❤❤❤  │  ← Top bar
├─────────────────────────────┤
│                             │
│   Which city is closer      │
│   to Paris 🇫🇷?             │  ← Question
│                             │
│   ┌─────────────────────┐   │
│   │                     │   │
│   │   MAPLIBRE MAP      │   │  ← World map, zoom 4
│   │   (blue marker      │   │     centered on question city
│   │    on question city) │   │     options NOT shown yet
│   │                     │   │
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │   London 🇬🇧          │   │  ← Option A (tappable)
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │   Berlin 🇩🇪          │   │  ← Option B (tappable)
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │        9             │   │  ← Timer countdown (12 → 0)
│   └─────────────────────┘   │
└─────────────────────────────┘
```

### Top bar details

| Element | Behavior |
|---|---|
| **Back arrow** | Tapping shows a confirmation dialog: *"Leave Game? Your progress will be lost."* with "Stay" and "Leave" buttons. |
| **⭐ Score** | Starts at 0, increments by 1 per correct answer. The number bounces on increase. |
| **🔥 Streak** | Appears when `consecutiveCorrect >= 2`. Shows the streak count. Border of the top bar turns gold at 3+, pulses at 10+. |
| **❤️ Hearts** | Starts at 3 full hearts. One heart empties on each wrong answer or time-up. Visual shake animation on loss. 0 hearts = game over. |

### Question text

Always reads: *"Which city is closer to [City Name] [flag emoji]?"*

The question city is shown with its country flag emoji.

### Map (before answering)

- Map is centered on the question city at zoom 4
- A single **blue marker** is shown at the question city
- Option cities are **not** shown yet — the player must rely on their geography knowledge
- Map is interactive: pan, zoom, pinch

### Answer buttons

- Two large buttons, each showing the city name and its country flag
- Tapping one submits the answer
- Buttons are un-tappable once an answer is selected

### Timer

- Starts at 12 and counts down every second
- Displayed in the bottom button slot
- When it reaches 0: treated as a wrong answer (heart lost, answer revealed)

---

## 4. After Answering — Answer Revealed

Tapping an option (or timer reaching 0) triggers the reveal:

### Map changes

- Camera zooms out to show all 3 cities within the viewport
- **Blue marker**: stays on the question city
- **Green marker**: the correct answer (pulsing animation)
- **Red marker**: the wrong answer (or both red if the player was correct and the other was wrong)
- **Two polylines**: dashed lines from question city to each option city, showing the geodesic route

### Answer buttons change

- The correct button turns **green** and pulses
- The wrong button turns **red**
- Both buttons now show the distance below the city name (e.g. "1,234 km")

### Status text

Appears above the answer buttons:

| Scenario | Text | Color |
|---|---|---|
| Correct answer | "Correct!" | Green |
| Wrong answer | "Incorrect!" | Red |
| Timer expired | "Time is up!" | Red |

### Confetti effect

On a correct answer, confetti particles burst across the screen. The intensity scales with streak length (more particles at 3+, 5+, 10+, 25+ streaks).

### Next round button

The timer slot changes to a colored button:

| Scenario | Button text | Color |
|---|---|---|
| After any reveal (not game over) | "Next round" | Primary |
| On game over | "Game Over" | Primary |

### Clicking a revealed city

After the answer is revealed, tapping a city on the map **zooms the camera** to focus on that specific city together with the question city. This lets the player examine the geography more closely.

---

## 5. Game Over

When hearts reach 0, the game ends. After the "Game Over" button is tapped (or medals are shown first), the **Game Over screen** slides in from the right:

```
┌─────────────────────────────┐
│  ←                    GAME OVER
│
│         Your Score
│           12
│
│      NEW HIGHSCORE!
│   Previous: 10
│
│      ┌─────────────────┐
│      │                 │
│      │   Daily Goal    │
│      │    ○  32/50    │  ← Animated ring
│      │                 │
│      └─────────────────┘
│
│    You were 3 answers
│    away from Bronze Medal!
│
│      [   Play Again   ]
│      [  Exit to Menu  ]
│
└─────────────────────────────┘
```

### Score display

- Large number showing the final score
- If it's a new personal best: "NEW HIGHSCORE!" with the previous score shown below

### Medals

If new medals are unlocked (based on pack thresholds), they appear before the game over screen in a **medal celebration overlay** showing the earned medals (Bronze / Silver / Gold) with their icons.

### Near-miss hint

If the player was close to the next medal threshold, a text appears: *"You were [N] answer(s) away from [Bronze/Silver/Gold] Medal!"*

### Daily goal ring

- Shows current daily progress as a circular arc (animated fill)
- If the daily goal was reached: the ring glows with a pulsing aura, a star appears in the center, and "Goal Complete!" text animates

### Buttons

| Button | Action |
|---|---|
| **Play Again** | Restarts the game with the same mode |
| **Exit to Menu** | Returns to the home screen |

---

## 6. Explore the World

Opens a **full-screen map** with markers for all cities. The user can:

- Pan and zoom the map freely
- Tap any city marker to see a popup with the city name, country, population, and a "Play" button
- Tapping "Play" on a city starts a game where that city's country or continent is pre-selected as the game mode

This mode is purely exploratory — no timer, no scoring.

---

## 7. Adventures

A list of **adventures** — themed groups of packs (e.g. "European Tour" containing "Western Europe", "Eastern Europe", "Scandinavia" packs).

- Each adventure shows progress: "2/3 packs completed"
- Tapping an adventure opens its pack list
- Each pack shows: name, best score, medal earned (if any), medal threshold
- Tapping a pack starts a game limited to that pack's cities
- Adventure-level medals are awarded when all packs in the adventure meet the same medal tier

---

## 8. Trophy Cabinet

A gallery of all medals earned across packs and adventures:

- **Pack medals**: grid of pack icons, each showing the earned medal (Bronze / Silver / Gold / none)
- **Adventure medals**: separate section showing adventure trophies
- Tapping a medal shows details: pack name, high score, threshold for next tier

---

## 9. Back Navigation

At any point during a game, pressing back shows:

> **Leave Game?**

> Your progress will be lost. Are you sure you want to leave?

| Button | Action |
|---|---|
| **Stay** | Dismisses dialog, game continues |
| **Leave** | Exits to the previous screen (home or mode select) |
