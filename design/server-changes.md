# Server Change Log

<!-- Template:
## YYYY-MM-DD — Short title
**Files:** list of changed files
**What:** what changed and why
-->

## 2026-05-26 — Initial FastAPI backend with SQLite persistence
**Files:** `server/main.py`, `server/database.py`, `server/models.py`, `server/risk.py`, `server/requirements.txt`
**What:** Created the FastAPI backend from scratch. Replaced the planned in-memory Python dicts with SQLite for real persistence across server restarts.

Schema: `users` (username, gender, age) and `sessions` (id, username, date, name, groups, rpe, duration, soreness, entries). Groups and entries stored as JSON text columns.

Endpoints:
- `POST /users` — login or create user
- `GET /users/{username}` — get user profile
- `PATCH /users/{username}` — update gender/age
- `GET /users/{username}/state` — returns loads, per-muscle risk, aggregate score, 14-day trend
- `GET /users/{username}/sessions` — list all sessions (newest first)
- `POST /users/{username}/sessions` — add session
- `PUT /users/{username}/sessions/{id}` — replace session
- `DELETE /users/{username}/sessions/{id}` — delete session
- `GET /users/{username}/muscle/{group}` — muscle zoom panel data (load, level, score, recommendation, recent sessions)

Risk logic lives entirely in `risk.py` per D4 Protocol rule #5 (no business logic on client). Deterministic recommendations used; Gemini integration left for v2.

**Next:** Wire the React client to call these endpoints instead of using mock data from `data.js`.

## 2026-05-26 — Merge Turso persistence into friend's router/Gemini architecture
**Files:** `models/schemas.py`, `services/*.py`, `routers/*.py`, `main.py`, `database.py`, `tests/*`, `requirements.txt`
**What:** Full merge of two divergent server implementations. Kept the friend's router/service/AI structure and Gemini integration; replaced the in-memory `DataStore` with Turso (libsql-client async). Updated muscle groups from 10 → 16 to match design-system.md. Replaced the workout model (sets/reps/intensity) with the session model (groups/rpe/duration/soreness). Added lifespan to main.py for Turso init/close. All 22 tests passing against a local file: test DB.

## 2026-05-26 — Swap SQLite stdlib for Turso (libsql-client)
**Files:** `server/database.py`, `server/main.py`, `server/requirements.txt`, `server/.env.example`
**What:** Replaced `sqlite3` with the async `libsql-client` SDK so the database is hosted on Turso in production. All route handlers converted to `async def`. A single global `Client` is created at startup and closed on shutdown. Local dev fallback: set `TURSO_DATABASE_URL=file:tendon.db` — no Turso account needed for local testing. Added `.env.example` documenting required env vars.
