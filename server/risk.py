import json
from datetime import date, timedelta

MUSCLE_GROUPS = [
    "head", "chest", "abs", "obliques", "upper_back", "lower_back",
    "glutes", "shoulders_front", "shoulders_rear", "biceps", "triceps",
    "forearms_l", "forearms_r", "quads", "hamstrings", "calves",
]

RISK_KEYS = ["none", "low", "mod", "high", "crit"]

MUSCLE_LABEL = {
    "head": "Head & neck",
    "chest": "Chest",
    "abs": "Abdominals",
    "obliques": "Obliques",
    "upper_back": "Upper back",
    "lower_back": "Lower back",
    "glutes": "Glutes",
    "shoulders_front": "Front delts",
    "shoulders_rear": "Rear delts",
    "biceps": "Biceps",
    "triceps": "Triceps",
    "forearms_l": "Left forearm",
    "forearms_r": "Right forearm",
    "quads": "Quads",
    "hamstrings": "Hamstrings",
    "calves": "Calves",
}

_RECOMMENDATIONS = {
    "none": "{label} has no recent training data. Log a session to start tracking.",
    "low":  "{label} is fresh and recovered. Good day to train at full intensity.",
    "mod":  "{label} has moderate fatigue. Light to moderate volume is fine; skip max-effort sets.",
    "high": "{label} is showing elevated load. Drop volume by ~30% or take a rest day.",
    "crit": "{label} is critically loaded. Rest at least 48–72 hours to prevent injury.",
}


def session_bump(rpe: int) -> float:
    return 0.3 + (rpe / 10) * 0.6


def volume_factor(total_reps: int | None) -> float:
    if total_reps is None:
        return 1.0
    return max(0.5, min(1.75, total_reps / 30))


def session_bump_with_reps(rpe: int, total_reps: int | None) -> float:
    return session_bump(rpe) * volume_factor(total_reps)


def _parse_groups(raw) -> list[str]:
    return raw if isinstance(raw, list) else json.loads(raw)


def _parse_entries(raw) -> list[dict]:
    if not raw:
        return []
    return raw if isinstance(raw, list) else json.loads(raw)


def _row_reps(row: dict) -> int:
    # The current set UI stores the displayed reps value in the historical
    # `rpe` field. Prefer an explicit `reps` value when older entries have it.
    value = row.get("reps", row.get("rpe", 0))
    try:
        return max(0, int(value))
    except (TypeError, ValueError):
        return 0


def total_reps_for_group(session: dict, group: str) -> int | None:
    entries = _parse_entries(session.get("entries"))
    matching = [entry for entry in entries if entry.get("group") == group]
    if not matching:
        return None
    total = 0
    for entry in matching:
        total += sum(_row_reps(row) for row in entry.get("setRows", []))
    return total


def compute_loads(sessions: list) -> dict[str, float]:
    loads: dict[str, float] = {g: 0.0 for g in MUSCLE_GROUPS}
    for s in sessions:
        for g in _parse_groups(s["groups"]):
            if g in loads:
                bump = session_bump_with_reps(s["rpe"], total_reps_for_group(s, g))
                loads[g] = min(4.0, loads[g] + bump)
    return loads


def load_to_risk(load: float) -> int:
    if load == 0:   return 0
    if load < 1.0:  return 1
    if load < 2.0:  return 2
    if load < 3.5:  return 3
    return 4


def aggregate_score(loads: dict[str, float]) -> int:
    vals = [v for v in loads.values() if v > 0]
    if not vals:
        return 0
    avg = sum(vals) / len(vals)
    mx = max(vals)
    return min(100, round(avg * 12 + mx * 14))


def compute_trend(sessions: list, days: int = 14) -> list[dict]:
    today = date.today()
    trend = []
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.isoformat()
        day_sessions = [s for s in sessions if s["date"] <= day_str]
        score = aggregate_score(compute_loads(day_sessions))
        trend.append({"d": day.strftime("%b %-d"), "score": score})
    return trend


def make_recommendation(group: str, level: str) -> str:
    label = MUSCLE_LABEL.get(group, group)
    return _RECOMMENDATIONS.get(level, _RECOMMENDATIONS["none"]).format(label=label)
