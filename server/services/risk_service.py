from datetime import datetime, timedelta, timezone

from models.schemas import MUSCLE_GROUPS
from services.workout_service import ensure_user
from store.data_store import store


def _level_for_score(score: float) -> str:
    if score >= 75:
        return "Critical"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Moderate"
    return "Low"


def _color_for_level(level: str) -> str:
    return {
        "Low": "green",
        "Moderate": "yellow",
        "High": "orange",
        "Critical": "red",
    }[level]


def _message_for(muscle_group: str, level: str) -> str:
    messages = {
        "Low": f"{muscle_group.title()} risk is low. Maintain balanced training and recovery.",
        "Moderate": f"Moderate {muscle_group} load. Watch fatigue and avoid stacking hard sessions.",
        "High": f"High {muscle_group} load. Reduce intensity and add recovery work.",
        "Critical": f"Critical {muscle_group} load. Prioritize rest and avoid training this muscle group today.",
    }
    return messages[level]


def get_workouts_last_n_days(username: str, days: int = 7) -> list[dict]:
    ensure_user(username)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    recent = []
    for workout in store.workouts[username]:
        logged_at = workout["logged_at"]
        if logged_at.tzinfo is None:
            logged_at = logged_at.replace(tzinfo=timezone.utc)
        if logged_at >= cutoff:
            recent.append(workout)
    return recent


def calculate_risk_scores(username: str, save_snapshot: bool = True) -> list[dict]:
    recent_workouts = get_workouts_last_n_days(username)
    scores = []

    for muscle_group in MUSCLE_GROUPS:
        muscle_workouts = [
            workout
            for workout in recent_workouts
            if workout["muscle_group"] == muscle_group
        ]
        if not muscle_workouts:
            score = 0.0
        else:
            volume = sum(workout["sets"] * workout["reps"] for workout in muscle_workouts)
            avg_intensity = sum(workout["intensity"] for workout in muscle_workouts) / len(
                muscle_workouts
            )
            frequency = len(muscle_workouts)
            score = min(
                100.0,
                (volume / 120.0 * 40.0)
                + (avg_intensity / 100.0 * 40.0)
                + (frequency / 5.0 * 20.0),
            )

        rounded = round(score, 2)
        level = _level_for_score(rounded)
        color = "gray" if rounded == 0 else _color_for_level(level)
        scores.append(
            {
                "muscle_group": muscle_group,
                "score": rounded,
                "level": level,
                "color": color,
            }
        )

    if save_snapshot:
        store.risk_history[username].append(
            {"timestamp": datetime.now(timezone.utc), "scores": scores}
        )

    return scores


def get_risk_history(username: str) -> list[dict]:
    ensure_user(username)
    return store.risk_history[username]


def get_recommendations(username: str) -> list[dict]:
    scores = calculate_risk_scores(username, save_snapshot=False)
    return [
        {
            **score,
            "message": _message_for(score["muscle_group"], score["level"]),
        }
        for score in scores
    ]
