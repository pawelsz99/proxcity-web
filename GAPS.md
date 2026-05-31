# ProxCity Web — Parity Gaps

Everything the Android app does that the web demo must replicate for parity. Organized by priority.

---

## P0 — Must Have (game doesn't feel right without)

### 1. Sound Effects

The Android app uses `SoundPlayer` (`android.media.SoundPool`) for:

| Event | Sound |
|---|---|
| Correct answer | Short positive chime |
| Wrong answer | Short negative tone |
| Time up | Same as wrong |
| Button click | UI tap sound |
| Game over | Longer ending sound |

**Web implementation**: Use `Audio` or `Web Audio API` with small preloaded audio files (or generate tones programmatically). Load sounds as base64 data URIs or small MP3 files to avoid CDN dependency.

**Files**: `js/audio.js` — preload and play sounds.

### 2. Score Persistence (localStorage)

Android uses Room DB. Web must use `localStorage`:

| Key | Value | Purpose |
|---|---|---|
| `highscore_all` | Number | Best score in All mode |
| `highscore_quick` | Number | Best score in Quick Game |
| `daily_score` | Number | Today's cumulative score |
| `daily_date` | String (YYYY-MM-DD) | Which day the daily score belongs to |
| `daily_streak` | Number | Consecutive days hitting daily goal |
| `total_games_played` | Number | Lifetime games played |

On game over: compare current score to stored high score. If higher, update and show "NEW HIGH SCORE!".

Daily goal: add current game score to `daily_score`. If date changed, reset to 0. If `daily_score >= daily_goal` (50), increment `daily_streak`.

### 3. Loading States

Android loads from local assets (instant). Web fetches over network (async). Need:

| State | UI |
|---|---|
| Page loading | Spinner or skeleton while scripts/CDN resources load |
| Data loading | "Loading cities..." with progress or spinner (4.4 MB fetch) |
| Map loading | Spinner overlay until MapLibre fires `style.load` |
| Question generating | Brief spinner or "Generating question..." (rare, but happens) |
| Transition between rounds | Brief loading state during next round generation |

**Without these**: the user sees a blank screen or stale UI during network requests.

### 4. Error/Empty States

| Scenario | Android behavior | Web needed |
|---|---|---|
| No cities match filter | Toast: "No cities available" | Show error message on screen |
| H3 gridDiskDistances fails | Log error, return empty, fallback | Catch error, show message |
| MapLibre style fails | `onStyleLoadError` callback, shows fallback message | Show "Map unavailable" overlay, game still playable |
| CDN script fails to load | N/A (local libraries) | Check `typeof h3 !== 'undefined'`, show error |
| City data fetch fails | N/A (local asset) | Show "Failed to load city data" with retry button |

### 5. Timer Accuracy

Android uses `CountDownTimer` (precise). Web `setInterval` drifts.

Use **delta-based timer**: record `Date.now()` at start, compute remaining time via `Date.now() - startTime` on each tick. Adjust display to match. Critical for the 12-second countdown to feel fair.

### 6. Tab Visibility

Android pauses the timer when the app goes to background (`onPause`). Web needs:

```js
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Pause timer, record remaining time
  } else {
    // Resume timer with remaining time
  }
});
```

Without this: switching tabs burns the full 12 seconds instantly.

### 7. Browser Back Button

Android has a hardware back button with a confirmation dialog. Web needs:

- `window.addEventListener('popstate', ...)` to intercept browser back
- Show same dialog: "Leave Game? Your progress will be lost."
- Push state on game start so back returns to menu

### 8. Map Marker Click After Reveal

Android allows tapping a revealed city marker to zoom the map. Web needs `maplibregl.Marker` click event handler that calls `map.fitBounds([questionCity, clickedCity])`.

---

## P1 — Should Have (noticeable if missing)

### 9. Animations

| Animation | Android implementation | Web alternative |
|---|---|---|
| Score bounce | Scale 1.0 → 1.4 → 1.0 (spring) | CSS `transform: scale()` with `cubic-bezier` or JS animation |
| Heart shake | Scale 1.0 → 1.35 → 1.0 (spring) | Same approach |
| Streak pulse | Scale 1.0 ↔ 1.06+ (infinite) | CSS `@keyframes` pulse animation |
| Correct button pulse | Scale pulse, duration varies by streak | CSS animation with class toggle |
| Status text pop | Spring scale 0.5 → max → 1.0 | CSS `@keyframes` |
| Confetti | Custom Compose Canvas particles | CSS/Canvas confetti (small library or 30 lines of JS) |
| Game over slide-in | Slide from right | CSS `transform: translateX()` transition |
| Daily ring fill | Animated 1200ms arc | SVG circle with `stroke-dashoffset` animation |

### 10. Responsive Layout for Desktop

Android is portrait phone only. Web must handle:

| Viewport | Layout |
|---|---|
| Phone portrait (< 480px) | Full-width map, stacked buttons (like Android) |
| Phone landscape (480-768px) | Map takes left half, question/buttons on right |
| Tablet / desktop (> 768px) | Centered max-width container (600px), map capped at 420px height |

Without this: the game looks broken on desktop or landscape.

### 11. Keyboard Navigation

Android has no keyboard. But web accessibility demands it:

| Key | Action |
|---|---|
| `Tab` | Cycle through answer buttons, next round, play again |
| `Enter` / `Space` | Select focused button |
| `Escape` | Back / leave game dialog |
| `1` / `2` | Quick-select option A or B |

### 12. Screen Reader Support

| Element | ARIA needed |
|---|---|
| Timer countdown | `aria-live="polite"` on timer text |
| Score changes | `aria-live="polite"` on score |
| "Correct!" / "Incorrect!" | `role="status"` on status text |
| Answer buttons | `aria-label="Select [city name]"` |
| Map markers | `aria-label="[City name]"` |
| Game over screen | `role="dialog"`, focus trap |

---

## P2 — Nice to Have (polish, can come later)

### 13. Dark/Light Theme Toggle

Android follows system setting. Web should too:

```css
@media (prefers-color-scheme: dark) { ... }
```

Plus a manual toggle button if the user wants to override.

### 14. Haptic Feedback

Android uses vibration on wrong answer. Web can use:

```js
navigator.vibrate(50); // Short buzz on wrong answer
```

Only works with user gesture and on supported browsers. Non-critical.

### 15. Correct/Incorrect Color Flash on Map

Android shows green/red markers after reveal. Already in the map plan, but verify the polyline colours also change (gray for both, not green/red — this is correct per the Android code).

### 16. Streak Fire Emoji + Gold Border

Android shows 🔥 + count at streak ≥ 2, gold top-bar border at streak ≥ 3, pulsing at ≥ 10. Web needs the same thresholds.

### 17. Back Confirmation Dialog

Android AlertDialog with "Leave" (red) and "Stay" (primary). Web needs a modal overlay with the same text and button styling.

### 18. Service Worker for Offline

Android caches map tiles offline. Web can register a service worker to cache `cityData.json`, MapLibre tiles, and app shell. Makes the game work offline after first visit. Complex to set up but important for parity.

### 19. Debug Mode

Android has `debugKValues` flag that shows H3 K-values in a Toast. Web could show in a small overlay toggled by `?debug=true` URL parameter.

### 20. URL Hash Routing

Android uses Intent extras for game mode. Web should use URL hash:

| URL | Screen |
|---|---|
| `proxcity-web.github.io/` | Home |
| `proxcity-web.github.io/#play` | Mode selection |
| `proxcity-web.github.io/#game/all` | Game in All mode |
| `proxcity-web.github.io/#game/quick` | Game in Quick Game mode |
| `proxcity-web.github.io/#gameover` | Game over screen |

Enables browser refresh without losing game state (store state in sessionStorage).

---

## Summary

### Minimal Parity (P0 only, ~4 hours extra)

The demo plan covers core gameplay. Adding P0 items (sound, persistence, loading/error states, timer accuracy, tab visibility, back button, map click) brings it from "tech demo" to "real app feel."

### Full Parity (P0 + P1, ~8 hours extra)

Adding animations, responsive desktop layout, and keyboard/accessibility makes it a polished web app usable by everyone.

### Feature Parity (P0 + P1 + P2, ~12 hours extra)

Service worker, theme toggle, debug mode, URL routing — matches the Android app in depth and polish.

---

## Perceived Quality Checklist

- [ ] Timer pauses when switching tabs
- [ ] Browser back button shows leave confirmation
- [ ] Sound plays on correct/wrong answer
- [ ] Score bounces on increment
- [ ] Heart empties with animation on wrong answer
- [ ] Streak counter shows at ≥2 consecutive correct
- [ ] Top bar border turns gold at streak ≥3
- [ ] Confetti bursts on correct answer
- [ ] Map shows only question marker before answer
- [ ] Map shows all 3 markers + polylines after answer
- [ ] Clicking a revealed city zooms map
- [ ] Distances shown in km on answer buttons after reveal
- [ ] Game over slides in from right
- [ ] New high score is detected and shown
- [ ] Daily goal is tracked across sessions
- [ ] Spinner shown during data loading
- [ ] Error message shown if data fails to load
- [ ] Game works offline after first visit
- [ ] Buttons work with keyboard (Tab + Enter)
- [ ] Screen reader announces timer and score changes
- [ ] Layout works on desktop and mobile
