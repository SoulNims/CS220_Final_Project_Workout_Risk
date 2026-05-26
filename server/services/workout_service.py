import json
import uuid

from fastapi import HTTPException

from database import get_client, row_to_dict
from models.schemas import SessionCreate
from services.user_service import user_exists


def _parse_session(d: dict) -> dict:
    d["groups"] = json.loads(d["groups"])
    d["entries"] = json.loads(d["entries"]) if d["entries"] else None
    return d


async def ensure_user(username: str) -> None:
    if not await user_exists(username):
        raise HTTPException(404, f"User '{username}' not found")


async def get_sessions(username: str) -> list[dict]:
    await ensure_user(username)
    db = get_client()
    result = await db.execute(
        "SELECT * FROM sessions WHERE username = ? ORDER BY date DESC, rowid DESC",
        [username],
    )
    return [_parse_session(row_to_dict(result.columns, row)) for row in result.rows]


async def create_session(username: str, body: SessionCreate) -> dict:
    await ensure_user(username)
    db = get_client()
    sid = str(uuid.uuid4())[:8]
    entries_json = (
        json.dumps([e.model_dump() for e in body.entries]) if body.entries else None
    )
    await db.execute(
        "INSERT INTO sessions (id, username, date, name, groups, rpe, duration, soreness, entries)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [sid, username, body.date, body.name, json.dumps(body.groups),
         body.rpe, body.duration, body.soreness, entries_json],
    )
    result = await db.execute("SELECT * FROM sessions WHERE id = ?", [sid])
    return _parse_session(row_to_dict(result.columns, result.rows[0]))


async def update_session(username: str, session_id: str, body: SessionCreate) -> dict:
    await ensure_user(username)
    db = get_client()
    check = await db.execute(
        "SELECT id FROM sessions WHERE id = ? AND username = ?", [session_id, username]
    )
    if not check.rows:
        raise HTTPException(404, "Session not found")
    entries_json = (
        json.dumps([e.model_dump() for e in body.entries]) if body.entries else None
    )
    await db.execute(
        "UPDATE sessions SET date=?, name=?, groups=?, rpe=?, duration=?, soreness=?, entries=?"
        " WHERE id=? AND username=?",
        [body.date, body.name, json.dumps(body.groups), body.rpe, body.duration,
         body.soreness, entries_json, session_id, username],
    )
    result = await db.execute("SELECT * FROM sessions WHERE id = ?", [session_id])
    return _parse_session(row_to_dict(result.columns, result.rows[0]))


async def delete_session(username: str, session_id: str) -> None:
    await ensure_user(username)
    db = get_client()
    check = await db.execute(
        "SELECT id FROM sessions WHERE id = ? AND username = ?", [session_id, username]
    )
    if not check.rows:
        raise HTTPException(404, "Session not found")
    await db.execute(
        "DELETE FROM sessions WHERE id = ? AND username = ?", [session_id, username]
    )
