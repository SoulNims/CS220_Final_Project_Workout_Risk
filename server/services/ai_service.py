from __future__ import annotations

import json
import os
import ssl
from datetime import date, datetime, timedelta, timezone
from urllib import error, request

import certifi
from dotenv import load_dotenv

from models.schemas import MUSCLE_GROUPS
from services.risk_service import get_risk_scores
from services.workout_service import ensure_user, get_sessions

load_dotenv()

DISCLAIMER = (
    "This is general fitness guidance, not medical advice. Stop if you feel pain "
    "and consult a qualified professional for injuries."
)
CACHE_TTL = timedelta(minutes=30)
_coach_cache: dict[str, tuple[datetime, dict]] = {}


# ---------------------------------------------------------------------------
# Context builder
# ---------------------------------------------------------------------------

async def _workout_context(username: str) -> dict:
    await ensure_user(username)
    sessions = await get_sessions(username)
    risk_scores = await get_risk_scores(username)

    cutoff = (date.today() - timedelta(days=30)).isoformat()
    recent = [s for s in sessions if s["date"] >= cutoff]

    trained = set()
    for s in recent:
        trained.update(s["groups"])
    untrained = [m for m in MUSCLE_GROUPS if m not in trained]

    return {
        "username": username,
        "session_count_30_days": len(recent),
        "sessions_30_days": [
            {
                "date": s["date"],
                "name": s["name"],
                "groups": s["groups"],
                "rpe": s["rpe"],
                "duration": s["duration"],
                "soreness": s["soreness"],
            }
            for s in recent
        ],
        "risk_scores": risk_scores,
        "untrained_muscles": untrained,
    }


# ---------------------------------------------------------------------------
# Gemini call (synchronous — acceptable blocking for low-traffic class project)
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict | None:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(cleaned[start: end + 1])
    except json.JSONDecodeError:
        return None


def _call_gemini(prompt: str) -> dict | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.35, "responseMimeType": "application/json"},
    }
    gemini_request = request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )
    try:
        ctx = ssl.create_default_context(cafile=certifi.where())
        with request.urlopen(gemini_request, timeout=12, context=ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except (OSError, error.HTTPError, json.JSONDecodeError):
        return None

    parts = (
        data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    )
    return _extract_json("".join(p.get("text", "") for p in parts))


# ---------------------------------------------------------------------------
# Fallbacks (no Gemini key or call failed)
# ---------------------------------------------------------------------------

def _highest_risk(scores: list[dict]) -> dict:
    return max(scores, key=lambda s: s["score"])


def _lowest_risk_groups(scores: list[dict], limit: int = 3) -> list[str]:
    return [s["group"] for s in sorted(scores, key=lambda s: s["score"])[:limit]]


def _fallback_analysis(context: dict) -> dict:
    scores = context["risk_scores"]
    highest = _highest_risk(scores)
    untrained = context["untrained_muscles"]

    patterns = []
    if context["session_count_30_days"] == 0:
        patterns.append("No sessions logged in the last 30 days.")
    else:
        patterns.append(
            f"{context['session_count_30_days']} sessions logged in the past 30 days."
        )
    if untrained:
        patterns.append(f"No recent load on: {', '.join(untrained[:4])}.")
    patterns.append(
        f"Highest risk area: {highest['group']} ({highest['level']}, score {highest['score']})."
    )

    return {
        "source": "demo",
        "patterns": patterns,
        "risk_notes": [
            "Risk is computed from accumulated RPE load across all logged sessions.",
            "Balance repeated high-load muscles with undertrained muscle groups.",
        ],
        "focus_area": (
            f"Prioritize recovery for {highest['group']} "
            f"and add work for undertrained muscles."
        ),
        "disclaimer": DISCLAIMER,
    }


def _fallback_plan(context: dict) -> dict:
    scores = context["risk_scores"]
    highest = _highest_risk(scores)
    low_risk = _lowest_risk_groups(scores)

    safe_focus = [
        "Lower body", "Core stability", "Mobility and recovery",
        "Back and posterior chain", "Single-leg strength",
        "Conditioning", "Rest and light mobility",
    ]
    exercises = [
        ["Goblet squat", "Romanian deadlift", "Calf raises"],
        ["Dead bug", "Side plank", "Pallof press"],
        ["Zone 2 bike", "Hip mobility", "Thoracic rotations"],
        ["Lat pulldown", "Cable row", "Face pulls"],
        ["Split squat", "Step-ups", "Hamstring curl"],
        ["Incline walk", "Farmer carry", "Core circuit"],
        ["Walk", "Stretching", "Foam rolling"],
    ]
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    plan = [
        {
            "day": day,
            "focus": safe_focus[i],
            "exercises": exercises[i],
            "reason": (
                f"Highest risk: {highest['group']} ({highest['level']}); "
                f"lower-risk options include {', '.join(low_risk)}."
            ),
        }
        for i, day in enumerate(days)
    ]
    return {"source": "demo", "plan": plan, "disclaimer": DISCLAIMER}


def _fallback_report(context: dict) -> dict:
    scores = context["risk_scores"]
    highest = _highest_risk(scores)
    low_risk = _lowest_risk_groups(scores)
    sessions = context["session_count_30_days"]

    return {
        "source": "demo",
        "title": "Weekly Training Health Report",
        "summary": (
            f"You logged {sessions} session(s) in the past 30 days. "
            f"Highest risk area: {highest['group']} ({highest['level']}, score {highest['score']})."
        ),
        "trend": (
            "Check your aggregate risk score daily to see whether load is "
            "building or recovering over time."
        ),
        "focus": (
            f"Reduce repeated load on {highest['group']} and consider training "
            f"lower-risk areas: {', '.join(low_risk)}."
        ),
        "disclaimer": DISCLAIMER,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def _fallback_coach(context: dict) -> dict:
    return {
        "analysis": _fallback_analysis(context),
        "plan": _fallback_plan(context),
        "report": _fallback_report(context),
    }


def _normalize_coach(ai: dict) -> dict | None:
    analysis = ai.get("analysis")
    plan = ai.get("plan")
    report = ai.get("report")
    if not isinstance(analysis, dict) or not isinstance(plan, dict) or not isinstance(report, dict):
        if not isinstance(plan, list):
            return None
    plan_days = plan.get("plan") if isinstance(plan, dict) else plan
    if not isinstance(plan_days, list):
        return None
    return {
        "analysis": {
            "source": "gemini",
            "patterns": analysis.get("patterns", [])[:6],
            "risk_notes": analysis.get("risk_notes", [])[:6],
            "focus_area": analysis.get("focus_area", ""),
            "disclaimer": DISCLAIMER,
        },
        "plan": {
            "source": "gemini",
            "plan": plan_days[:7],
            "disclaimer": DISCLAIMER,
        },
        "report": {
            "source": "gemini",
            "title": report.get("title", "Weekly Training Health Report"),
            "summary": report.get("summary", ""),
            "trend": report.get("trend", ""),
            "focus": report.get("focus", ""),
            "disclaimer": DISCLAIMER,
        },
    }


async def get_ai_coach(username: str, force: bool = False) -> dict:
    now = datetime.now(timezone.utc)
    cached = _coach_cache.get(username)
    if cached and not force and now - cached[0] < CACHE_TTL:
        return cached[1]

    context = await _workout_context(username)
    prompt = (
        "You are a careful fitness coach and analytics assistant. Return JSON only "
        "with keys analysis, plan, and report. analysis must contain patterns "
        "(array of strings), risk_notes (array of strings), and focus_area (string). "
        "plan must contain key plan, an array of 7 objects with day, focus, "
        "exercises array, and reason. report must contain title, summary, trend, "
        "and focus strings. Use the risk scores and session data. Do not diagnose "
        "injuries or give medical advice. Use this context:\n"
        f"{json.dumps(context, default=str)}"
    )
    ai = _call_gemini(prompt)
    normalized = _normalize_coach(ai) if ai else None
    if normalized:
        _coach_cache[username] = (now, normalized)
        return normalized
    return _fallback_coach(context)


async def get_smart_analysis(username: str) -> dict:
    context = await _workout_context(username)
    prompt = (
        "You are a fitness analytics assistant. Return JSON only with keys: "
        "patterns (array of strings), risk_notes (array of strings), focus_area (string). "
        "Analyze session habits, muscle imbalances, repeated load, and risk trends. "
        "Do not diagnose injuries. Use this context:\n"
        f"{json.dumps(context, default=str)}"
    )
    ai = _call_gemini(prompt)
    if ai:
        return {
            "source": "gemini",
            "patterns": ai.get("patterns", [])[:6],
            "risk_notes": ai.get("risk_notes", [])[:6],
            "focus_area": ai.get("focus_area", ""),
            "disclaimer": DISCLAIMER,
        }
    return _fallback_analysis(context)


async def get_workout_plan(username: str) -> dict:
    context = await _workout_context(username)
    prompt = (
        "You are a careful fitness planning assistant. Return JSON only with key plan, "
        "an array of 7 objects with day, focus, exercises array, and reason. "
        "Build a 7-day plan that avoids overloading high-risk muscles. "
        "Do not say the user is injured. Use this context:\n"
        f"{json.dumps(context, default=str)}"
    )
    ai = _call_gemini(prompt)
    if ai and isinstance(ai.get("plan"), list):
        return {"source": "gemini", "plan": ai["plan"][:7], "disclaimer": DISCLAIMER}
    return _fallback_plan(context)


async def get_weekly_report(username: str) -> dict:
    context = await _workout_context(username)
    prompt = (
        "You are a coach writing a concise weekly training health report. "
        "Return JSON only with title, summary, trend, and focus strings. "
        "Write 3-4 short sentences across those fields. No medical advice. "
        "Use this context:\n"
        f"{json.dumps(context, default=str)}"
    )
    ai = _call_gemini(prompt)
    if ai:
        return {
            "source": "gemini",
            "title": ai.get("title", "Weekly Training Health Report"),
            "summary": ai.get("summary", ""),
            "trend": ai.get("trend", ""),
            "focus": ai.get("focus", ""),
            "disclaimer": DISCLAIMER,
        }
    return _fallback_report(context)
