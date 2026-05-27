# Tendon — Server-Side Design Document

**CS 220 Final Project · Spring 2026**
**Author:** Nima Sherpa
**Last updated:** 2026-05-27

---

## 1. Project Overview

**Tendon** is a fullstack web application where gym users log workouts and see an interactive body avatar that color-codes each muscle group by current injury risk. The server is a FastAPI application that owns all business logic: user authentication, workout persistence, risk computation, and Gemini AI coaching.

**Core responsibilities of the server:**
1. Authenticate users (register, login, forgot-password via security question).
2. Persist workout sessions to a Turso (libSQL/SQLite-compatible) database.
3. Compute injury risk scores from accumulated session load — never delegated to the client.
4. Serve 14-day trend history for the risk score chart.
5. Call the Gemini API to generate AI coaching responses (analysis, 7-day plan, weekly report), with a deterministic fallback when the key is absent or the call fails.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Web framework | FastAPI 0.115+ | Async; Pydantic v2 for request/response validation |
| Server | Uvicorn (standard) | ASGI; `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Language | Python 3.11+ | Type-annotated throughout |
| Database driver | libsql-client 0.3+ | Async; works against local file DB and Turso cloud |
| Database | Turso (hosted libSQL) | SQLite-compatible; local dev uses `file:tendon.db` |
| AI | Google Gemini API | Model: `gemini-2.5-flash-lite` (configurable via env var) |
| Password hashing | PBKDF2-HMAC-SHA256 | 200,000 iterations; stdlib `hashlib` — no bcrypt dependency |
| Token auth | Custom HMAC-SHA256 | Stateless; 12-hour TTL; no JWT library dependency |
| HTTP (AI calls) | `urllib.request` | stdlib only; no `httpx`/`aiohttp` for outbound calls |
| TLS | `certifi` | CA bundle for Gemini HTTPS calls |
| Config | `python-dotenv` | Reads `.env` on startup; never committed |
| Testing | pytest + httpx | `pytest` for test runner; `httpx` for async test client |
| Deployment | Render (Docker) | `Dockerfile` in `server/`; env vars set in Render dashboard |

---

## 3. File Structure

```
server/
├── main.py                     ← FastAPI app factory; CORS; router registration
├── database.py                 ← DB client singleton; schema migrations on startup
├── risk.py                     ← Pure risk math: load computation, scoring, trend
├── models/
│   ├── __init__.py
│   └── schemas.py              ← All Pydantic request/response models
├── routers/
│   ├── __init__.py
│   ├── users.py                ← /auth/*, /users/* endpoints
│   ├── workouts.py             ← /workouts/* endpoints
│   ├── risk.py                 ← /risk/*, /recommendations/* endpoints
│   └── ai.py                   ← /ai/* endpoints
├── services/
│   ├── __init__.py
│   ├── auth_service.py         ← Password hashing, token creation/parsing, register/login
│   ├── user_service.py         ← User profile reads/writes; notes
│   ├── workout_service.py      ← Session CRUD; ensures user row exists
│   ├── risk_service.py         ← Bridges risk.py math with DB queries
│   └── ai_service.py          ← Gemini API calls; fallbacks; in-process cache
├── tests/
│   ├── conftest.py             ← pytest fixtures (test DB, test client)
│   ├── test_users.py
│   ├── test_workouts.py
│   ├── test_risk.py
│   └── test_ai.py
├── requirements.txt
├── Dockerfile
├── .env.example                ← Documents required env vars
└── tendon.db                   ← Local dev SQLite file (gitignored)
```

---

## 4. Application Architecture

### 4.1 Layer Overview

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────┐
│  Routers  (routers/*.py)                │
│  • Path parameter extraction            │
│  • Auth header forwarding               │
│  • Calls one service function per route │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Services  (services/*.py)              │
│  • Authorization checks                 │
│  • Business logic orchestration         │
│  • DB queries via database.get_client() │
│  • Calls risk.py for math               │
└───────────────────┬─────────────────────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
┌──────────────┐     ┌──────────────────┐
│  database.py │     │  risk.py         │
│  libsql-     │     │  Pure functions: │
│  client      │     │  no I/O, no DB   │
│  (Turso/     │     │  calls           │
│   SQLite)    │     └──────────────────┘
└──────────────┘
```

Routers never query the database directly. Services never know about HTTP. `risk.py` functions are pure (no I/O) — they accept lists of session dicts and return computed values, making them trivially testable.

### 4.2 App Startup (`main.py`)

On startup the `lifespan` context manager calls `init_db()`, which:
1. Creates the `libsql-client` singleton.
2. Runs `CREATE TABLE IF NOT EXISTS` for `users`, `sessions`, and `notes`.
3. Applies a list of idempotent `ALTER TABLE` migrations (each wrapped in `try/except` so already-applied migrations are silently skipped).

On shutdown `close_db()` closes the client connection cleanly.

CORS is configured with `allow_origins=["*"]` — acceptable for a student project. In production this should be restricted to the Vercel domain.

---

## 5. Database Schema

Three tables. All IDs are text strings.

### `users`

```sql
CREATE TABLE users (
    username             TEXT PRIMARY KEY,
    email                TEXT,
    first_name           TEXT NOT NULL DEFAULT '',
    last_name            TEXT NOT NULL DEFAULT '',
    password_hash        TEXT,
    gender               TEXT NOT NULL DEFAULT '',
    age                  INTEGER,
    security_question    TEXT,
    security_answer_hash TEXT
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
```

`username` is derived from the email prefix (e.g. `nimaj16g`) and de-duplicated with a counter suffix if taken.

### `sessions`

```sql
CREATE TABLE sessions (
    id       TEXT PRIMARY KEY,
    username TEXT NOT NULL REFERENCES users(username),
    date     TEXT NOT NULL,       -- ISO 8601: 'YYYY-MM-DD'
    name     TEXT NOT NULL,
    groups   TEXT NOT NULL,       -- JSON array of muscle group IDs
    rpe      INTEGER NOT NULL,    -- 1–10
    duration INTEGER NOT NULL,    -- minutes
    soreness INTEGER NOT NULL DEFAULT 5,  -- 1–10
    entries  TEXT                 -- JSON array of EntryItem objects (nullable)
);

CREATE INDEX idx_sessions_username ON sessions(username);
```

`groups` and `entries` are stored as JSON strings and parsed on read. This avoids a separate junction table while keeping the schema simple for a class project.

### `notes`

```sql
CREATE TABLE notes (
    username   TEXT PRIMARY KEY REFERENCES users(username),
    body       TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

One row per user. Upserted on every save.

---

## 6. Authentication

### 6.1 Password Hashing

Passwords and security answers are hashed with PBKDF2-HMAC-SHA256 at 200,000 iterations. The stored format is:

```
pbkdf2_sha256$200000$<base64url-salt>$<base64url-digest>
```

Verification uses `hmac.compare_digest` to avoid timing attacks.

### 6.2 Token Format

The server issues its own stateless tokens — no JWT library. Each token is:

```
<base64url(payload_json)>.<base64url(hmac_sha256_signature)>
```

The payload contains `{ "sub": "<username>", "exp": <unix_timestamp> }`. TTL is 12 hours. The signing secret is read from the `AUTH_SECRET` environment variable (`"dev-only-change-me"` if absent).

On every protected request, `require_user_access(username, authorization)` is called:
1. Extracts the token from `Authorization: Bearer <token>`.
2. Verifies the HMAC signature.
3. Checks the expiry timestamp.
4. Asserts the token's `sub` matches the `username` path parameter (users can only access their own data).

### 6.3 Username Derivation

Usernames are never supplied by the client. On register, the server derives a username from the email prefix:
- Strip everything after `@`
- Replace non-alphanumeric characters with `-`
- Lowercase, truncate to 32 characters
- Append `-2`, `-3`, etc. if the username is already taken

### 6.4 Forgot Password Flow

1. Client sends `GET /api/auth/security-question/{email}` → server returns the question text.
2. Client sends `POST /api/auth/forgot-password` with email, security answer, and new password → server verifies the answer hash, updates `password_hash`, returns a fresh token.

---

## 7. API Endpoints

All routes are mounted under the `/api` prefix. All protected routes require `Authorization: Bearer <token>`.

### 7.1 Auth

| Method | Path | Auth | Request body | Response |
|--------|------|------|-------------|---------|
| `POST` | `/api/auth/register` | None | `RegisterRequest` | `AuthResponse` (201) |
| `POST` | `/api/auth/login` | None | `AuthRequest` | `AuthResponse` |
| `GET` | `/api/auth/security-question/{email}` | None | — | `SecurityQuestionResponse` |
| `POST` | `/api/auth/forgot-password` | None | `ForgotPasswordRequest` | `AuthResponse` |

`AuthResponse`:
```json
{
  "token": "...",
  "user": {
    "username": "nimaj16g",
    "email": "nimaj16g@gmail.com",
    "first_name": "Nima",
    "last_name": "Sherpa",
    "gender": "male",
    "age": 21
  }
}
```

### 7.2 Users

| Method | Path | Auth | Request body | Response |
|--------|------|------|-------------|---------|
| `GET` | `/api/users/{username}` | Required | — | `UserResponse` |
| `PATCH` | `/api/users/{username}` | Required | `UserUpdate` | `UserResponse` |
| `GET` | `/api/users/{username}/notes` | Required | — | `NoteResponse` |
| `PUT` | `/api/users/{username}/notes` | Required | `NoteUpdate` | `NoteResponse` |

`UserUpdate` accepts optional `gender` (string) and `age` (integer).

### 7.3 Workouts

| Method | Path | Auth | Request body | Response |
|--------|------|------|-------------|---------|
| `GET` | `/api/workouts/{username}` | Required | — | `list[SessionResponse]` |
| `POST` | `/api/workouts/{username}` | Required | `SessionCreate` | `SessionResponse` (201) |
| `PUT` | `/api/workouts/{username}/{session_id}` | Required | `SessionCreate` | `SessionResponse` |
| `DELETE` | `/api/workouts/{username}/{session_id}` | Required | — | 204 No Content |

`SessionCreate` fields:

| Field | Type | Constraints |
|-------|------|------------|
| `date` | `str` | ISO date string `YYYY-MM-DD` |
| `name` | `str` | Non-empty |
| `groups` | `list[MuscleGroup]` | 1–16 valid muscle IDs |
| `rpe` | `int` | 1–10 |
| `duration` | `int` | > 0, minutes |
| `soreness` | `int` | 1–10, default 5 |
| `entries` | `list[EntryItem] \| null` | Optional per-group set detail |

`SessionResponse` adds `id` (UUID string) and `username` to the above fields.

### 7.4 Risk

| Method | Path | Auth | Response |
|--------|------|------|---------|
| `GET` | `/api/risk/{username}` | Required | `list[RiskScoreItem]` |
| `GET` | `/api/risk/{username}/state` | Required | `StateResponse` |
| `GET` | `/api/risk/{username}/history` | Required | `list[TrendPoint]` |
| `GET` | `/api/recommendations/{username}` | Required | `list[Recommendation]` |

`RiskScoreItem`:
```json
{ "group": "chest", "level": "mod", "score": 54 }
```

`StateResponse` — a single-request bundle for the Dashboard:
```json
{
  "loads": { "chest": 2.16, "biceps": 0.0, ... },
  "risk": { "chest": { "level": "mod", "score": 54 }, ... },
  "aggregate_score": 38,
  "trend": [ { "d": "May 14", "score": 22 }, ... ]
}
```

`TrendPoint`: `{ "d": "May 14", "score": 38 }` — 14 points, oldest first.

`Recommendation`: adds a `message` string to `RiskScoreItem` — a plain English sentence about what the user should do for that muscle group.

### 7.5 AI

| Method | Path | Auth | Query params | Response |
|--------|------|------|-------------|---------|
| `GET` | `/api/ai/coach/{username}` | Required | `force=false` | `AICoachResponse` |
| `GET` | `/api/ai/analyze/{username}` | Required | — | `SmartWorkoutAnalysis` |
| `GET` | `/api/ai/plan/{username}` | Required | — | `WorkoutPlanResponse` |
| `GET` | `/api/ai/report/{username}` | Required | — | `WeeklyHealthReport` |

The primary endpoint for the client is `/api/ai/coach/{username}`, which returns all three AI sections in one call. The individual endpoints (`/analyze`, `/plan`, `/report`) exist for debugging.

`AICoachResponse`:
```json
{
  "analysis": {
    "source": "gemini",
    "patterns": ["..."],
    "risk_notes": ["..."],
    "focus_area": "...",
    "disclaimer": "..."
  },
  "plan": {
    "source": "gemini",
    "plan": [
      { "day": "Monday", "focus": "...", "exercises": ["..."], "reason": "..." }
    ],
    "disclaimer": "..."
  },
  "report": {
    "source": "gemini",
    "title": "...",
    "summary": "...",
    "trend": "...",
    "focus": "...",
    "disclaimer": "..."
  }
}
```

`source` is `"gemini"` when a live Gemini call succeeded, `"demo"` when the fallback was used.

---

## 8. Risk Engine (`risk.py`)

All functions in `risk.py` are pure — no database access, no I/O. They accept Python lists/dicts and return computed values.

### 8.1 Load Computation

For each session, a bump is added to every muscle group in `session.groups`:

```python
bump = (0.3 + (rpe / 10) * 0.6) * volume_factor(total_reps)
load[group] = min(4.0, load[group] + bump)
```

`volume_factor` scales the bump by actual set volume:
```python
volume_factor(total_reps) = clamp(total_reps / 30, 0.5, 1.75)
```
If no `entries` are present for a group, `volume_factor` defaults to `1.0`.

All sessions for a user are accumulated — there is no time decay in v2.

### 8.2 Load → Risk Level

```python
def load_to_risk(load: float) -> int:
    if load == 0:   return 0  # "none"
    if load < 1.0:  return 1  # "low"
    if load < 2.0:  return 2  # "mod"
    if load < 3.5:  return 3  # "high"
    return 4                  # "crit"
```

The integer maps to `["none", "low", "mod", "high", "crit"]`.

The `score` field returned by the API is `round(load / 4 * 100)` — a 0–100 integer for display purposes.

### 8.3 Aggregate Score

```python
def aggregate_score(loads: dict) -> int:
    vals = [v for v in loads.values() if v > 0]
    if not vals:
        return 0
    return min(100, round(avg(vals) * 12 + max(vals) * 14))
```

Peak-weighted so a single critically loaded muscle dominates the overall score.

### 8.4 14-Day Trend

`compute_trend(sessions, days=14)` iterates from 13 days ago to today. For each day it filters sessions whose `date ≤ that day` (i.e., the cumulative state that day) and computes `aggregate_score(compute_loads(day_sessions))`. This produces a time series showing how risk has built up over two weeks.

### 8.5 Recommendations

Each muscle gets a static template message based on its risk level:

| Level | Message |
|-------|---------|
| `none` | `{label} has no recent training data. Log a session to start tracking.` |
| `low` | `{label} is fresh and recovered. Good day to train at full intensity.` |
| `mod` | `{label} has moderate fatigue. Light to moderate volume is fine; skip max-effort sets.` |
| `high` | `{label} is showing elevated load. Drop volume by ~30% or take a rest day.` |
| `crit` | `{label} is critically loaded. Rest at least 48–72 hours to prevent injury.` |

---

## 9. AI Integration (`services/ai_service.py`)

### 9.1 Context Builder

Before calling Gemini, the server assembles a context dict containing:
- Sessions from the last 30 days (date, name, groups, RPE, duration, soreness)
- Current risk scores for all 16 muscle groups
- List of muscle groups with no recent load

This context is serialized to JSON and appended to the Gemini prompt.

### 9.2 Gemini Call

The call uses `urllib.request` (stdlib) with a `certifi` CA bundle. The request:
- Posts to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Sends `{ "generationConfig": { "temperature": 0.35, "responseMimeType": "application/json" } }`
- Times out after 12 seconds

The response text is extracted from `candidates[0].content.parts[*].text`, stripped of any markdown code fences, then parsed as JSON.

### 9.3 In-Process Cache

`get_ai_coach` caches responses in a module-level dict `_coach_cache: dict[str, tuple[datetime, dict]]`. Cache TTL is 30 minutes. The `force=true` query parameter bypasses the cache. Only `source="gemini"` responses are cached (the client applies the same rule in sessionStorage).

**Note:** This cache is in-process memory on Render. It is lost on every deploy or restart. For a class project this is acceptable.

### 9.4 Fallback

If `GEMINI_API_KEY` is absent or the call fails (timeout, HTTP error, JSON parse failure, unexpected shape), the server returns a fully deterministic fallback response computed from the risk scores alone. The fallback always returns `source: "demo"`.

The normalization step (`_normalize_coach`) validates the Gemini response shape before using it. If required keys are missing, the fallback is used instead.

---

## 10. Pydantic Schemas (`models/schemas.py`)

Key models:

| Model | Used for |
|-------|---------|
| `AuthRequest` | Login body |
| `RegisterRequest` | Registration body (extends `AuthRequest`) |
| `AuthResponse` | Login / register response |
| `ForgotPasswordRequest` | Password reset body |
| `SecurityQuestionResponse` | Forgot-password step 1 response |
| `UserResponse` | User profile response |
| `UserUpdate` | Profile patch body |
| `NoteResponse` / `NoteUpdate` | Notes read / write |
| `SessionCreate` | Workout create / update body |
| `SessionResponse` | Workout read response |
| `SetRow` | One row in a muscle entry's set table |
| `EntryItem` | Per-muscle group set detail within a session |
| `RiskScoreItem` | One muscle's risk level + score |
| `StateResponse` | Dashboard bundle (loads + risk + score + trend) |
| `Recommendation` | Risk item + plain-English message |
| `TrendPoint` | One point in the 14-day trend (`d`, `score`) |
| `AICoachResponse` | Full AI coach bundle |
| `SmartWorkoutAnalysis` | Analysis section of AI response |
| `WorkoutPlanResponse` | 7-day plan section of AI response |
| `WeeklyHealthReport` | Weekly report section of AI response |

`MuscleGroup` is a `Literal` union of the 16 valid muscle ID strings. Pydantic rejects any request body that includes an unrecognized group name.

---

## 11. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TURSO_DATABASE_URL` | No | `file:tendon.db` | Turso DB URL (`libsql://` → converted to `https://`) |
| `TURSO_AUTH_TOKEN` | No (prod: yes) | `""` | Turso auth token |
| `AUTH_SECRET` | No (prod: yes) | `"dev-only-change-me"` | HMAC signing secret for tokens |
| `GEMINI_API_KEY` | No | `""` | Google Gemini API key; fallback used if absent |
| `GEMINI_MODEL` | No | `gemini-2.5-flash-lite` | Gemini model name |

Set these in a `.env` file for local dev (see `.env.example`). Set them as environment variables in the Render dashboard for production.

---

## 12. Deployment (Render)

The server deploys to **Render** using the `Dockerfile` in `server/`.

**Dockerfile summary:**
- Base image: `python:3.12-slim`
- Installs `requirements.txt`
- Copies application code
- Exposes port `$PORT` (Render injects this)
- CMD: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Local development:**
```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # fill in GEMINI_API_KEY etc.
uvicorn main:app --reload   # → http://localhost:8000
```

**Health check:** `GET /` returns `{"message": "Tendon API is running"}`.

**Interactive API docs:** `GET /docs` (Swagger UI) — available in dev, acceptable for the class project demo.

---

## 13. Testing

Tests live in `server/tests/` and use `pytest` + `httpx.AsyncClient`.

`conftest.py` sets `TURSO_DATABASE_URL=file:test_tendon.db` before the test session, wires up a `TestClient` against the FastAPI app, and cleans up the test DB file on teardown.

Test files:
- `test_users.py` — register, login, profile update, notes, forgot-password flow
- `test_workouts.py` — CRUD, auth enforcement, malformed group rejection
- `test_risk.py` — load computation accuracy, aggregate score, trend shape
- `test_ai.py` — fallback path when `GEMINI_API_KEY` is absent; response shape validation

Run tests:
```bash
cd server
pytest -v
```

---

## 14. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No JWT library | The custom HMAC token avoids a dependency and is fully auditable in ~40 lines. The format is compatible with the client's `localStorage` storage strategy. |
| Risk math in `risk.py` (pure functions) | Separating math from I/O makes the risk engine unit-testable without a database. The router → service → pure function layering also makes it easy to swap the DB later. |
| JSON columns for `groups` and `entries` | Avoids two additional junction tables for a class project. The trade-off (no SQL-level querying of individual groups) is acceptable given query patterns. |
| In-process Gemini cache | Avoids burning API quota on repeated page loads within a 30-minute window. The cache is lost on restart, which is acceptable — the client also caches in `sessionStorage`. |
| Synchronous `urllib` for Gemini | Keeps the dependency list minimal. Blocking a single async worker for 12 seconds max is acceptable for a low-traffic class project. |
| PBKDF2 over bcrypt | Stdlib-only; no compiled extension required in the Docker image. 200,000 iterations at SHA-256 is within current NIST guidance. |
| `soreness` column default 5 | Old sessions created before the field was added return a neutral value without a migration. |
| Idempotent `ALTER TABLE` migrations | Wrapping each migration in `try/except` lets the server start cleanly on both fresh and existing databases without a migration tool. |
