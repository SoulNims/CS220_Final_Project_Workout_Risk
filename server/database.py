import sqlite3
import os

DB_PATH = os.environ.get("DB_PATH", "tendon.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            gender   TEXT NOT NULL DEFAULT '',
            age      INTEGER
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id       TEXT PRIMARY KEY,
            username TEXT NOT NULL REFERENCES users(username),
            date     TEXT NOT NULL,
            name     TEXT NOT NULL,
            groups   TEXT NOT NULL,
            rpe      INTEGER NOT NULL,
            duration INTEGER NOT NULL,
            soreness INTEGER NOT NULL DEFAULT 5,
            entries  TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);
    """)
    conn.commit()
    conn.close()
