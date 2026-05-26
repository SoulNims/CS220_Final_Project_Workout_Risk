# Tendon — Design System

> Sourced from HANDOFF.md. This is the canonical visual and data reference for Tendon. All components must use these tokens — do not substitute Tailwind color classes for theme or risk colors.

---

## Aesthetic

Notion-inspired: warm-neutral whites, calm grays, generous whitespace, no heavy shadows or gradients.

---

## Typography

| Role | Family | Weights |
|------|--------|---------|
| UI text | Inter | 400, 500, 600, 700 |
| Display / hero numbers / page titles | Fraunces | 400, 500, 600 (optical size 9–144) |
| Numeric data / score badges | JetBrains Mono | 400, 500 |

All three loaded from Google Fonts.

---

## Color Tokens (CSS custom properties)

### Light mode (default)

```css
--bg:             #FFFFFF;
--bg-elev:        #FFFFFF;
--bg-sidebar:     #F7F7F5;
--bg-hover:       #EFEFED;
--bg-active:      #E7E7E4;
--border:         #ECECEA;
--border-strong:  #DCDCD8;
--text:           #37352F;   /* Notion ink */
--text-soft:      #73706B;
--text-muted:     #9B9892;
--body-blank:     #E5E5E2;   /* unmapped muscle regions outside avatar */
--shadow-sm:      0 1px 2px rgba(15, 15, 15, 0.03);
--shadow-md:      0 4px 16px rgba(15, 15, 15, 0.06);
```

### Dark mode — `[data-theme="dark"]` on `<html>`

```css
--bg:             #191919;
--bg-elev:        #1E1E1E;
--bg-sidebar:     #202020;
--bg-hover:       #2A2A2A;
--bg-active:      #333333;
--border:         #2C2C2C;
--border-strong:  #3A3A3A;
--text:           #E8E6E1;
--text-soft:      #A8A49C;
--text-muted:     #6F6B65;
--body-blank:     #2C2C2C;
--shadow-sm:      0 1px 2px rgba(0, 0, 0, 0.4);
--shadow-md:      0 4px 16px rgba(0, 0, 0, 0.5);
```

### Avatar viz surface — always dark, regardless of app theme

The avatar is a data canvas, not UI chrome. It keeps its own dark surface in both light and dark mode.

```css
--viz-bg:         #14202E;
--viz-bg-soft:    #1B2A3D;
--viz-text:       #E8ECF1;
--viz-text-muted: #7C8AA0;
--viz-body:       #2C3E55;   /* fill for unmapped/no-data muscle regions */
```

---

## Risk Scale (5 levels)

| Key    | Solid color | Soft bg   | Label    |
|--------|-------------|-----------|----------|
| `none` | `#8B95A5`   | `#E8E8E6` | No data  |
| `low`  | `#5A8FC7`   | `#E2ECF6` | Low      |
| `mod`  | `#C99845`   | `#F4EAD4` | Moderate |
| `high` | `#C66D3F`   | `#F2DCCE` | High     |
| `crit` | `#C4564F`   | `#F2D7D5` | Critical |

**Rendering rule:** use the `.pill.{none,low,mod,high,crit}` CSS class to render risk badges. The client maps the server-returned `level` string to the class — it never computes colors from raw scores.

Dark mode pill overrides (lower opacity backgrounds, lighter text) are defined in `index.html` under `[data-theme="dark"] .pill.*`.

---

## Spacing & Radii

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 10px;
```

Main content column: `max-width: 960px`, padding `56px 96px 120px`.

---

## Muscle Group IDs (16 total)

These exact strings are used as API keys, avatar `<path>` IDs, and CSS selectors. Note bilateral forearms.

```
head
chest
abs
obliques
upper_back
lower_back
glutes
shoulders_front
shoulders_rear
biceps
triceps
forearms_l
forearms_r
quads
hamstrings
calves
```

---

## Data Model

### Session shape

```js
{
  id: 's9',
  date: '2026-05-25',          // ISO date string
  name: 'Morning workout',
  groups: ['chest', 'triceps', 'shoulders_front'],
  rpe: 7,                       // 1–10
  duration: 45,                 // minutes
  soreness: 5,                  // 1–10
  entries: [                    // optional — per-group set detail
    {
      group: 'chest',
      fields: ['weight', 'reps'],
      setRows: [{ rpe: 7, weight: '80kg', reps: '8' }, ...]
    }
  ]
}
```

`entries` is optional. Populate it for the current session's detail view; treat it as absent on older sessions.

### Risk math (server-side only — never reimplement on client)

```
load[group]     continuous float, 0..4
loadToRisk(x)   → 0..4 integer bucket (0=none, 1=low, 2=mod, 3=high, 4=crit)
aggregateScore  → min(100, avg(all loads) × 12 + max(load) × 14)
```

Peak-weighted so a single critical zone dominates the overall score.

**Load update on workout save:** `load[group] += 0.3 + (rpe / 10) × 0.6` per group in the session, capped at 4. Subtract the same amount on delete or when replacing an edited session.

---

## Layout

### Desktop

- Sidebar: 248px fixed left, `--bg-sidebar` background
- Main column: flex-1, scrollable, `max-width: 960px`, centered
- App shell: `display: flex; height: 100vh; overflow: hidden`

### Mobile

- Tab bar at bottom (Home / Workouts / History / Insights / + Log)
- Bottom sheet for Add Workout (no sidebar)

---

## Component Primitives

### Buttons

| Class | Description |
|-------|-------------|
| `.btn` | Default — bordered, `--bg-elev` background |
| `.btn.primary` | Filled — `--text` background, `--bg` text |
| `.btn.ghost` | No border, no background |
| `.btn-icon` | 28×28 icon-only button |

### Cards

`.card` — `--bg-elev` background, `1px solid --border`, `--radius-lg`, `22px` padding.

### Pills / risk badges

`.pill.{none,low,mod,high,crit}` — use the risk scale soft colors above. Always include a `.dot` span for the color dot.

### Inputs

`.input` — full width, `--bg-elev`, focus ring uses `--accent` / `--accent-soft`.

---

## Screens & Interactions

### Screens to implement

1. **Login** — username + gender selection (Male / Female / Other; Other → Male silhouette)
2. **Dashboard** — aggregate risk hero, This Week stats, Today's Workouts, body avatar + 14-day trend side by side, recent workouts
3. **Workouts log** — full sortable session list
4. **History** — timeline of past sessions
5. **Insights** — analytics / "why this score?" breakdown
6. **Add Workout modal** — muscle picker → sets/reps → RPE/duration/notes (multi-step)

### Key interactions to preserve

- Every muscle region on the avatar is a hit target; clicking opens the Muscle Zoom Panel
- Muscle Zoom Panel: side panel on desktop, modal on mobile
- Dark mode toggle via `data-theme` on `<html>`, persisted in `localStorage`
- Density toggle (compact / regular) — real setting, not a debug tool
- 14-day trend chart with hover crosshair (date + score)
- Calendar panel — collapsible, month view, workout days highlighted, click day → popup

---

## Open Items

- [ ] `entries` on sessions — always populate on new sessions, or keep optional?
- [ ] "PRs & milestones" and "Training calendar" sidebar items — placeholders, no screens designed yet
- [ ] 14-day trend — backend endpoint shape for rolling daily aggregate scores TBD
- [ ] "Export" button on trend card — cut from v1 or keep wired?
