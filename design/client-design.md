# Tendon — Client-Side Design Document

**CS 220 Final Project · Spring 2026**
**Author:** Nima Sherpa
**Last updated:** 2026-05-26

---

## 1. Project Overview

**Tendon** is a fullstack web application where gym users log their workouts and view an interactive human body avatar that color-codes each muscle group by current injury risk. The client is a React single-page application (SPA) that communicates with a FastAPI backend over a REST API.

**Core user flow:**
1. Register or sign in with email and password.
2. Land on the Dashboard showing an aggregate risk score and body avatar.
3. Log a workout by selecting muscle groups, entering sets/reps/RPE, and saving.
4. Watch the avatar update its colors to reflect new muscle load.
5. Open the Insights page to read AI-generated (Gemini) coaching analysis, a score breakdown, and actionable recommendations.
6. Browse past workouts in the Workouts log or History pages.
7. Reload the page — all data persists in the database (Turso via the backend).

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| UI framework | React 18 | Functional components only; no class components |
| Build tool | Vite 5 | Dev server on `localhost:5173`; production build to `dist/` |
| Language | JavaScript (ES2022) | No TypeScript; JSX for components |
| Styling | Plain CSS custom properties | No Tailwind, no CSS-in-JS library |
| HTTP client | Native `fetch` | Wrapped in a thin `api.js` service layer |
| Routing | Manual `page` state | Single `useState` in `App.jsx`; no React Router |
| Persistence | Browser `localStorage` | Auth token, username, theme preference |
| Session cache | Browser `sessionStorage` | AI coach response (one API call per tab session) |
| Fonts | Google Fonts | Inter (UI), Fraunces (display), JetBrains Mono (numbers) |
| Deployment | Vercel | Static SPA; `VITE_API_BASE_URL` env var points to Render |

---

## 3. File Structure

```
client/
├── index.html              ← Vite entry; loads Google Fonts; sets <html data-theme>
├── vite.config.js          ← Vite config (React plugin, port 5173)
└── src/
    ├── main.jsx            ← ReactDOM.createRoot → <App />
    ├── App.jsx             ← Root component; all global state lives here
    ├── data.js             ← Static constants: risk colors, muscle labels, helpers
    ├── muscleMap.js        ← Conversion helpers between API shapes and client shapes
    ├── icons.jsx           ← All SVG icon components (purely presentational)
    ├── index.css           ← Global CSS: tokens, resets, utility classes
    ├── services/
    │   └── api.js          ← All fetch() calls; single export `api` object
    └── components/
        ├── LoginPage.jsx       ← Auth screen (login / register / forgot-password)
        ├── Sidebar.jsx         ← 248px fixed-left navigation (desktop)
        ├── Dashboard.jsx       ← Main landing page with hero score, avatar, trend
        ├── BodyAvatar.jsx      ← SVG body figure (front + back); muscle click targets
        ├── WorkoutsLog.jsx     ← Sortable full list of logged sessions
        ├── History.jsx         ← Timeline view of past sessions
        ├── Insights.jsx        ← AI coaching panel + score breakdown + recommendations
        ├── Notes.jsx           ← Private user notes (persisted to server)
        ├── AddWorkoutModal.jsx ← Multi-field workout entry modal
        ├── SettingsModal.jsx   ← Gender / age / logout settings
        └── ui/
            └── ShaderBackground.jsx  ← Animated WebGL red shader for login page
```

---

## 4. Application Architecture

### 4.1 Component Tree

```
<App>                               ← owns ALL global state
  ├── <LoginPage>                   ← rendered when username === ''
  │     └── <ShaderBackground>      ← animated canvas, login only
  ├── <Sidebar>                     ← always visible after login (desktop)
  ├── <main>
  │    ├── <Dashboard>              ← page === 'dashboard'
  │    │     ├── ScoreBar           ← inline sub-component
  │    │     ├── Stat               ← "This week" stats grid
  │    │     ├── AvatarCard         ← wraps <BodyAvatar>
  │    │     │     └── <BodyAvatar>
  │    │     ├── <TrendCard>        ← SVG line chart
  │    │     ├── <TodaysWorkouts>   ← collapsible today panel
  │    │     └── <SessionList>      ← recent workouts list
  │    ├── <WorkoutsLog>            ← page === 'log'
  │    ├── <History>                ← page === 'history'
  │    ├── <Insights>               ← page === 'insights'
  │    └── <Notes>                  ← page === 'notes'
  ├── <AddWorkoutModal>             ← overlay, open when showAdd === true
  │     └── <MuscleEntryCard>       ← one per selected muscle group
  └── <SettingsModal>               ← overlay, open when showSettings === true
```

### 4.2 State Management

All shared state is stored at the root `App` component and passed to children as props. There is no external state library (Redux, Zustand, etc.). State flows downward through props; mutations go upward through callback props.

| State variable | Type | Description |
|---------------|------|-------------|
| `username` | `string` | Server-assigned username (empty = logged out) |
| `displayName` | `string` | Full name from server for display |
| `gender` | `string` | `'male'` \| `'female'` \| `'other'` |
| `age` | `number \| null` | Used in AI recommendations |
| `theme` | `string` | `'light'` \| `'dark'`; drives `data-theme` on `<html>` |
| `page` | `string` | Active route: `'dashboard'` \| `'log'` \| `'history'` \| `'insights'` \| `'notes'` |
| `load` | `object` | Map of `muscleId → float (0–4)` reflecting server risk scores |
| `sessions` | `array` | Array of workout session objects (mapped from API) |
| `status` | `{loading, error}` | Global async status; error shown as a banner card |
| `showAdd` | `boolean` | Whether the Add Workout modal is open |
| `editing` | `session \| null` | The session being edited (null = new) |
| `showSettings` | `boolean` | Whether the Settings modal is open |
| `mobSidebarOpen` | `boolean` | Mobile sidebar drawer state |

### 4.3 Data Flow on Login

```
User submits login form
  → App.handleLogin()
    → api.login() or api.register()
      ← { token, user } from server
    → _applyAuthResponse(): writes to localStorage + sets state
  → useEffect on [username] fires
    → refreshServerState()
      → Promise.all([ api.getWorkouts(), api.getRiskScores(), api.getUser() ])
      → setSessions(workouts.map(apiWorkoutToSession))
      → setLoad(riskScoresToLoad(riskScores))
```

### 4.4 Data Flow on Save Workout

```
User saves AddWorkoutModal
  → App.onSaveWorkout(session, isEdit)
    → api.createWorkout() or api.updateWorkout()
    → closeModal()
    → refreshServerState()  ← pulls fresh load + sessions from server
```

The client never computes risk scores. After every write it re-fetches from the server and re-renders from those authoritative values.

---

## 5. API Service Layer (`services/api.js`)

All HTTP calls go through a single `api` export object. An internal `request()` helper handles:
- Prefixing with `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api`)
- Attaching `Authorization: Bearer <token>` from localStorage
- Setting `Content-Type: application/json`
- Parsing non-2xx responses as errors, reading `detail` from the JSON body

### Endpoints Used

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/auth/register` | Create account; returns `{token, user}` |
| POST | `/auth/login` | Sign in; returns `{token, user}` |
| GET | `/auth/security-question/:email` | Forgot-password step 1 |
| POST | `/auth/forgot-password` | Forgot-password step 2; returns `{token, user}` |
| GET | `/users/:username` | Fetch user profile (name, gender, age) |
| GET | `/users/:username/notes` | Fetch private notes |
| PUT | `/users/:username/notes` | Save private notes |
| POST | `/workouts/:username` | Create workout |
| GET | `/workouts/:username` | List all workouts |
| PUT | `/workouts/:username/:id` | Update workout |
| DELETE | `/workouts/:username/:id` | Delete workout |
| GET | `/risk/:username` | Get current risk scores for all muscles |
| GET | `/risk/:username/history` | Get 14-day daily aggregate scores |
| GET | `/ai/coach/:username` | Gemini AI coach bundle (analysis + plan + report) |

---

## 6. Screens

### 6.1 Login Page (`LoginPage.jsx`)

**Purpose:** First screen users see. Handles sign-in, account creation, and password recovery.

**Visual design:** Full-viewport dark red background (`#090102`) with an animated WebGL shader (`ShaderBackground`). The auth card floats in the center with a transparent glassmorphism style and white-on-dark typography.

**Modes (controlled by local `mode` state):**

| Mode | Key | Trigger |
|------|-----|---------|
| Sign in | `'login'` | Default on page load |
| Create account | `'register'` | "Create account" tab |
| Forgot — email lookup | `'forgot-email'` | "Forgot password?" link |
| Forgot — answer + reset | `'forgot-answer'` | After email lookup returns question |

**Login / Register fields:**
- Email (validated as `user@domain.tld`)
- Password (≥ 8 characters; `current-password` autocomplete on login, `new-password` on register)
- First name + Last name (register only; side-by-side grid)
- Security question selector (register only; 4 hardcoded options)
- Security answer (register only)

**Forgot password flow (2 steps):**
1. User enters email → client calls `api.getSecurityQuestion()` → question appears in next form
2. User answers the question and sets a new password → client calls `api.forgotPassword()` → logs user in automatically

**Validation:** Client-side first (empty check, email regex, length checks), then server errors shown in a red `var(--risk-crit)` inline message. The submit button shows "Connecting..." during the API call and is disabled while `loading === true`.

**Key design decision:** No separate "username" field. The server derives a username from the email; the client stores and uses only what the server returns. This prevents username-collision bugs on the client.

---

### 6.2 Dashboard (`Dashboard.jsx`)

**Purpose:** The main hub. Shows the user's current overall risk score, a body avatar, a 14-day trend chart, today's workouts, and a recent workouts preview.

**Layout (desktop):** Two-column grid within the main content column (`max-width: 960px`):
- Row 1: Risk hero (1.4fr) + This Week stats (1fr)
- Row 2: Avatar card (1fr) + Risk trend chart (1fr)
- Row 3: Today's Workouts (full width, collapsible)
- Row 4: Recent workouts (full width)

**Risk hero:**
- Fraunces display font; score number at 72px
- `ScoreBar`: horizontal progress bar, gradient from `#5A8FC7` (low) → `#C4564F` (critical); vertical tick mark at the current score
- Risk pill: one of `.pill.{low, mod, high, crit}` based on score bucket
- Text summary from `scoreLabel()` describing what the score means
- Two action buttons: "Log workout" (primary) and "Why this score?" (ghost → navigates to Insights)

**This Week stats card:**
- Sessions count, Avg RPE, total Volume (minutes), Sore zones count
- Each stat uses the `Stat` sub-component: Fraunces display number + colored delta badge

**Avatar card:**
- Wraps `<BodyAvatar>` with a "Tap a muscle to log workout" label
- Clicking any muscle region calls `onLogMuscle(muscleId)` in App, which:
  - If a workout exists today: adds the muscle to it and opens the modal pre-filled
  - If no workout today: creates a new session pre-filled with that muscle and the current time-of-day name

**Risk trend chart (TrendCard):**
- Pure SVG; `viewBox="0 0 460 200"`; responsive via `width="100%"`
- Area fill under curve with a gradient stop
- Hover interaction: a `<g>` per data point with an invisible `r=8` capture circle; on hover renders a tooltip rect with date and score
- X-axis labels every 3rd point (JetBrains Mono)
- Y-axis reference lines at 0, 25, 50, 75, 100 with dashed strokes

**Today's Workouts (collapsible):**
- Collapsed: shows muscle pill badges for all muscles worked today; "Add" button
- Expanded: one `TodayRow` per session (grouped by name); each row is clickable → opens modal for editing
- Empty state: prompt to log + "Log workout" primary button

---

### 6.3 Body Avatar (`BodyAvatar.jsx`)

**Purpose:** Interactive SVG body figure showing injury risk per muscle via color fill.

**Structure:** Two side-by-side SVG figures in a flex container:
- **Front view** (200×420 viewBox): head, shoulders (front), chest, abs, obliques, biceps, forearms L/R, quads, calves
- **Back view** (200×420 viewBox): head, shoulders (rear), upper back, lower back, glutes, triceps, forearms L/R, hamstrings, calves

Each muscle region is a `<Region>` group (`<g>`) that:
- Applies a CSS class `avatar-zone` (and `selected` when clicked)
- Attaches an `onClick` that calls `onSelect(id)` with the muscle ID string

**Color fill logic (`fill(key)`):**
```
load[key]  →  loadToRisk(v)  →  0=none → 'var(--body-blank)'
                               1=low  → #5A8FC7
                               2=mod  → #C99845
                               3=high → #C66D3F
                               4=crit → #C4564F
```

The avatar never calls the API itself. It receives `load` as a prop from App and re-renders whenever that object reference changes.

**Shapes used:**
- Head: `<ellipse>` + small `<rect>` for neck
- Chest / upper back: `<path>` with quadratic curves for organic shape
- Abs, lower back, quads, hamstrings, calves, biceps, triceps: `<rect>` with `rx` rounding
- Shoulders: paired `<ellipse>` elements
- Obliques, glutes: `<path>` shapes
- Forearms: `<rect>` + `<circle>` for wrist
- Feet: `<ellipse>` (not interactive, always `var(--body-blank)`)

---

### 6.4 Add Workout Modal (`AddWorkoutModal.jsx`)

**Purpose:** Overlay form for creating and editing workout sessions.

**Trigger:** Opens when `showAdd === true` in App. Receives `editing` (null for new, session object for edit).

**Structure:**

```
Modal backdrop (click-outside to close)
  └── Modal container (600px wide, 90vh max, flex column)
        ├── Header: breadcrumb + close button
        ├── Scrollable body
        │     ├── Session name (Fraunces style, inline input)
        │     ├── Property grid (date / RPE slider / Soreness slider / Duration stepper)
        │     ├── Muscle group toggle buttons
        │     └── MuscleEntryCard per selected muscle
        └── Footer: hint text + Cancel / Save buttons
```

**Muscle group toggles:** All 15 non-head muscles from `MUSCLE_LABEL` rendered as pill buttons. Selected = filled black with checkmark; deselected = bordered with plus icon.

**MuscleEntryCard (per muscle):**
- Collapsible (chevron header showing set count + avg reps summary)
- Set table: rows with set number | reps stepper (− N +) | optional weight input | optional reps input | remove row button
- "Add set" dashed button
- Optional fields: "Weight" and "Notes" can be toggled on/off per muscle entry
- Notes field: `<textarea>` for free text per muscle group

**Property inputs:**
- Date: native `<input type="date">`
- RPE (1–10): custom `Slider` component; color shifts from yellow (mod) to orange (high) to red (crit) at thresholds 6 and 8
- Soreness (0–10): same `Slider` component; color shifts at thresholds 4 and 7
- Duration: `NumberField` stepper (− value +) with 5-minute steps; range 5–300

**Edit mode:** When `editing.id` is truthy, the modal is in edit mode. The existing `id` is preserved in the submitted object. On submit, `App.onSaveWorkout(session, isEdit=true)` calls `api.updateWorkout()` instead of `api.createWorkout()`.

**Submit gate:** Requires a non-empty name AND at least one muscle entry. The Save button is visually disabled (opacity 0.4, `cursor: not-allowed`) until both conditions are met.

---

### 6.5 Workouts Log (`WorkoutsLog.jsx`)

**Purpose:** Full sortable list of all sessions logged by the user.

**Features:**
- Displays all sessions from the `sessions` array, newest first
- Each row shows: risk color bar, session name, date, muscle group pills (up to 3 + overflow count), RPE + duration badge, chevron
- Clicking a row opens the Add Workout modal in edit mode for that session
- Delete button per row; calls `App.onDelete(id)`, which resolves `session.backendIds` for batch-delete support
- Empty state with a "Log your first workout" call-to-action

---

### 6.6 History (`History.jsx`)

**Purpose:** Timeline view of past sessions.

**Layout:** Vertical timeline. Each date with sessions shows the date as a heading and the sessions under it. The 14-day trend chart is also shown above the timeline for context.

---

### 6.7 Insights (`Insights.jsx`)

**Purpose:** The "why this score?" deep-dive page. Shows the AI coach panel, a score factor breakdown, a top-loaded muscles chart, and actionable recommendations.

**AI Coach panel:**
- Loads on page mount via `api.getAiCoach(username)` 
- Reads and writes a `sessionStorage` cache keyed `irp_ai_coach_<username>` to avoid redundant Gemini API calls within a tab session
- Only caches responses where `source === 'gemini'`; demo/fallback responses are re-fetched
- Status labels: `idle → loading → gemini | demo | error | cached`
- "Refresh AI coach" button forces a fresh Gemini call; "Clear cache" wipes sessionStorage and re-fetches
- Displays `report.summary`, `report.trend`, and a disclaimer if present

**AI analysis + plan cards (2-column grid):**
- Left: "Smart workout analyzer" — displays `analysis.patterns` (up to 4 bullets) and `analysis.focus_area`
- Right: "7-day plan preview" — displays `plan.plan` (up to 4 days) each with focus and exercise list

**Score breakdown table:**
- `BreakdownRow` components for each factor: label, numeric value, signed contribution pill
- Positive contributions shown in `.pill.high`; negative (buffers) in `.pill.low`
- Footer note explaining the formula

**Top loaded muscles bar chart:**
- Top 6 muscles by load, sorted descending
- Each row: muscle name | load value (mono) | colored horizontal bar (width = `val/4 * 100%`)
- Bar color matches the muscle's risk level via `RISK_COLORS[loadToRisk(val)]`

**Recommendations list:**
- `Recommendation` components: colored left border (4px), title, body text, muscle tag pills
- Priority levels: `high` (red), `mod` (amber), `low` (blue)

---

### 6.8 Notes (`Notes.jsx`)

**Purpose:** Private user notes, saved to the server per user account.

**Behavior:** Loads existing notes on mount via `api.getNotes()`. Auto-saves via `api.saveNotes()` on blur or after a debounce interval. Accessible from the sidebar under "Private".

---

### 6.9 Settings Modal (`SettingsModal.jsx`)

**Purpose:** Allows users to update gender and age (used in AI recommendations) and to log out.

**Fields:** Gender selector (Male / Female / Other) and an age number input. Saved locally to localStorage. Logout clears all `irp_*` localStorage keys and resets all App state.

---

## 7. Design System

### 7.1 Color Tokens

All colors are defined as CSS custom properties on `:root` and overridden under `[data-theme="dark"]`. Components reference only these tokens — never hardcoded hex values (except on the login page's special dark override).

**Light mode (default):**
```css
--bg:             #FFFFFF
--bg-elev:        #FFFFFF
--bg-sidebar:     #F7F7F5
--bg-hover:       #EFEFED
--bg-active:      #E7E7E4
--border:         #ECECEA
--border-strong:  #DCDCD8
--text:           #37352F
--text-soft:      #73706B
--text-muted:     #9B9892
--body-blank:     #E5E5E2
```

**Risk colors (theme-independent):**
```css
--risk-none: #8B95A5    (No data — gray)
--risk-low:  #5A8FC7    (Low — blue)
--risk-mod:  #C99845    (Moderate — amber)
--risk-high: #C66D3F    (High — orange)
--risk-crit: #C4564F    (Critical — red)
```

### 7.2 Typography

| Role | Font | Weights | Used for |
|------|------|---------|---------|
| `Inter` | UI text | 400, 500, 600, 700 | Body, labels, buttons, inputs |
| `Fraunces` | Display | 400, 500, 600 | Page titles, score numbers, workout names |
| `JetBrains Mono` | Data | 400, 500 | Risk scores, RPE, duration, axis labels |

Applied via the `.display` and `.mono` CSS utility classes.

### 7.3 Spacing and Radii

```css
--radius-sm: 4px    (inputs, small chips)
--radius-md: 6px    (buttons, inner cards)
--radius-lg: 10px   (cards, modals)
```

Main content column: `max-width: 960px`, padding `56px 96px 120px`.

### 7.4 Component Classes

| Class | Description |
|-------|-------------|
| `.btn` | Default bordered button |
| `.btn.primary` | Filled black button |
| `.btn.ghost` | No border, no background |
| `.btn-icon` | 28×28 icon-only square |
| `.card` | `--bg-elev`, 1px border, `--radius-lg`, 22px padding |
| `.card-title` | Flex row with space-between; used at top of every card |
| `.pill` | Small inline badge with `.dot` color indicator |
| `.pill.{none,low,mod,high,crit}` | Risk-colored pill variants |
| `.badge` | Gray background badge for metadata (week number, counts) |
| `.badge.mono` | Badge with monospace font |
| `.input` | Full-width text input; focus ring in `--accent` |
| `.label` | Small uppercase field label |
| `.nav-item` | Sidebar navigation row |
| `.modal-backdrop` | Full-screen overlay for modals |
| `.modal` | Centered modal container with `--shadow-md` |
| `.fade-up` | Page entry animation (opacity + translateY) |
| `.mono` | Apply JetBrains Mono |
| `.display` | Apply Fraunces serif |

### 7.5 Dark Mode

Toggled by setting `data-theme="dark"` on `<html>`, which the CSS handles with an attribute selector. The preference is persisted to `localStorage` key `irp_theme` and restored on page load.

The avatar visualization surface always uses a dark palette regardless of the app theme (separate `--viz-*` tokens defined on `.avatar-canvas`).

---

## 8. Layout

### 8.1 Desktop

```
┌──────────────┬─────────────────────────────────────────┐
│   Sidebar    │           Main content area             │
│   248px      │     max-width: 960px, centered          │
│   fixed left │     scrollable                          │
│              │                                         │
│  ● Dashboard │                                         │
│  ● Workouts  │                                         │
│  ● History   │                                         │
│  ● Insights  │                                         │
│    ────────  │                                         │
│  ● Notes     │                                         │
│              │                                         │
│  + Log       │                                         │
│  ◑ Dark mode │                                         │
│  ⚙ Settings  │                                         │
│  [User pill] │                                         │
└──────────────┴─────────────────────────────────────────┘
```

App shell: `display: flex; height: 100vh; overflow: hidden`

### 8.2 Mobile

- The sidebar is hidden; a bottom tab bar takes its place
- Bottom tab bar: Home | Workouts | History | Insights | + Log | ≡ More
- The "More" button opens the sidebar as a drawer overlay (`mob-sidebar-visible` class)
- Tab bar fixed at bottom, `z-index: 200`

---

## 9. Local Storage Strategy

The client uses `localStorage` for session persistence between page loads and `sessionStorage` for in-tab caching.

| Key | Value | Cleared on |
|-----|-------|-----------|
| `irp_token` | JWT bearer token | Logout |
| `irp_username` | Username string | Logout |
| `irp_display_name` | Full name | Logout |
| `irp_email` | Email address | Logout |
| `irp_gender` | `'male'` \| `'female'` \| `'other'` | Logout |
| `irp_age` | Number as string | Logout |
| `irp_theme` | `'light'` \| `'dark'` | Never (theme persists across accounts) |
| `irp_ai_coach_<username>` *(sessionStorage)* | JSON coach bundle | Tab close or cache clear |

On page load, `App` initializes each state from localStorage using lazy `useState` initializers. If `irp_token` is absent, the user is treated as logged out and `LoginPage` is rendered.

---

## 10. Data Mapping Layer (`muscleMap.js`)

The server and client share the same muscle ID strings (e.g. `'forearms_l'`, `'upper_back'`), so the mapping layer is mostly identity. Its real purpose is:

1. **`apiWorkoutToSession(session)`** — converts a raw server workout object to the client's session shape, ensuring `backendIds`, `entries`, and `soreness` defaults are always present.

2. **`riskScoresToLoad(scores)`** — converts an array of `{group, score}` objects from `/risk/:username` into the `load` map (muscle ID → float 0–4) used by `BodyAvatar`. Conversion: `load = score / 25`, clamped to `[0, 4]`.

3. **`sessionToWorkoutPayload(session)`** — used inside `api.js` to sanitize outgoing data (clamp RPE to 1–10, ensure groups are unique, etc.).

---

## 11. Authentication Flow

The app uses token-based auth. The token is a JWT returned by the server on login/register and stored in `localStorage`.

```
             Client                        Server
               │                             │
  form submit  │──── POST /auth/login ───────►│
               │◄─── { token, user } ─────────│
  store token  │                             │
  set username │                             │
               │                             │
  all requests │──── Authorization: Bearer ──►│
               │     <token>                 │
               │◄─── 200 + data ─────────────│
               │                             │
  logout       │  clear localStorage keys    │
               │  reset all state            │
```

On any `401` response from the server, the app should clear the stale token and return to the login screen. (This is handled implicitly because a `401` throws an error that surfaces in `status.error` and the subsequent re-render clears `username`.)

---

## 12. AI Integration (Gemini)

The client treats AI as a pure display concern. It calls one endpoint (`/ai/coach/:username`) and renders what comes back.

**Client responsibilities:**
- Send the request with a `force=true` query param when the user clicks "Refresh AI coach"
- Cache the response in `sessionStorage` to avoid burning Gemini quota on re-renders
- Only cache responses with `source === 'gemini'`; fallback/demo data is never cached
- Render three sections from the response: `analysis.patterns`, `plan.plan[]`, `report.summary`

**Client non-responsibilities:**
- The client never sends workout data directly to Gemini
- The client never interprets `source` to change visual behavior (it just displays a badge)
- Prompt construction, rate limiting, and fallback logic are entirely server-side

---

## 13. Responsive Behavior

| Breakpoint | Layout change |
|-----------|--------------|
| ≥ 768px (desktop) | Sidebar visible; bottom tab bar hidden |
| < 768px (mobile) | Sidebar hidden (drawer); bottom tab bar shown |

Dashboard cards stack to single column on narrow screens. The body avatar scales down via `width="100%"` on the SVG elements. The modal gains `max-width: 100vw` and `border-radius: 0` on mobile.

---

## 14. Deployment

The client is deployed as a static Vite build to **Vercel**.

**Build command:** `vite build`
**Output directory:** `dist/`
**Environment variable:** `VITE_API_BASE_URL` = `https://<render-app>.onrender.com/api`

Vercel handles HTTPS and CDN distribution. All routes serve `index.html` (SPA fallback) because the client handles its own routing via `page` state.

**Local development:**
```bash
cd client
npm install
VITE_API_BASE_URL=http://localhost:8000/api npm run dev
# → http://localhost:5173
```

---

## 15. Key Design Decisions

| Decision | Rationale |
|---------|-----------|
| No React Router | With 5 named pages managed by a single `page` string, React Router adds complexity without benefit. All navigation state survives in-page. |
| All state in App.jsx | Avoids prop-drilling at the cost of a larger root component. With this app's size (< 10 sibling pages) Context or Zustand would be premature. |
| Native fetch, no Axios | Axios adds ~14 kB for behavior the thin `request()` wrapper already covers. |
| `sessionStorage` for AI cache | AI responses are expensive (Gemini quota). One call per tab session is the right tradeoff. Persisting to `localStorage` would serve a stale coaching snapshot indefinitely. |
| Risk scores never computed on client | The formula involves server-side state (decay over time, per-user history). Any client duplicate would diverge. The client renders only what the server returns. |
| Plain CSS custom properties | The design system is small and consistent. Adding Tailwind or a CSS-in-JS library would slow the build and force all developers to learn a new API. |
| `data-theme` attribute on `<html>` | Standard pattern for CSS-variable theming; a single stylesheet override handles dark mode with no JS branching in component render code. |
