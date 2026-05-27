import os
import libsql_client
from dotenv import load_dotenv

load_dotenv()

# Local dev fallback: file:tendon.db  — set TURSO_DATABASE_URL in .env for prod
# libsql:// → https:// so libsql-client uses HTTP rather than WebSocket
_raw   = os.environ.get("TURSO_DATABASE_URL", "file:tendon.db")
_URL   = _raw.replace("libsql://", "https://", 1)
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
            username             TEXT PRIMARY KEY,
            email                TEXT,
            first_name           TEXT NOT NULL DEFAULT '',
            last_name            TEXT NOT NULL DEFAULT '',
            password_hash        TEXT,
            gender               TEXT NOT NULL DEFAULT '',
            age                  INTEGER,
            security_question    TEXT,
            security_answer_hash TEXT
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
        """CREATE TABLE IF NOT EXISTS notes (
            username   TEXT PRIMARY KEY REFERENCES users(username),
            body       TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""",
        "CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username)",
    ])
    for migration in [
        "ALTER TABLE users ADD COLUMN password_hash TEXT",
        "ALTER TABLE users ADD COLUMN email TEXT",
        "ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE users ADD COLUMN last_name TEXT NOT NULL DEFAULT ''",
        "ALTER TABLE users ADD COLUMN security_question TEXT",
        "ALTER TABLE users ADD COLUMN security_answer_hash TEXT",
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)",
    ]:
        try:
            await _client.execute(migration)
        except Exception:
            pass


def row_to_dict(columns, row) -> dict:
    return {columns[i]: row[i] for i in range(len(columns))}


async def close_db() -> None:
    global _client
    if _client:
        await _client.close()
        _client = None
