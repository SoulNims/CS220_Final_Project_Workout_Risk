# CLAUDE.md

> Read this first. It defines the D4 process, document hierarchy, and v1 scope for Tendon (Injury Risk Predictor). For visual design, colors, and data model — see `design/design-system.md`.

---

## Project Identity

**Brand name:** Tendon

**One line description:** A client-server web app where gym users log workouts and see an interactive human body avatar that color-codes each muscle group by current injury risk.

**Stack:**
- Server: FastAPI, Pydantic, Uvicorn, in-memory Python dicts — deployed to Render
- Client: React 18, Vite, CSS custom properties, ES modules — deployed to Render as a static site
- No database. State resets on server restart. Intentional for v1.

---

## Project File Structure

```
project-root/
├── CLAUDE.MD                    ← this file (process rules + v1 scope)
├── HANDOFF.md                   ← design prototype handoff notes
├── design/
│   ├── design-system.md         ← colors, typography, data model, interactions
│   ├── api.md                   ← REST API contract (the law)
│   ├── server-design.md         ← FastAPI backend blueprint
│   ├── client-design.md         ← React frontend blueprint
│   ├── server-changes.md        ← server change log
│   └── client-changes.md        ← client change log
├── server/                      ← FastAPI Python code
└── client/                      ← React + Vite code
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── data.js
        ├── icons.jsx
        └── components/
            ├── LoginPage.jsx
            ├── Sidebar.jsx
            ├── Dashboard.jsx
            ├── BodyAvatar.jsx
            ├── MuscleZoomPanel.jsx
            ├── AddWorkoutModal.jsx
            ├── LogWorkoutModal.jsx
            ├── WorkoutsLog.jsx
            ├── History.jsx
            ├── Insights.jsx
            ├── CalendarPanel.jsx
            └── RiskLegend.jsx
```

---

## D4 Protocol (read before every task)

### 1. Document order of precedence

When two documents conflict, the higher one wins:
1. `api.md` — the contract between client and server
2. `server-design.md` and `client-design.md` — implementation blueprints
3. `design-system.md` — visual and data model spec
4. This file — process rules and v1 scope
5. Source code

If a task instruction conflicts with any of the above, stop and ask the human.

### 2. Change log discipline

After every completed task:
1. Append an entry to `server-changes.md` (backend work) or `client-changes.md` (frontend work)
2. Follow the template at the top of the change log file
3. Commit the code change and log entry together with a clear message

### 3. Never silently edit design documents

Do NOT edit `api.md`, `server-design.md`, `client-design.md`, or `design-system.md` unless the human explicitly asks. If a design doc seems wrong or incomplete, stop and ask first.

### 4. Stop on ambiguity

If a task is unclear, if docs contradict each other, or if the right path is not obvious — STOP and ask. Do not guess. Do not invent features not in the design.

### 5. No business logic on the client

Risk score formula and recommendation messages live ONLY on the server. The client renders what the server returns. The `aggregateScore` / `loadToRisk` functions in `client/src/data.js` are prototype scaffolding — remove them once the API is live.

---

## What "v1 Done" Looks Like

The user can:
1. Open the app and enter a username + choose gender
2. See a body avatar (all no-data fill, all gray)
3. Log a workout via the modal
4. See the corresponding muscle on the avatar change color
5. Click that muscle and see the zoom panel with risk details and recommendation
6. Toggle the calendar and see the workout on today's date
7. Reload the page and have everything persist (until the server restarts)

All seven steps must work end-to-end against the live Render backend. If any step fails, v1 is not done.

---

## Out of Scope for v1

Do not add these without an explicit request — treat any ask as a v2 discussion:

- User authentication or passwords (username only)
- Persistent database (in-memory only, by design)
- LLM-generated recommendations (deterministic formula only)
- Multiplayer or social features
- Charts beyond the 14-day trend sparkline
- Mobile native apps (web only)

Render deployment is **in scope** — it is the target demo environment.
