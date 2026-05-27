# Client Change Log

<!-- Template:
## YYYY-MM-DD — Short title
**Files:** list of changed files
**What:** what changed and why
-->

## 2026-05-26 — Security question password reset UI
**Files:** `client/src/components/LoginPage.jsx`, `client/src/services/api.js`, `client/src/App.jsx`
**What:** Added forgot-password flow and security question capture on registration. `LoginPage` has a new "Forgot password?" link (login mode only) that opens a two-step flow: (1) enter username → server fetches and displays their security question; (2) enter answer + new password → server verifies and logs you in automatically. Register mode now shows a security question dropdown (4 preset options) and an answer field. `api.js` gained `getSecurityQuestion` and `forgotPassword` helpers. `App.jsx` gained `handleForgotPassword` which is passed to `LoginPage` as `onForgotPassword`; `handleLogin` now forwards `security_question`/`security_answer` on register.

## 2026-05-26 — Avatar tap-to-log, collapsible Today's workouts, deduplication
**Files:** `src/App.jsx`, `src/components/Dashboard.jsx`, `src/components/AddWorkoutModal.jsx`
**What:** Three UX changes: (1) Tapping a muscle on the body avatar now opens the workout modal pre-filled with that muscle. If a session already exists today it opens in edit mode with the new muscle added; otherwise a new session template is created. (2) "Today's workouts" card moved below the avatar/trend grid and is now a collapsible tab — collapsed by default showing muscle pill summary; expanded shows the full grouped list. (3) Sessions with the same workout name are merged into one display row (deduplication), preventing the "9 identical rows" problem. `AddWorkoutModal.isEdit` now checks for a real `id` so pre-filled templates open as "New" not "Edit".

## 2026-05-26 — Fix workout logging: align client with session-based API
**Files:** `src/services/api.js`, `src/muscleMap.js`, `src/App.jsx`
**What:** The server was updated to a session-based API (`POST /workouts/{username}` expects `{name, date, groups, rpe, duration, soreness, entries}`) but the client still sent the old per-entry format (`muscle_group, sets, reps, intensity`), causing 422 validation errors shown as `[object Object],...`. Fixed three things: (1) `onSaveWorkout` in `App.jsx` now posts/updates the whole session in one call matching `SessionCreate`; (2) `apiWorkoutToSession` in `muscleMap.js` reads the new `SessionResponse` fields directly; (3) `riskScoresToLoad` reads `score.group` (the field the server actually returns) instead of `score.muscle_group`; (4) `api.js` handles 422 array-detail errors as readable strings.

## 2026-05-25 — Move gender to Settings; add age field
**Files:** `LoginPage.jsx`, `App.jsx`, `Sidebar.jsx`, `components/SettingsModal.jsx` (new)
**What:** Removed gender picker from login — login is now username-only. Added `SettingsModal` accessible via the sidebar "Settings" button, containing gender (body type) and age fields plus a Log out button. Age persisted to `localStorage` as `irp_age`. Sidebar "Settings / Logout" split: settings opens the modal, logout lives inside the modal.
