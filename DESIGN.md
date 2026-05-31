# ProxCity — Design System

Colour palette, typography, component design, animations, and layout patterns used in the Android app. All values are extracted from the Kotlin/Compose codebase.

---

## 1. Colour Palette

Defined in `ui/theme/Color.kt` and `res/values/colors.xml`.

### Light Theme

| Token | Hex | Usage |
|---|---|---|
| `Primary` | `#5B9DFF` | Buttons, interactive elements, links |
| `OnPrimary` | `#FFFFFF` | Text on primary backgrounds |
| `Background` | `#FFFFFF` | Screen background |
| `OnBackground` | `#171717` | Body text, headings |
| `OnBackgroundPrimary` | `#5B9DFF` | Accent text on light bg |
| `Correct` | `#52C697` | Correct answer indicator (green) |
| `Wrong` | `#E83634` | Wrong answer indicator (red) |

### Dark Theme

| Token | Hex | Usage |
|---|---|---|
| `Primary` | `#FF7700` | Buttons, interactive elements, links |
| `OnPrimary` | `#171717` | Text on primary backgrounds |
| `Background` | `#171717` | Screen background |
| `OnBackground` | `#D9D9D9` | Body text, headings |
| `OnBackgroundPrimary` | `#FF7700` | Accent text on dark bg |
| `Correct` | `#52C697` | Correct answer indicator (green) |
| `Wrong` | `#E83634` | Wrong answer indicator (red) |

### Theme Switch

The app respects the **system dark mode setting**. On Android 12+, it uses **Material You dynamic colour** (wallpaper-derived palette) instead of the fixed colours above. For the web demo, implement a manual light/dark toggle or respect `prefers-color-scheme`.

### Polylines (Map)

On dark theme: `rgb(217, 217, 217)` — light gray lines on the dark map background.

---

## 2. Typography

Defined in `ui/theme/Type.kt`. Uses **system default font** (not a custom font).

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `bodyLarge` (default) | 16 sp | Normal | 24 sp | 0.5 sp | Body text |
| Question text | 18 sp | Bold | — | — | "Which city is closer to ...?" |
| Button text | 16–18 sp | Bold | — | — | Answer buttons, action buttons |
| Score text | 24+ sp | Bold | — | — | Score displays |
| Game Over title | 36 sp | Bold | — | — | "GAME OVER" heading |
| Game Over score | 64 sp | Bold | — | — | Final score number |
| Timer text | 16 sp | Normal/Bold | — | — | Countdown display |
| Status text | 20 sp | Bold | — | — | "Correct!" / "Incorrect!" |
| Section headers | 20–24 sp | Bold | — | — | "Select Game Mode", "Your Score" |
| Small labels | 12–14 sp | Normal | — | — | Distance km, subtext |

For the web: use `system-ui, -apple-system, sans-serif` as the font stack to match the Android system font.

---

## 3. Component Design

### 3.1 SimpleButton

Used for primary actions (Play, Play Again, Exit to Menu, etc.).

| Property | Value |
|---|---|
| Shape | `RoundedCornerShape(12 dp)` |
| Border | 2 dp solid, matches text colour |
| Horizontal padding | 12 dp |
| Vertical padding | 14 dp |
| Font size | 18 sp |
| Width | Configurable fraction (default 80% of parent) |
| Disabled alpha | 0.4 |

```css
/* CSS equivalent */
.button-primary {
  border-radius: 12px;
  border: 2px solid var(--primary);
  padding: 14px 12px;
  font-size: 18px;
  text-align: center;
  width: 80%;
  cursor: pointer;
}
.button-primary:disabled {
  opacity: 0.4;
  cursor: default;
}
```

### 3.2 AnswerButton

Used for the two city options during gameplay. Larger than SimpleButton.

| Property | Value |
|---|---|
| Min height | 80 dp |
| Max height | 100 dp |
| Corner radius | Default Material3 (typically 20 dp) |
| Font size | 16 sp city name, 12 sp distance |
| Font weight | Bold |

States:
| State | Background |
|---|---|
| Default (before answer) | Primary colour |
| Correct answer revealed | Green (`#52C697`) + pulse animation |
| Wrong answer revealed | Red (`#E83634`) |
| Disabled during reveal | Same as state above |

### 3.3 SelectableButton

Used in list pickers (continent selection, country selection).

| Property | Value |
|---|---|
| Shape | `RoundedCornerShape(12 dp)` |
| Border | 2 dp solid |
| Font size | 18 sp |
| Selected state | Different background + text colour |
| Unselected state | Transparent background |

### 3.4 TopBar

The persistent header bar during gameplay.

| Property | Value |
|---|---|
| Shape | `RoundedCornerShape(40 dp)` — highly rounded pill shape |
| Border | 2 dp solid |
| Horizontal padding | 20 dp |
| Vertical padding | 10 dp |
| Full width | `fillMaxWidth` |

Border colour changes based on streak:
| Streak | Border colour |
|---|---|
| 0–2 | Primary |
| 3–9 | Gold (`#FFD700`) |
| 10+ | Pulsing between Gold and bright Gold |

### 3.5 Bottom Navigation / Cards

Used on the home screen and mode selection:

| Property | Value |
|---|---|
| Corner radius | 12 dp |
| Padding | 24 dp horizontal, 16 dp vertical |
| Icon size | 28 dp |

---

## 4. Spacing & Layout

The app uses `dp` throughout. Key values:

| Spacing | Value | Usage |
|---|---|---|
| Screen horizontal padding | 24 dp | Margins on game screen |
| Between elements | 16 dp, 20 dp, 24 dp | Standard gutters |
| Between buttons | 16 dp | Horizontal gap between answer buttons |
| Top bar margin | 16 dp top | Status bar inset |
| Question to map | 24 dp | Spacer |
| Map to buttons | 8 dp | Tight spacing |
| Map height | 200–420 dp | Responsive: less on small screens, more on large |

### Mobile-First Sizing

| Screen height | Map height |
|---|---|
| < 600 dp | 200 dp |
| 600–800 dp | 35% of screen height |
| >= 800 dp | 420 dp |

---

## 5. Map Styling

### Tile Sources

| Theme | URL |
|---|---|
| Light | `https://tiles.openfreemap.org/styles/liberty` |
| Dark | `https://tiles.openfreemap.org/styles/dark` |

### Markers (Vector icons)

| Marker | File | Colour |
|---|---|---|
| Question city | `marker_blue_v2.xml` | Blue |
| Correct answer | `marker_green_v2.xml` | Green |
| Wrong answer | `marker_red_v2.xml` | Red |

On dark theme, markers are dimmed to 60% brightness.

### Polylines

| Property | Value |
|---|---|
| Width | 5 px |
| Colour (light) | Default MapLibre polyline colour |
| Colour (dark) | `rgb(217, 217, 217)` |
| Route | Geodesic (great circle) interpolated at 64 points |

### Camera

| State | Position |
|---|---|
| Before answer | Center on question city, zoom 4 |
| After answer | Fit bounds around all 3 cities, 100 px padding |
| On city click (after reveal) | Fit bounds around selected city + question city |

---

## 6. Animations

All extracted from the Compose UI code.

### 6.1 Score Bounce

When the score increases:
- Scale snaps to 1.0, animates to 1.4, then springs back to 1.0
- Spring damping: 0.3 (expand), 0.5 (settle)

### 6.2 Heart Shake

When a heart is lost:
- Scale snaps to 1.0, animates to 1.35, then springs back to 1.0
- Same spring parameters as score

### 6.3 Streak Bounce

When consecutive correct count increases:
- Same pattern: snap → 1.4 → spring back to 1.0

### 6.4 Correct Answer Pulse

On correct answer, the correct button pulses with a scale animation:
- Infinite repeat, reverse mode
- Duration varies by streak:
  | Streak | Duration | Max scale |
  |---|---|---|
  | < 3 | 800 ms | 1.06 |
  | 3–4 | 600 ms | 1.10 |
  | 5–9 | 400 ms | 1.10 |
  | 10–24 | 300 ms | 1.15 |
  | 25+ | 200 ms | 1.25 |

### 6.5 Status Text Scale

"Correct!" text pops in with a spring animation:
- Snaps to 0.5, springs to max scale (varies by streak: 1.15–1.70), then settles to 1.0

### 6.6 Confetti Effect

Particles burst on correct answer. Intensity scales with streak length.
- At streak ≥ 3, 5, 10, 25: more particles, bigger spread

### 6.7 Screen Transitions

| Transition | Direction | Timing |
|---|---|---|
| Game over screen | Slides in from right | `slideInHorizontally` |
| Medal celebration | Slides in from right | `slideInHorizontally` |
| Game over exit | Slides out to right | `slideOutHorizontally` |

### 6.8 Daily Goal Ring Fill

Animated over 1200 ms with `FastOutSlowInEasing` easing.

### 6.9 Goal Complete Glow

Infinite pulse at 800 ms cycle, alpha oscillates between 0.3 and 1.0.

---

## 7. Icons

All icons are vector drawables (Android `VectorDrawable` / XML format).

| Icon | Files | Usage |
|---|---|---|
| Star (score) | `ic_night_star_vector.xml`, `ic_day_star_vector.xml` | Score display |
| Full heart | `ic_night_full_heart_vector.xml`, `ic_day_full_heart_vector.xml` | Active lives |
| Empty heart | `ic_night_empty_heart_vector.xml`, `ic_day_empty_heart_vector.xml` | Lost lives |
| Back arrow | `ic_night_arrow_back.xml`, `ic_day_arrow_back.xml` | Navigation |
| Medal Gold | `ic_medal_gold.xml` | Gold medal icon |
| Medal Silver | `ic_medal_silver.xml` | Silver medal icon |
| Medal Bronze | `ic_medal_bronze.xml` | Bronze medal icon |

Each icon has a **light** and **dark** variant (different colours for each theme).

For the web demo: use emoji (⭐, ❤️, 🖤, ←) or SVG equivalents.

---

## 8. Colour Usage Reference

| Context | Light | Dark |
|---|---|---|
| Screen background | White | Near-black |
| Primary action buttons | Blue bg, white text | Orange bg, dark text |
| Selected state | Blue bg, white text | Orange bg, dark text |
| Unselected state | Transparent, blue border | Transparent, orange border |
| Correct | Green (#52C697) | Green (#52C697) |
| Wrong | Red (#E83634) | Red (#E83634) |
| Streak gold | #FFD700 | #FFD700 |
| Body text | Near-black (#171717) | Light gray (#D9D9D9) |

Primary colour changes between themes (blue → orange). Correct/wrong colours are consistent across themes.

---

## 9. Noteworthy Behaviour Details

- **Status bar**: Matches the primary colour in both themes. Text is dark on light, light on dark.
- **Back dialog**: Alert style with "Leave" (red text) and "Stay" (primary colour) buttons.
- **Answer reveal flow**: Map markers and polylines only appear after the answer is submitted — not before.
- **Disabled buttons**: Reduced to 0.4 opacity.
