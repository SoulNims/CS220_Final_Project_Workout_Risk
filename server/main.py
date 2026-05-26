import json
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_conn, init_db
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
    init_db()
    yield


app = FastAPI(title="Tendon API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_user(username: str, conn):
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not row:
        raise HTTPException(404, "User not found")
    return row


def _fetch_sessions(username: str, conn) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM sessions WHERE username = ? ORDER BY date DESC, rowid DESC",
        (username,),
    ).fetchall()
    result = []
    for r in rows:
        s = dict(r)
        s["groups"] = json.loads(s["groups"])
        s["entries"] = json.loads(s["entries"]) if s["entries"] else None
        result.append(s)
    return result


def _row_to_session(row) -> dict:
    s = dict(row)
    s["groups"] = json.loads(s["groups"])
    s["entries"] = json.loads(s["entries"]) if s["entries"] else None
    return s


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@app.post("/users", response_model=UserResponse, status_code=201)
def login_or_create(body: UserCreate):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (body.username,)).fetchone()
    if not row:
        conn.execute(
            "INSERT INTO users (username, gender, age) VALUES (?, ?, ?)",
            (body.username, body.gender or "", body.age),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE username = ?", (body.username,)).fetchone()
    conn.close()
    return dict(row)


@app.get("/users/{username}", response_model=UserResponse)
def get_user(username: str):
    conn = get_conn()
    row = _require_user(username, conn)
    conn.close()
    return dict(row)


@app.patch("/users/{username}", response_model=UserResponse)
def update_user(username: str, body: UserUpdate):
    conn = get_conn()
    _require_user(username, conn)
    if body.gender is not None:
        conn.execute("UPDATE users SET gender = ? WHERE username = ?", (body.gender, username))
    if body.age is not None:
        conn.execute("UPDATE users SET age = ? WHERE username = ?", (body.age, username))
    conn.commit()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return dict(row)


# ---------------------------------------------------------------------------
# State (loads, risk, aggregate score, trend)
# ---------------------------------------------------------------------------

@app.get("/users/{username}/state", response_model=StateResponse)
def get_state(username: str):
    conn = get_conn()
    _require_user(username, conn)
    sessions = _fetch_sessions(username, conn)
    conn.close()

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
def list_sessions(username: str):
    conn = get_conn()
    _require_user(username, conn)
    sessions = _fetch_sessions(username, conn)
    conn.close()
    return sessions


@app.post("/users/{username}/sessions", response_model=SessionResponse, status_code=201)
def create_session(username: str, body: SessionCreate):
    conn = get_conn()
    _require_user(username, conn)
    sid = str(uuid.uuid4())[:8]
    entries_json = (
        json.dumps([e.model_dump() for e in body.entries]) if body.entries else None
    )
    conn.execute(
        "INSERT INTO sessions (id, username, date, name, groups, rpe, duration, soreness, entries)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (sid, username, body.date, body.name, json.dumps(body.groups),
         body.rpe, body.duration, body.soreness, entries_json),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM sessions WHERE id = ?", (sid,)).fetchone()
    conn.close()
    return _row_to_session(row)


@app.put("/users/{username}/sessions/{session_id}", response_model=SessionResponse)
def update_session(username: str, session_id: str, body: SessionCreate):
    conn = get_conn()
    _require_user(username, conn)
    row = conn.execute(
        "SELECT id FROM sessions WHERE id = ? AND username = ?", (session_id, username)
    ).fetchone()
    if not row:
        raise HTTPException(404, "Session not found")
    entries_json = (
        json.dumps([e.model_dump() for e in body.entries]) if body.entries else None
    )
    conn.execute(
        "UPDATE sessions SET date=?, name=?, groups=?, rpe=?, duration=?, soreness=?, entries=?"
        " WHERE id=? AND username=?",
        (body.date, body.name, json.dumps(body.groups), body.rpe, body.duration,
         body.soreness, entries_json, session_id, username),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return _row_to_session(row)


@app.delete("/users/{username}/sessions/{session_id}", status_code=204)
def delete_session(username: str, session_id: str):
    conn = get_conn()
    _require_user(username, conn)
    row = conn.execute(
        "SELECT id FROM sessions WHERE id = ? AND username = ?", (session_id, username)
    ).fetchone()
    if not row:
        raise HTTPException(404, "Session not found")
    conn.execute("DELETE FROM sessions WHERE id = ? AND username = ?", (session_id, username))
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Muscle detail
# ---------------------------------------------------------------------------

@app.get("/users/{username}/muscle/{group}", response_model=MuscleResponse)
def get_muscle(username: str, group: str):
    if group not in MUSCLE_GROUPS:
        raise HTTPException(400, f"Unknown muscle group: {group}")
    conn = get_conn()
    _require_user(username, conn)
    sessions = _fetch_sessions(username, conn)
    conn.close()

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
