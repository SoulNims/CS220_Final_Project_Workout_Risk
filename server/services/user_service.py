from datetime import datetime, timezone

from store.data_store import store


def get_or_create_user(username: str) -> dict:
    if username not in store.users:
        store.users[username] = {
            "username": username,
            "created_at": datetime.now(timezone.utc),
        }
        store.workouts[username] = []
        store.risk_history[username] = []
    return store.users[username]


def user_exists(username: str) -> bool:
    return username in store.users
