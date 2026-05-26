from fastapi import HTTPException

from risk import (
    MUSCLE_GROUPS, RISK_KEYS, aggregate_score, compute_loads,
    compute_trend, load_to_risk, make_recommendation,
)
from services.user_service import user_exists
from services.workout_service import get_sessions


async def _loads_and_sessions(username: str) -> tuple[dict, list]:
    if not await user_exists(username):
        raise HTTPException(404, f"User '{username}' not found")
    sessions = await get_sessions(username)
    return compute_loads(sessions), sessions


async def get_state(username: str) -> dict:
    loads, sessions = await _loads_and_sessions(username)
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


async def get_risk_scores(username: str) -> list[dict]:
    loads, _ = await _loads_and_sessions(username)
    return [
        {
            "group": g,
            "level": RISK_KEYS[load_to_risk(loads[g])],
            "score": round(loads[g] / 4 * 100),
        }
        for g in MUSCLE_GROUPS
    ]


async def get_recommendations(username: str) -> list[dict]:
    loads, _ = await _loads_and_sessions(username)
    return [
        {
            "group": g,
            "level": RISK_KEYS[load_to_risk(loads[g])],
            "score": round(loads[g] / 4 * 100),
            "message": make_recommendation(g, RISK_KEYS[load_to_risk(loads[g])]),
        }
        for g in MUSCLE_GROUPS
    ]


async def get_trend(username: str) -> list[dict]:
    _, sessions = await _loads_and_sessions(username)
    return compute_trend(sessions)
