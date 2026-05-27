import os
import sqlite3
import sys
from pathlib import Path

# Point at a local test DB before importing the app
os.environ.setdefault("TURSO_DATABASE_URL", "file:test_tendon.db")
os.environ.setdefault("TURSO_AUTH_TOKEN", "")

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient

from main import app

_TEST_DB = "test_tendon.db"


@pytest.fixture(scope="session")
def client():
    # TestClient as context manager runs the async lifespan (init_db / close_db)
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_db():
    yield
    # Use sqlite3 directly — the local file: URL is a plain SQLite file
    if Path(_TEST_DB).exists():
        conn = sqlite3.connect(_TEST_DB)
        conn.execute("DELETE FROM notes")
        conn.execute("DELETE FROM sessions")
        conn.execute("DELETE FROM users")
        conn.commit()
        conn.close()
