import os
import libsql_client
from dotenv import load_dotenv

load_dotenv()

# Local dev fallback: file:tendon.db  — set TURSO_DATABASE_URL in .env for prod
_URL   = os.environ.get("TURSO_DATABASE_URL", "file:tendon.db")
_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "")

_client: libsql_client.Client | None = None


def get_client() -> libsql_client.Client:
    assert _client is not None, "DB not initialised — call init_db() first"
    return _client


async def init_db() -> None:
    global _client
    _client = libsql_client.create_client(url=_URL, auth_token=_TOKEN)
    await _client.batch([
        """CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            gender   TEXT NOT NULL DEFAULT '',
            age      INTEGER
        )""",
        """CREATE TABLE IF NOT EXISTS sessions (
            id       TEXT PRIMARY KEY,
            username TEXT NOT NULL REFERENCES users(username),
            date     TEXT NOT NULL,
            name     TEXT NOT NULL,
            groups   TEXT NOT NULL,
            rpe      INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            soreness INTEGER NOT NULL DEFAULT 5,
            entries  TEXT
        )""",
        "CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username)",
    ])


async def close_db() -> None:
    global _client
    if _client:
        await _client.close()
        _client = None
