import json
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import close_db, get_client, init_db
from models import (
    MuscleResponse, SessionCreate, SessionResponse, StateResponse,
    UserCreate, UserResponse, UserUpdate,
)
from risk import (
    MUSCLE_GROUPS, RISK_KEYS, aggregate_score, compute_loads,
    compute_trend, load_to_risk, make_recommendation,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()


app = FastAPI(title="Tendon API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Row helpers
# ---------------------------------------------------------------------------

def _to_dict(columns, row) -> dict:
    return {columns[i]: row[i] for i in range(len(columns))}


def _parse_session(d: dict) -> dict:
    d["groups"] = json.loads(d["groups"])
    d["entries"] = json.loads(d["entries"]) if d["entries"] else None
    return d


async def _require_user(username: str) -> dict:
    result = await get_client().execute(
        "SELECT * FROM users WHERE username = ?", [username]
    )
    if not result.rows:
        raise HTTPException(404, "User not found")
    return _to_dict(result.columns, result.rows[0])


async def _fetch_sessions(username: str) -> list[dict]:
    result = await get_client().execute(
        "SELECT * FROM sessions WHERE username = ? ORDER BY date DESC, rowid DESC",
        [username],
    )
    return [_parse_session(_to_dict(result.columns, row)) for row in result.rows]


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@app.post("/users", response_model=UserResponse, status_code=201)
async def login_or_create(body: UserCreate):
    db = get_client()
    result = await db.execute("SELECT * FROM users WHERE username = ?", [body.username])
    if not result.rows:
        await db.execute(
            "INSERT INTO users (username, gender, age) VALUES (?, ?, ?)",
            [body.username, body.gender or "", body.age],
        )
        result = await db.execute("SELECT * FROM users WHERE username = ?", [body.username])
    return _to_dict(result.columns, result.rows[0])


@app.get("/users/{username}", response_model=UserResponse)
async def get_user(username: str):
    return await _require_user(username)


@app.patch("/users/{username}", response_model=UserResponse)
async def update_user(username: str, body: UserUpdate):
    db = get_client()
    await _require_user(username)
    if body.gender is not None:
        await db.execute("UPDATE users SET gender = ? WHERE username = ?", [body.gender, username])
    if body.age is not None:
        await db.execute("UPDATE users SET age = ? WHERE username = ?", [body.age, username])
    result = await db.execute("SELECT * FROM users WHERE username = ?", [username])
    return _to_dict(result.columns, result.rows[0])


# ---------------------------------------------------------------------------
# State (loads, risk, aggregate score, trend)
# ---------------------------------------------------------------------------

@app.get("/users/{username}/state", response_model=StateResponse)
async def get_state(username: str):
    await _require_user(username)
    sessions = await _fetch_sessions(username)
    loads = compute_loads(sessions)
    risk = {
        g: {
            "level": RISK_KEYS[load_to_risk(loads[g])],
            "score": round(loads[g] / 4 * 100),
        }
        for g in MUSCLE_GROUPS
    }
    return {
        "loads": loads,
        "risk": risk,
        "aggregate_score": aggregate_score(loads),
        "trend": compute_trend(sessions),
    }


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

@app.get("/users/{username}/sessions", response_model=list[SessionResponse])
async def list_sessions(username: str):
    await _require_user(username)
    return await _fetch_sessions(username)


@app.post("/users/{username}/sessions", response_model=SessionResponse, status_code=201)
async def create_session(username: str, body: SessionCreate):
    db = get_client()
    await _require_user(username)
    sid = str(uuid.uuid4())[:8]
    entries_json = json.dumps([e.model_dump() for e in body.entries]) if body.entries else None
    await db.execute(
        "INSERT INTO sessions (id, username, date, name, groups, rpe, duration, soreness, entries)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [sid, username, body.date, body.name, json.dumps(body.groups),
         body.rpe, body.duration, body.soreness, entries_json],
    )
    result = await db.execute("SELECT * FROM sessions WHERE id = ?", [sid])
    return _parse_session(_to_dict(result.columns, result.rows[0]))


@app.put("/users/{username}/sessions/{session_id}", response_model=SessionResponse)
async def update_session(username: str, session_id: str, body: SessionCreate):
    db = get_client()
    await _require_user(username)
    check = await db.execute(
        "SELECT id FROM sessions WHERE id = ? AND username = ?", [session_id, username]
    )
    if not check.rows:
        raise HTTPException(404, "Session not found")
    entries_json = json.dumps([e.model_dump() for e in body.entries]) if body.entries else None
    await db.execute(
        "UPDATE sessions SET date=?, name=?, groups=?, rpe=?, duration=?, soreness=?, entries=?"
        " WHERE id=? AND username=?",
        [body.date, body.name, json.dumps(body.groups), body.rpe, body.duration,
         body.soreness, entries_json, session_id, username],
    )
    result = await db.execute("SELECT * FROM sessions WHERE id = ?", [session_id])
    return _parse_session(_to_dict(result.columns, result.rows[0]))


@app.delete("/users/{username}/sessions/{session_id}", status_code=204)
async def delete_session(username: str, session_id: str):
    db = get_client()
    await _require_user(username)
    check = await db.execute(
        "SELECT id FROM sessions WHERE id = ? AND username = ?", [session_id, username]
    )
    if not check.rows:
        raise HTTPException(404, "Session not found")
    await db.execute(
        "DELETE FROM sessions WHERE id = ? AND username = ?", [session_id, username]
    )


# ---------------------------------------------------------------------------
# Muscle detail
# ---------------------------------------------------------------------------

@app.get("/users/{username}/muscle/{group}", response_model=MuscleResponse)
async def get_muscle(username: str, group: str):
    if group not in MUSCLE_GROUPS:
        raise HTTPException(400, f"Unknown muscle group: {group}")
    await _require_user(username)
    sessions = await _fetch_sessions(username)
    loads = compute_loads(sessions)
    load_val = loads.get(group, 0.0)
    level = RISK_KEYS[load_to_risk(load_val)]
    recent = [s for s in sessions if group in s["groups"]][:3]
    return {
        "group": group,
        "load": round(load_val, 2),
        "level": level,
        "score": round(load_val / 4 * 100),
        "recommendation": make_recommendation(group, level),
        "recent_sessions": recent,
    }
