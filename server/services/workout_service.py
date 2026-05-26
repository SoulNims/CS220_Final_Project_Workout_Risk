from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException

from models.schemas import WorkoutCreate
from services.user_service import user_exists
from store.data_store import store


def ensure_user(username: str) -> None:
    if not user_exists(username):
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")


def create_workout(username: str, workout: WorkoutCreate) -> dict:
    ensure_user(username)
    created = {
        "id": str(uuid4()),
        "username": username,
        "muscle_group": workout.muscle_group,
        "sets": workout.sets,
        "reps": workout.reps,
        "intensity": float(workout.intensity),
        "logged_at": datetime.now(timezone.utc),
    }
    store.workouts[username].append(created)
    return created


def get_workouts(username: str) -> list[dict]:
    ensure_user(username)
    return sorted(
        store.workouts[username],
        key=lambda workout: workout["logged_at"],
        reverse=True,
    )


def delete_workout(username: str, workout_id: str) -> None:
    ensure_user(username)
    before_count = len(store.workouts[username])
    store.workouts[username] = [
        workout for workout in store.workouts[username] if workout["id"] != workout_id
    ]
    if len(store.workouts[username]) == before_count:
        raise HTTPException(status_code=404, detail="Workout not found")
