from __future__ import annotations

import json
import os
import ssl
from datetime import datetime, timedelta, timezone
from urllib import error, request

import certifi
from dotenv import load_dotenv

from models.schemas import MUSCLE_GROUPS
from services.risk_service import calculate_risk_scores
from services.workout_service import ensure_user
from store.data_store import store

load_dotenv()

DISCLAIMER = (
    "This is general fitness guidance, not medical advice. Stop if you feel pain "
    "and consult a qualified professional for injuries."
)


def _recent_workouts(username: str, days: int = 30) -> list[dict]:
    ensure_user(username)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    workouts = []
    for workout in store.workouts[username]:
        logged_at = workout["logged_at"]
        if logged_at.tzinfo is None:
            logged_at = logged_at.replace(tzinfo=timezone.utc)
        if logged_at >= cutoff:
            workouts.append(workout)
    return sorted(workouts, key=lambda item: item["logged_at"], reverse=True)


def _workout_context(username: str) -> dict:
    workouts = _recent_workouts(username, days=30)
    risk_scores = calculate_risk_scores(username, save_snapshot=False)
    trained_muscles = {workout["muscle_group"] for workout in workouts}
    untrained_muscles = [muscle for muscle in MUSCLE_GROUPS if muscle not in trained_muscles]
    volume_by_muscle = {
        muscle: sum(
            workout["sets"] * workout["reps"]
            for workout in workouts
            if workout["muscle_group"] == muscle
        )
        for muscle in MUSCLE_GROUPS
    }
    return {
        "username": username,
        "workout_count_30_days": len(workouts),
        "workouts_30_days": [
            {
                "muscle_group": workout["muscle_group"],
                "sets": workout["sets"],
                "reps": workout["reps"],
                "intensity": workout["intensity"],
                "logged_at": workout["logged_at"].isoformat(),
            }
            for workout in workouts
        ],
        "risk_scores": risk_scores,
        "risk_history": store.risk_history[username][-8:],
        "untrained_muscles": untrained_muscles,
        "volume_by_muscle": volume_by_muscle,
    }


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
        return json.loads(cleaned[start : end + 1])
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
        "generationConfig": {
            "temperature": 0.35,
            "responseMimeType": "application/json",
        },
    }
    body = json.dumps(payload).encode("utf-8")
    gemini_request = request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    try:
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        with request.urlopen(gemini_request, timeout=12, context=ssl_context) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (OSError, error.HTTPError, json.JSONDecodeError):
        return None

    parts = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [])
    )
    text = "".join(part.get("text", "") for part in parts)
    return _extract_json(text)


def _highest_risk(scores: list[dict]) -> dict:
    return max(scores, key=lambda score: score["score"])


def _lowest_risk_muscles(scores: list[dict], limit: int = 3) -> list[str]:
    return [
        score["muscle_group"]
        for score in sorted(scores, key=lambda item: item["score"])[:limit]
    ]


def _fallback_analysis(context: dict) -> dict:
    scores = context["risk_scores"]
    highest = _highest_risk(scores)
    untrained = context["untrained_muscles"]
    volume_by_muscle = context["volume_by_muscle"]
    top_volume = max(volume_by_muscle, key=volume_by_muscle.get)

    patterns = []
    if context["workout_count_30_days"] == 0:
        patterns.append("No workouts have been logged in the last 30 days.")
    else:
        patterns.append(
            f"{top_volume.title()} has the highest 30-day volume at {volume_by_muscle[top_volume]} total reps."
        )
    if untrained:
        patterns.append(
            f"No recent workouts were logged for {', '.join(untrained[:4])}."
        )
    patterns.append(
        f"The current highest risk muscle is {highest['muscle_group']} at {highest['level']} risk."
    )

    return {
        "source": "demo",
        "patterns": patterns,
        "risk_notes": [
            "The AI analyzer uses the server's existing risk scores as the source of truth.",
            "Balance repeated high-volume muscles with lower-risk muscle groups when planning the week.",
        ],
        "focus_area": (
            f"Prioritize recovery for {highest['muscle_group']} and add balanced work for undertrained muscles."
        ),
        "disclaimer": DISCLAIMER,
    }


def _fallback_plan(context: dict) -> dict:
    scores = context["risk_scores"]
    highest = _highest_risk(scores)
    low_risk = _lowest_risk_muscles(scores)
    safe_focus = [
        "Lower body",
        "Core stability",
        "Mobility and recovery",
        "Back and posterior chain",
        "Single-leg strength",
        "Conditioning",
        "Rest and light mobility",
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
    plan = []
    for index, day in enumerate(days):
        plan.append(
            {
                "day": day,
                "focus": safe_focus[index],
                "exercises": exercises[index],
                "reason": (
                    f"Current highest risk is {highest['muscle_group']} ({highest['level']}); "
                    f"this day emphasizes lower-risk options like {', '.join(low_risk)}."
                ),
            }
        )
    return {"source": "demo", "plan": plan, "disclaimer": DISCLAIMER}


def _fallback_report(context: dict) -> dict:
    scores = context["risk_scores"]
    highest = _highest_risk(scores)
    workouts = context["workout_count_30_days"]
    low_risk = _lowest_risk_muscles(scores)
    return {
        "source": "demo",
        "title": "Weekly Training Health Report",
        "summary": (
            f"You logged {workouts} workouts in the recent training window. "
            f"Your highest current risk area is {highest['muscle_group']} with a "
            f"{highest['level']} level and score of {highest['score']}."
        ),
        "trend": (
            "Risk history is generated whenever the dashboard loads. Use repeated "
            "snapshots over the week to compare whether scores are improving or rising."
        ),
        "focus": (
            f"This week, reduce repeated load on {highest['muscle_group']} and consider "
            f"training lower-risk areas such as {', '.join(low_risk)}."
        ),
        "disclaimer": DISCLAIMER,
    }


def get_smart_analysis(username: str) -> dict:
    context = _workout_context(username)
    prompt = (
        "You are a fitness analytics assistant. Return JSON only with keys: "
        "patterns (array of strings), risk_notes (array of strings), focus_area (string). "
        "Analyze workout habits, imbalances, repeated muscle load, and risk trends. "
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


def get_workout_plan(username: str) -> dict:
    context = _workout_context(username)
    prompt = (
        "You are a careful fitness planning assistant. Return JSON only with key plan, "
        "an array of 7 objects with day, focus, exercises array, and reason. Build a "
        "7-day plan around high-risk muscles using server risk scores. Avoid saying "
        "the user is injured. Use this context:\n"
        f"{json.dumps(context, default=str)}"
    )
    ai = _call_gemini(prompt)
    if ai and isinstance(ai.get("plan"), list):
        return {
            "source": "gemini",
            "plan": ai["plan"][:7],
            "disclaimer": DISCLAIMER,
        }
    return _fallback_plan(context)


def get_weekly_report(username: str) -> dict:
    context = _workout_context(username)
    prompt = (
        "You are a coach writing a concise weekly training health report. Return JSON "
        "only with title, summary, trend, and focus strings. Write 3-4 short report "
        "paragraphs total across those fields. Do not give medical advice. Use this context:\n"
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
