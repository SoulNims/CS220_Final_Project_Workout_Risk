# Client Change Log

<!-- Template:
## YYYY-MM-DD — Short title
**Files:** list of changed files
**What:** what changed and why
-->

## 2026-05-26 — Fix workout logging: align client with session-based API
**Files:** `src/services/api.js`, `src/muscleMap.js`, `src/App.jsx`
**What:** The server was updated to a session-based API (`POST /workouts/{username}` expects `{name, date, groups, rpe, duration, soreness, entries}`) but the client still sent the old per-entry format (`muscle_group, sets, reps, intensity`), causing 422 validation errors shown as `[object Object],...`. Fixed three things: (1) `onSaveWorkout` in `App.jsx` now posts/updates the whole session in one call matching `SessionCreate`; (2) `apiWorkoutToSession` in `muscleMap.js` reads the new `SessionResponse` fields directly; (3) `riskScoresToLoad` reads `score.group` (the field the server actually returns) instead of `score.muscle_group`; (4) `api.js` handles 422 array-detail errors as readable strings.

## 2026-05-25 — Move gender to Settings; add age field
**Files:** `LoginPage.jsx`, `App.jsx`, `Sidebar.jsx`, `components/SettingsModal.jsx` (new)
**What:** Removed gender picker from login — login is now username-only. Added `SettingsModal` accessible via the sidebar "Settings" button, containing gender (body type) and age fields plus a Log out button. Age persisted to `localStorage` as `irp_age`. Sidebar "Settings / Logout" split: settings opens the modal, logout lives inside the modal.
